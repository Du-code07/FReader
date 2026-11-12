package com.freader.my_ebook_reader

import android.content.Context
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import android.content.ContentValues
import android.os.Environment
import android.provider.MediaStore
import android.view.ViewGroup
import android.webkit.WebView
import android.graphics.pdf.PdfDocument
import android.graphics.pdf.PdfRenderer
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors
import java.util.zip.ZipEntry
import java.util.zip.ZipFile
import kotlin.math.sqrt

class MainActivity : FlutterActivity(), SensorEventListener {
    private val METHOD_CHANNEL = "ebook_reader/volume_control"
    private val EVENT_CHANNEL = "ebook_reader/volume_events"
    private val PDF_CHANNEL = "ebook_reader/pdf_renderer"

    private var isVolumeInterceptEnabled = false
    private var eventSink: EventChannel.EventSink? = null
    private var pdfMethodChannel: MethodChannel? = null

    private var isVolUpPressed = false
    private var isVolDownPressed = false
    private var comboTriggered = false
    private var lastVolUpDownTime = 0L
    private var lastVolDownDownTime = 0L
    private var lastVolUpEventTime = 0L
    private var lastVolDownEventTime = 0L
    private val mainHandler = Handler(Looper.getMainLooper())
    private var pendingVolUpRunnable: Runnable? = null
    private var pendingVolDownRunnable: Runnable? = null

    private var lastSpenSingleTime = 0L
    private var wasStylusButtonPressed = false
    private var mediaSession: MediaSession? = null

    private var sensorManager: SensorManager? = null
    private var accelerometer: Sensor? = null
    private var accelCurrent = SensorManager.GRAVITY_EARTH
    private var accelLast = SensorManager.GRAVITY_EARTH
    private var shakeAccel = 0.0f
    private var lastShakeTimestamp = 0L
    private var lastShakePeakTime = 0L
    private var shakeCount = 0
    private var firstShakeTime = 0L
    private val thumbExecutor = Executors.newFixedThreadPool(4)
    private val REQ_SCAN_CAMERA = 4821
    private var pendingCameraResult: MethodChannel.Result? = null
    private var pendingCameraFile: File? = null

    // 상단 상태표시줄을 한번 내렸을 때 약 1.5초 후 다시 숨김.
    // 예전처럼 0.75초마다 계속 확인하는 반복 작업은 배터리를 소모하므로, 상태표시줄이 나타날 때(창 인셋 변경)만 처리
    private var isActivityResumed = false
    private val reHideStatusBarRunnable = Runnable {
        if (isActivityResumed && isStatusBarCurrentlyVisible()) hideSystemStatusBar()
    }

    private fun scheduleStatusBarReHide() {
        mainHandler.removeCallbacks(reHideStatusBarRunnable)
        mainHandler.postDelayed(reHideStatusBarRunnable, 1500L)
    }

    // 흔들기(화면 잠금 해제)용 가속도 센서는 뷰어에서 '화면 잠금'이 켜져 있을 때만 켠다
    private var shakeListeningRequested = false

    private fun isStatusBarCurrentlyVisible(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val rootInsets = window?.decorView?.rootWindowInsets
                rootInsets?.isVisible(WindowInsets.Type.statusBars()) == true
            } else {
                @Suppress("DEPRECATION")
                (window.decorView.systemUiVisibility and View.SYSTEM_UI_FLAG_FULLSCREEN) == 0
            }
        } catch (_: Exception) {
            false
        }
    }

    // 서재(첫 화면): 상태표시줄은 늘 보이고, 내비게이션 바는 버튼 방식일 때만 보임. 파일 열람 중에는 모두 숨김
    @Volatile private var libraryBars = true

    /// 내비게이션 바가 버튼(3버튼·2버튼) 방식인가 (제스처 방식이면 false)
    private fun isButtonNavigation(): Boolean = try {
        android.provider.Settings.Secure.getInt(contentResolver, "navigation_mode", 0) != 2
    } catch (_: Throwable) { true }

    private fun showLibraryBars() {
        try {
            window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.setDecorFitsSystemWindows(false)
                window.insetsController?.let { controller ->
                    controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_DEFAULT
                    controller.show(WindowInsets.Type.statusBars())
                    if (isButtonNavigation()) controller.show(WindowInsets.Type.navigationBars())
                    else controller.hide(WindowInsets.Type.navigationBars())
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                )
            }
        } catch (_: Throwable) {}
    }

    private fun hideSystemStatusBar(alsoHideNavBar: Boolean = false) {
        if (libraryBars) {
            showLibraryBars()
            return
        }
        try {
            window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
            window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val lp = window.attributes
                val desiredCutout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                } else {
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
                }
                if (lp.layoutInDisplayCutoutMode != desiredCutout) {
                    lp.layoutInDisplayCutoutMode = desiredCutout
                    window.attributes = lp
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.setDecorFitsSystemWindows(false)
                window.insetsController?.let { controller ->
                    controller.systemBarsBehavior =
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    // 중요: 태블릿 OneUI에서 navigationBars()와 statusBars()를 묶어서 호출하면 태스크바 때문에 상태표시줄 숨김 애니메이션이 취소되므로 반드시 분리!
                    controller.hide(WindowInsets.Type.statusBars())
                    if (alsoHideNavBar) {
                        try {
                            controller.hide(WindowInsets.Type.navigationBars())
                        } catch (_: Exception) {}
                    }
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
            }
        } catch (_: Exception) {}
    }

    private fun applyRequestedScreenOrientation(mode: String) {
        requestedOrientation = when (mode) {
            "landscape" -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
            "portrait" -> ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT
            else -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }
        hideSystemStatusBar()
        mainHandler.postDelayed({ hideSystemStatusBar() }, 180L)
        mainHandler.postDelayed({ hideSystemStatusBar() }, 450L)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        hideSystemStatusBar(alsoHideNavBar = true)
        mainHandler.postDelayed({ hideSystemStatusBar(alsoHideNavBar = true) }, 250L)
        mainHandler.postDelayed({ hideSystemStatusBar(alsoHideNavBar = true) }, 600L)

        window.decorView.setOnApplyWindowInsetsListener { v, insets ->
            val statusBarVisible = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                insets.isVisible(WindowInsets.Type.statusBars())
            } else {
                @Suppress("DEPRECATION")
                insets.systemWindowInsetTop > 0
            }
            if (statusBarVisible && isActivityResumed && !libraryBars) {
                scheduleStatusBarReHide()
            }
            v.onApplyWindowInsets(insets)
        }
    }

    override fun onPostResume() {
        super.onPostResume()
        hideSystemStatusBar()
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        hideSystemStatusBar()
        mainHandler.postDelayed({ hideSystemStatusBar() }, 150L)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemStatusBar()
            mainHandler.postDelayed({ hideSystemStatusBar() }, 120L)
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        hideSystemStatusBar()
        mainHandler.postDelayed({ hideSystemStatusBar() }, 200L)
        mainHandler.postDelayed({ hideSystemStatusBar() }, 600L)
        setupSpenMediaSession()
        setupShakeSensor()

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, METHOD_CHANNEL)
            .setMethodCallHandler { call, result ->
                if (call.method == "setIntercept") {
                    val enabled = call.argument<Boolean>("enabled") ?: false
                    isVolumeInterceptEnabled = enabled
                    if (!enabled) {
                        setShakeListening(false)
                    }
                    updateMediaSessionState(enabled)
                    result.success(null)
                } else if (call.method == "statusBarHeight") {
                    // 상태표시줄 본래 높이(px) — 태블릿에서 상단바를 이만큼 항상 내려 둔다
                    // 실제 화면의 상태표시줄 높이(숨겨져 있어도) — 없으면 시스템 값
                    var px = 0
                    if (Build.VERSION.SDK_INT >= 30) {
                        try {
                            px = window.decorView.rootWindowInsets
                                ?.getInsetsIgnoringVisibility(android.view.WindowInsets.Type.statusBars())?.top ?: 0
                        } catch (_: Throwable) {}
                    }
                    if (px <= 0) {
                        val id = resources.getIdentifier("status_bar_height", "dimen", "android")
                        if (id > 0) px = resources.getDimensionPixelSize(id)
                    }
                    result.success(px)
                } else if (call.method == "setShakeListening") {
                    setShakeListening(call.argument<Boolean>("enabled") ?: false)
                    result.success(null)
                } else if (call.method == "setScreenOrientation") {
                    val mode = call.argument<String>("mode") ?: "unspecified"
                    runOnUiThread {
                        applyRequestedScreenOrientation(mode)
                        result.success(true)
                    }
                } else {
                    result.notImplemented()
                }
            }

        EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL)
            .setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    eventSink = events
                }
                override fun onCancel(arguments: Any?) {
                    eventSink = null
                }
            })

        val pChannel = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, PDF_CHANNEL)
        pdfMethodChannel = pChannel
        pChannel.setMethodCallHandler { call, result ->
            if (call.method == "pdfSearchSupported") {
                result.success(pdfSearchSupported())
            } else if (call.method == "pdfSearch") {
                // 파일 내 단어 검색: 쪽마다 찾은 곳의 사각형(쪽 크기 대비 0~1)을 돌려 준다
                val path = call.argument<String>("path") ?: ""
                val query = call.argument<String>("query") ?: ""
                if (!pdfSearchSupported()) {
                    result.error("UNSUPPORTED", "PDF search needs Android 15 or a recent system update", null)
                    return@setMethodCallHandler
                }
                thumbExecutor.execute {
                    try {
                        val found = searchPdfText(path, query)
                        runOnUiThread { result.success(found) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.error("SEARCH_ERR", e.message, null) }
                    }
                }
            } else if (call.method == "pdfLines") {
                // 목차용: 쪽마다의 줄 [from, to) {t, x0, x1, y, h, (sw)} (지원하지 않는 기기에서는 빈 목록)
                val path = call.argument<String>("path") ?: ""
                val from = call.argument<Int>("from") ?: 0
                val to = call.argument<Int>("to") ?: 0
                val withBold = call.argument<Boolean>("bold") ?: false
                if (!pdfSearchSupported()) {
                    result.success(emptyList<Any>())
                    return@setMethodCallHandler
                }
                thumbExecutor.execute {
                    try {
                        val lines = pdfLines(path, from, to, withBold)
                        runOnUiThread { result.success(lines) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.success(emptyList<Any>()) }
                    }
                }
            } else if (call.method == "renderPdfFirstPageThumbnail") {
                val pdfPath = call.argument<String>("pdfPath") ?: call.argument<String>("filePath")
                val thumbPath = call.argument<String>("thumbPath") ?: call.argument<String>("outPath")
                val requestedW = call.argument<Int>("maxWidth") ?: 420
                if (pdfPath == null || thumbPath == null) {
                    result.error("INVALID_ARGS", "Missing paths", null)
                    return@setMethodCallHandler
                }
                thumbExecutor.execute {
                    try {
                        val thumbFile = File(thumbPath)
                        if (thumbFile.exists() && thumbFile.length() > 100L) {
                            runOnUiThread { result.success(thumbFile.absolutePath) }
                            return@execute
                        }
                        thumbFile.parentFile?.mkdirs()
                        val pdfFile = File(pdfPath)
                        if (!pdfFile.exists()) {
                            runOnUiThread { result.success(null) }
                            return@execute
                        }
                        val pfd = ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
                        val renderer = PdfRenderer(pfd)
                        if (renderer.pageCount > 0) {
                            val page = renderer.openPage(0)
                            val targetW = requestedW.coerceIn(320, 640)
                            val scale = targetW.toFloat() / page.width.toFloat().coerceAtLeast(1f)
                            val w = targetW
                            val h = (page.height * scale).toInt().coerceIn(320, 960)
                            val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                            bitmap.eraseColor(Color.WHITE)
                            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                            page.close()
                            FileOutputStream(thumbFile).use { out ->
                                bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
                            }
                            bitmap.recycle()
                        }
                        renderer.close()
                        pfd.close()
                        runOnUiThread {
                            result.success(if (thumbFile.exists()) thumbFile.absolutePath else null)
                        }
                    } catch (e: Throwable) {
                        runOnUiThread { result.success(null) }
                    }
                }
            } else if (call.method == "extractArchiveFirstImageThumbnail") {
                val archivePath = call.argument<String>("filePath")
                val thumbPath = call.argument<String>("outPath")
                val requestedW = call.argument<Int>("maxWidth") ?: 420
                if (archivePath == null || thumbPath == null) {
                    result.error("INVALID_ARGS", "Missing paths", null)
                    return@setMethodCallHandler
                }
                thumbExecutor.execute {
                    try {
                        val thumbFile = File(thumbPath)
                        if (thumbFile.exists() && thumbFile.length() > 100L) {
                            runOnUiThread { result.success(thumbFile.absolutePath) }
                            return@execute
                        }
                        val srcFile = File(archivePath)
                        if (!srcFile.exists()) {
                            runOnUiThread { result.success(null) }
                            return@execute
                        }
                        thumbFile.parentFile?.mkdirs()
                        ZipFile(srcFile).use { zip ->
                            val isEpub = archivePath.lowercase().endsWith(".epub")
                            val entries = zip.entries()
                            // EPUB: 책에 표지로 적혀 있는 그림만 쓴다 (없으면 표지 없이 EPUB 아이콘)
                            var bestEntry: ZipEntry? = if (isEpub) findEpubCover(zip) else null
                            var bestName = ""
                            while (!isEpub && entries.hasMoreElements()) {
                                val entry = entries.nextElement()
                                if (entry.isDirectory) continue
                                val lower = entry.name.lowercase()
                                if (lower.contains("__macosx") || lower.substringAfterLast('/').startsWith("._")) continue
                                if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".webp")) {
                                    if (bestEntry == null || compareNaturalStrings(lower, bestName) < 0) {
                                        bestEntry = entry
                                        bestName = lower
                                    }
                                }
                            }
                            if (bestEntry != null) {
                                val rawBytes = zip.getInputStream(bestEntry).use { it.readBytes() }
                                val boundsOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                                BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size, boundsOpts)
                                var sampleSize = 1
                                val targetW = requestedW.coerceIn(320, 640)
                                while (boundsOpts.outWidth / (sampleSize * 2) >= targetW) {
                                    sampleSize *= 2
                                }
                                val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
                                val decoded = BitmapFactory.decodeByteArray(rawBytes, 0, rawBytes.size, decodeOpts)
                                if (decoded != null) {
                                    FileOutputStream(thumbFile).use { out ->
                                        decoded.compress(Bitmap.CompressFormat.JPEG, 85, out)
                                    }
                                    decoded.recycle()
                                }
                            }
                        }
                        runOnUiThread {
                            result.success(if (thumbFile.exists() && thumbFile.length() > 64L) thumbFile.absolutePath else null)
                        }
                    } catch (e: Throwable) {
                        runOnUiThread { result.success(null) }
                    }
                }
            } else if (call.method == "renderPdfToImages") {
                val pdfPath = call.argument<String>("pdfPath")
                val outDirPath = call.argument<String>("outDirPath")
                if (pdfPath == null || outDirPath == null) {
                    result.error("INVALID_ARGS", "Missing paths", null)
                    return@setMethodCallHandler
                }
                Thread {
                    try {
                        val outDir = File(outDirPath)
                        if (!outDir.exists()) outDir.mkdirs()
                        val pfd = ParcelFileDescriptor.open(File(pdfPath), ParcelFileDescriptor.MODE_READ_ONLY)
                        val renderer = PdfRenderer(pfd)
                        val pagePaths = ArrayList<String>()

                        for (i in 0 until renderer.pageCount) {
                            val pageFile = File(outDir, "page_${String.format("%04d", i)}.jpg")
                            if (!pageFile.exists() || pageFile.length() == 0L) {
                                val page = renderer.openPage(i)
                                val scale = (1440f / page.width.toFloat().coerceAtLeast(1f)).coerceIn(1.5f, 2.5f)
                                val width = (page.width * scale).toInt().coerceAtLeast(720)
                                val height = (page.height * scale).toInt().coerceAtLeast(960)
                                val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                                bitmap.eraseColor(Color.WHITE)
                                page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                                page.close()
                                FileOutputStream(pageFile).use { out ->
                                    bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
                                }
                                bitmap.recycle()
                            }
                            pagePaths.add(pageFile.absolutePath)
                        }
                        renderer.close()
                        pfd.close()
                        runOnUiThread { result.success(pagePaths) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.error("PDF_ERR", e.message, null) }
                    }
                }.start()
            } else if (call.method == "cropTrimImage") {
                // 스크롤 보기용 쪽 그림: 그림 파일을 쪽 자리만 잘라 위아래 빈 종이를 걷어 냄
                val inPath = call.argument<String>("input")
                val outPath = call.argument<String>("output")
                if (inPath == null || outPath == null) {
                    result.error("ARG", "path", null)
                    return@setMethodCallHandler
                }
                val crop = call.argument<List<Number>>("crop")
                val trim = call.argument<Boolean>("trim") ?: true
                val paper = (call.argument<Number>("paper") ?: 0xFFFFFFFFL).toLong().toInt()
                val pad = ((call.argument<Number>("pad") ?: 0.035).toFloat()).coerceIn(0f, 0.3f)
                val trimTop = call.argument<Boolean>("trimTop") ?: true
                Thread {
                    try {
                        val src = BitmapFactory.decodeFile(inPath) ?: throw IllegalStateException("decode")
                        val size = cropTrimSave(src, crop, trim, paper, pad, outPath, trimTop)
                        runOnUiThread { result.success(listOf(size[0], size[1])) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.error("CROP_ERR", e.message, null) }
                    }
                }.start()
            } else if (call.method == "requestNotificationPermission") {
                // 안드로이드 13 이상: 알림 허용을 한 번 물음 (이미 허용했거나 거절했으면 조용히)
                if (Build.VERSION.SDK_INT >= 33 &&
                    checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    try { requestPermissions(arrayOf("android.permission.POST_NOTIFICATIONS"), 4711) } catch (_: Throwable) {}
                }
                result.success(null)
            } else if (call.method == "showNotification") {
                // 휴대폰 상태 표시줄 알림 (누르면 앱으로). 알림을 쓸 수 없으면 false
                val title = call.argument<String>("title") ?: "FReader"
                val text = call.argument<String>("text") ?: ""
                val id = (call.argument<Number>("id") ?: 1).toInt()
                result.success(postStatusNotification(title, text, id))
            } else if (call.method == "captureScrollPage") {
                // 스크롤 보기 준비용 숨은 문서 화면(주소에 freaderScroll=1)을 바로 그림으로:
                // 화면(UI) 스레드에서는 그리기만 하고, 자르기·여백 걷기·저장은 다른 스레드에서 (화면이 버벅이지 않게)
                val outPath = call.argument<String>("output")
                if (outPath == null) {
                    result.error("ARG", "path", null)
                    return@setMethodCallHandler
                }
                val crop = call.argument<List<Number>>("crop")
                val paper = (call.argument<Number>("paper") ?: 0xFFFFFFFFL).toLong().toInt()
                val pad = ((call.argument<Number>("pad") ?: 0.035).toFloat()).coerceIn(0f, 0.3f)
                val trimTop = call.argument<Boolean>("trimTop") ?: true
                val tag = call.argument<String>("tag")
                val webView = findScrollWebView(window.decorView, tag)
                if (webView == null || webView.width <= 0 || webView.height <= 0) {
                    result.error("NO_WEBVIEW", "scroll webview not found", null)
                    return@setMethodCallHandler
                }
                try {
                    val bitmap = Bitmap.createBitmap(webView.width, webView.height, Bitmap.Config.ARGB_8888)
                    val canvas = Canvas(bitmap)
                    canvas.drawColor(paper)
                    webView.draw(canvas)
                    Thread {
                        try {
                            val size = cropTrimSave(bitmap, crop, true, paper, pad, outPath, trimTop)
                            runOnUiThread { result.success(listOf(size[0], size[1])) }
                        } catch (e: Throwable) {
                            runOnUiThread { result.error("CROP_ERR", e.message, null) }
                        }
                    }.start()
                } catch (e: Throwable) {
                    result.error("CAPTURE_ERR", e.message, null)
                }
            } else if (call.method == "wakeHiddenWebViews") {
                // 서재 표지(첫 페이지) 만들기용 화면 밖 WebView: 숨김 상태면 그리기를 멈추므로
                // 완전히 투명하게 + 화면 밖으로 옮긴 뒤 '보이는' 상태로 둔다 (사용자에게는 안 보임)
                var count = 0
                fun wake(v: View) {
                    if (v is WebView && v.visibility == View.INVISIBLE) {
                        v.alpha = 0f
                        v.translationX = -100000f
                        v.visibility = View.VISIBLE
                        count++
                    }
                    if (v is ViewGroup) {
                        for (i in 0 until v.childCount) wake(v.getChildAt(i))
                    }
                }
                wake(window.decorView)
                result.success(count)
            } else if (call.method == "snapshotWebView") {
                // 위로 밀어 넘길 때 지금 페이지를 잠깐 붙잡아 두는 그림 (JPEG 바이트, 빈 곳은 배경색)
                val webView = findLargestWebView(window.decorView)
                if (webView == null || webView.width <= 0 || webView.height <= 0) {
                    result.error("NO_WEBVIEW", "WebView not found", null)
                    return@setMethodCallHandler
                }
                try {
                    val bg = (call.argument<Number>("background") ?: 0xFF000000L).toLong().toInt()
                    val scale = ((call.argument<Number>("scale") ?: 1.0).toFloat()).coerceIn(0.25f, 1f)
                    val bw = maxOf(1, (webView.width * scale).toInt())
                    val bh = maxOf(1, (webView.height * scale).toInt())
                    val bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888)
                    val canvas = Canvas(bmp)
                    canvas.drawColor(bg)
                    canvas.scale(bw.toFloat() / webView.width, bh.toFloat() / webView.height)
                    canvas.translate(-webView.scrollX.toFloat(), -webView.scrollY.toFloat())
                    webView.draw(canvas)
                    // 스크롤 보기용: 쪽 자리만 잘라 냄 (crop = [x, y, w, h], 화면 대비 0~1)
                    val crop = call.argument<List<Number>>("crop")
                    val shot = if (crop != null && crop.size == 4) {
                        val cx = (crop[0].toFloat() * bw).toInt().coerceIn(0, bw - 1)
                        val cy = (crop[1].toFloat() * bh).toInt().coerceIn(0, bh - 1)
                        val cw = (crop[2].toFloat() * bw).toInt().coerceIn(1, bw - cx)
                        val ch = (crop[3].toFloat() * bh).toInt().coerceIn(1, bh - cy)
                        Bitmap.createBitmap(bmp, cx, cy, cw, ch).also { if (it !== bmp) bmp.recycle() }
                    } else bmp
                    val transparent = (bg ushr 24) == 0
                    Thread {
                        try {
                            val bmp = shot
                            val out = java.io.ByteArrayOutputStream()
                            // 배경이 투명(종이 질감 위)이면 투명도를 살리는 PNG로
                            if (transparent) bmp.compress(Bitmap.CompressFormat.PNG, 100, out)
                            else bmp.compress(Bitmap.CompressFormat.JPEG, 88, out)
                            bmp.recycle()
                            val bytes = out.toByteArray()
                            runOnUiThread { result.success(bytes) }
                        } catch (e: Throwable) {
                            runOnUiThread { result.error("CAPTURE_ERR", e.message, null) }
                        }
                    }.start()
                } catch (e: Throwable) {
                    result.error("CAPTURE_ERR", e.message, null)
                }
            } else if (call.method == "captureWebView") {
                // EPUB 본문(WebView) 화면을 그림 파일로 저장 (PDF 내보내기용)
                val outPath = call.argument<String>("path")
                val webView = findLargestWebView(window.decorView)
                if (outPath == null || webView == null || webView.width <= 0 || webView.height <= 0) {
                    result.error("NO_WEBVIEW", "WebView not found", null)
                    return@setMethodCallHandler
                }
                try {
                    val bmp = Bitmap.createBitmap(webView.width, webView.height, Bitmap.Config.ARGB_8888)
                    val canvas = Canvas(bmp)
                    canvas.translate(-webView.scrollX.toFloat(), -webView.scrollY.toFloat())
                    webView.draw(canvas)
                    Thread {
                        try {
                            FileOutputStream(File(outPath)).use { out -> bmp.compress(Bitmap.CompressFormat.PNG, 100, out) }
                            bmp.recycle()
                            runOnUiThread { result.success(outPath) }
                        } catch (e: Throwable) {
                            runOnUiThread { result.error("CAPTURE_ERR", e.message, null) }
                        }
                    }.start()
                } catch (e: Throwable) {
                    result.error("CAPTURE_ERR", e.message, null)
                }
            } else if (call.method == "exportPdfWithMemos") {
                // 페이지 그림 + 필기(+텍스트 메모)를 합쳐 PDF로 만들고 다운로드 폴더에 저장
                @Suppress("UNCHECKED_CAST")
                val pages = call.argument<List<Map<String, Any?>>>("pages")
                val fileName = call.argument<String>("fileName") ?: "FReader_export.pdf"
                val fallbackDir = call.argument<String>("fallbackDir")
                // true: 다운로드 폴더에 저장하지 않고 임시 파일 경로를 돌려줌 (앱이 목차를 넣은 뒤 savePdfFile로 저장)
                val keepTemp = call.argument<Boolean>("keepTemp") ?: false
                if (pages == null || pages.isEmpty()) {
                    result.error("INVALID_ARGS", "No pages", null)
                    return@setMethodCallHandler
                }
                Thread {
                    try {
                        val saved = exportPdfWithMemos(pages, fileName, fallbackDir, keepTemp)
                        runOnUiThread { result.success(saved) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.error("EXPORT_ERR", e.message, null) }
                    }
                }.start()
            } else if (call.method == "savePdfFile") {
                // 임시 PDF를 다운로드/FReader 폴더에 저장하고 임시 파일은 지움
                val path = call.argument<String>("path") ?: ""
                val fileName = call.argument<String>("fileName") ?: "FReader_export.pdf"
                val fallbackDir = call.argument<String>("fallbackDir")
                Thread {
                    val src = File(path)
                    try {
                        val saved = savePdfToDownloads(src, fileName, fallbackDir)
                        runOnUiThread { result.success(saved) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.error("EXPORT_ERR", e.message, null) }
                    } finally {
                        src.delete()
                    }
                }.start()
            } else if (call.method == "ocrLines") {
                // 그림 속 글자 읽기 (기기 안에서만 처리): 줄마다 {t, x, y, w, h} (그림 크기 대비 0~1)
                val path = call.argument<String>("path") ?: ""
                thumbExecutor.execute {
                    try {
                        val lines = ocrLines(path)
                        runOnUiThread { result.success(lines) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.success(emptyList<Any>()) }
                    }
                }
            } else if (call.method == "pdfTextBoxes") {
                // 내보내기용: 쪽마다 글과 위치(쪽 크기 대비 0~1). 지원하지 않는 기기에서는 빈 목록
                val path = call.argument<String>("path") ?: ""
                if (!pdfSearchSupported()) {
                    result.success(emptyList<Any>())
                    return@setMethodCallHandler
                }
                thumbExecutor.execute {
                    try {
                        val boxes = pdfTextBoxes(path)
                        runOnUiThread { result.success(boxes) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.success(emptyList<Any>()) }
                    }
                }
            } else if (call.method == "mergePdfs") {
                val inputPaths = call.argument<List<String>>("inputPaths")
                val outputPath = call.argument<String>("outputPath")
                if (inputPaths == null || outputPath == null || inputPaths.isEmpty()) {
                    result.error("INVALID_ARGS", "Missing inputPaths or outputPath", null)
                    return@setMethodCallHandler
                }
                Thread {
                    val outPdf = PdfDocument()
                    try {
                        var globalPageNum = 1
                        val totalFiles = inputPaths.size
                        for ((fileIdx, path) in inputPaths.withIndex()) {
                            val f = File(path)
                            if (!f.exists()) continue
                            val currentIdx = fileIdx + 1
                            val currentName = f.name
                            mainHandler.post {
                                try {
                                    pdfMethodChannel?.invokeMethod(
                                        "onPdfMergeProgress",
                                        mapOf(
                                            "current" to currentIdx,
                                            "total" to totalFiles,
                                            "fileName" to currentName
                                        )
                                    )
                                } catch (_: Exception) {}
                            }
                            val pfd = ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY)
                            val renderer = PdfRenderer(pfd)
                            for (i in 0 until renderer.pageCount) {
                                val srcPage = renderer.openPage(i)
                                val scale = (1440f / srcPage.width.toFloat().coerceAtLeast(1f)).coerceIn(1.5f, 2.2f)
                                val w = (srcPage.width * scale).toInt().coerceAtLeast(720)
                                val h = (srcPage.height * scale).toInt().coerceAtLeast(960)
                                val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                                bmp.eraseColor(Color.WHITE)
                                srcPage.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                                srcPage.close()

                                val pageInfo = PdfDocument.PageInfo.Builder(w, h, globalPageNum++).create()
                                val dstPage = outPdf.startPage(pageInfo)
                                dstPage.canvas.drawBitmap(bmp, 0f, 0f, null)
                                outPdf.finishPage(dstPage)
                                bmp.recycle()
                            }
                            renderer.close()
                            pfd.close()
                        }
                        val outFile = File(outputPath)
                        outFile.parentFile?.mkdirs()
                        FileOutputStream(outFile).use { outStream ->
                            outPdf.writeTo(outStream)
                        }
                        outPdf.close()
                        runOnUiThread { result.success(outFile.absolutePath) }
                    } catch (e: Throwable) {
                        try { outPdf.close() } catch (_: Exception) {}
                        runOnUiThread { result.error("MERGE_PDF_ERR", e.message, null) }
                    }
                }.start()
            } else if (call.method == "setScreenOrientation") {
                val mode = call.argument<String>("mode") ?: "unspecified"
                runOnUiThread {
                    applyRequestedScreenOrientation(mode)
                    result.success(true)
                }
            } else if (call.method == "capturePhotoWithCamera") {
                launchCameraForScan(result)
            } else if (call.method == "processScannedImage") {
                val inputPath = call.argument<String>("inputPath")
                val outputPath = call.argument<String>("outputPath")
                val mode = call.argument<String>("mode") ?: "scan_bw"
                val contrast = (call.argument<Number>("contrast")?.toFloat() ?: 0.55f).coerceIn(0f, 1f)
                val rotation = (call.argument<Number>("rotation")?.toInt() ?: 0)
                val crop = call.argument<List<Number>>("crop")
                val maxDim = (call.argument<Number>("maxDim")?.toInt() ?: 1800).coerceIn(600, 3200)
                if (inputPath == null || outputPath == null) {
                    result.error("INVALID_ARGS", "Missing inputPath or outputPath", null)
                    return@setMethodCallHandler
                }
                thumbExecutor.execute {
                    try {
                        val saved = processDocumentScanBitmap(
                            inputPath = inputPath,
                            outputPath = outputPath,
                            mode = mode,
                            contrast = contrast,
                            rotation = rotation,
                            crop = crop,
                            maxDim = maxDim
                        )
                        runOnUiThread { result.success(saved) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.error("SCAN_PROC_ERR", e.message, null) }
                    }
                }
            } else if (call.method == "createScannedPdf") {
                val imagePaths = call.argument<List<String>>("imagePaths")
                val outputPath = call.argument<String>("outputPath")
                if (imagePaths == null || outputPath == null || imagePaths.isEmpty()) {
                    result.error("INVALID_ARGS", "Missing imagePaths or outputPath", null)
                    return@setMethodCallHandler
                }
                Thread {
                    try {
                        val out = buildScannedPdfFromImages(imagePaths, outputPath)
                        runOnUiThread { result.success(out) }
                    } catch (e: Throwable) {
                        runOnUiThread { result.error("SCAN_PDF_ERR", e.message, null) }
                    }
                }.start()
            } else if (call.method == "setLibraryBars") {
                // 서재에서는 상태표시줄(과 버튼식 내비게이션 바)을 보이고, 파일을 열면 모두 숨김
                val on = call.argument<Boolean>("on") ?: true
                runOnUiThread {
                    libraryBars = on
                    hideSystemStatusBar(alsoHideNavBar = !on)
                    if (!on) mainHandler.postDelayed({ hideSystemStatusBar(alsoHideNavBar = true) }, 200L)
                    result.success(true)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun setupShakeSensor() {
        try {
            sensorManager = getSystemService(Context.SENSOR_SERVICE) as? SensorManager
            accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            accelCurrent = SensorManager.GRAVITY_EARTH
            accelLast = SensorManager.GRAVITY_EARTH
            shakeAccel = 0.0f
        } catch (_: Exception) {}
    }

    private fun setShakeListening(enabled: Boolean) {
        shakeListeningRequested = enabled
        if (enabled && isActivityResumed) {
            registerShakeSensorListener()
        } else if (!enabled) {
            try {
                sensorManager?.unregisterListener(this)
            } catch (_: Exception) {}
            shakeCount = 0
            shakeAccel = 0.0f
        }
    }

    private fun registerShakeSensorListener() {
        try {
            if (sensorManager == null || accelerometer == null) {
                setupShakeSensor()
            }
            accelerometer?.let {
                sensorManager?.unregisterListener(this, it)
                sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
            }
        } catch (_: Exception) {}
    }

    private fun compareNaturalStrings(a: String, b: String): Int {
        val reg = Regex("(\\d+)|(\\D+)")
        val ma = reg.findAll(a).map { it.value }.toList()
        val mb = reg.findAll(b).map { it.value }.toList()
        val len = minOf(ma.size, mb.size)
        for (i in 0 until len) {
            val pa = ma[i]
            val pb = mb[i]
            val na = pa.toBigIntegerOrNull()
            val nb = pb.toBigIntegerOrNull()
            val cmp = if (na != null && nb != null) na.compareTo(nb) else pa.compareTo(pb)
            if (cmp != 0) return cmp
        }
        return ma.size.compareTo(mb.size)
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (!isVolumeInterceptEnabled || event == null) return
        if (event.sensor.type != Sensor.TYPE_ACCELEROMETER) return

        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]
        val magnitude = sqrt((x * x + y * y + z * z).toDouble()).toFloat()
        accelLast = accelCurrent
        accelCurrent = magnitude
        val delta = kotlin.math.abs(accelCurrent - accelLast)
        shakeAccel = shakeAccel * 0.80f + delta
        val gForce = magnitude / SensorManager.GRAVITY_EARTH

        // 일상적인 흔들림이나 손 움직임에서는 반응하지 않도록 임계값을 높이고, 명확하게 2번 흔들었을 때만 해제되도록 설정
        if (gForce > 2.42f && shakeAccel > 11.8f) {
            val now = SystemClock.uptimeMillis()
            if (now - lastShakeTimestamp < 1100L) return
            // 한 번 흔드는 동작의 시작·멈춤이 2번으로 중복 인식되지 않도록 최소 220ms 간격 보장
            if (now - lastShakePeakTime < 220L) return
            lastShakePeakTime = now

            if (now - firstShakeTime > 800L) {
                shakeCount = 1
                firstShakeTime = now
            } else {
                shakeCount++
            }

            if (shakeCount >= 2) {
                shakeCount = 0
                shakeAccel = 0.0f
                lastShakeTimestamp = now
                mainHandler.post {
                    eventSink?.success("SHAKE_TOGGLE")
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    private fun handleInstantSpenClick() {
        val now = SystemClock.uptimeMillis()
        if (now - lastSpenSingleTime in 25L..420L) {
            lastSpenSingleTime = 0L
            eventSink?.success("SPEN_DOUBLE_REVERT")
        } else {
            lastSpenSingleTime = now
            eventSink?.success("SPEN_SINGLE")
        }
    }

    private fun handleDirectSpenDouble() {
        lastSpenSingleTime = 0L
        eventSink?.success("SPEN_DOUBLE")
    }

    private fun setupSpenMediaSession() {
        try {
            mediaSession = MediaSession(this, "FReaderSpenSession").apply {
                setCallback(object : MediaSession.Callback() {
                    override fun onMediaButtonEvent(mediaButtonIntent: android.content.Intent): Boolean {
                        if (!isVolumeInterceptEnabled) return super.onMediaButtonEvent(mediaButtonIntent)
                        @Suppress("DEPRECATION")
                        val ke = mediaButtonIntent.getParcelableExtra<KeyEvent>(android.content.Intent.EXTRA_KEY_EVENT)
                        if (ke != null && ke.action == KeyEvent.ACTION_DOWN && ke.repeatCount == 0) {
                            when (ke.keyCode) {
                                KeyEvent.KEYCODE_MEDIA_NEXT,
                                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                                    handleDirectSpenDouble()
                                    return true
                                }
                                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                                KeyEvent.KEYCODE_MEDIA_PLAY,
                                KeyEvent.KEYCODE_MEDIA_PAUSE,
                                KeyEvent.KEYCODE_HEADSETHOOK -> {
                                    handleInstantSpenClick()
                                    return true
                                }
                            }
                        }
                        return super.onMediaButtonEvent(mediaButtonIntent)
                    }

                    override fun onPlay() {
                        if (isVolumeInterceptEnabled) handleInstantSpenClick()
                    }

                    override fun onPause() {
                        if (isVolumeInterceptEnabled) handleInstantSpenClick()
                    }

                    override fun onSkipToNext() {
                        if (isVolumeInterceptEnabled) handleDirectSpenDouble()
                    }

                    override fun onSkipToPrevious() {
                        if (isVolumeInterceptEnabled) handleDirectSpenDouble()
                    }
                })

                val attrs = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
                setPlaybackToLocal(attrs)
            }
        } catch (_: Exception) {}
    }

    private fun playSilentAudioPulseToClaimMediaSession() {
        Thread {
            try {
                val sampleRate = 8000
                val numSamples = sampleRate / 10
                val silentBuf = ByteArray(numSamples * 2)
                val track = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(silentBuf.size)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()
                track.write(silentBuf, 0, silentBuf.size)
                track.play()
                Thread.sleep(120)
                track.stop()
                track.release()
            } catch (_: Exception) {}
        }.start()
    }

    private fun updateMediaSessionState(active: Boolean) {
        try {
            mediaSession?.let { session ->
                if (active) {
                    val state = PlaybackState.Builder()
                        .setActions(
                            PlaybackState.ACTION_PLAY or
                                PlaybackState.ACTION_PAUSE or
                                PlaybackState.ACTION_PLAY_PAUSE or
                                PlaybackState.ACTION_SKIP_TO_NEXT or
                                PlaybackState.ACTION_SKIP_TO_PREVIOUS
                        )
                        .setState(PlaybackState.STATE_PLAYING, 1L, 1.0f, SystemClock.elapsedRealtime())
                        .build()
                    session.setPlaybackState(state)
                    session.isActive = true
                    playSilentAudioPulseToClaimMediaSession()
                } else {
                    val state = PlaybackState.Builder()
                        .setState(PlaybackState.STATE_STOPPED, 0L, 0.0f, SystemClock.elapsedRealtime())
                        .build()
                    session.setPlaybackState(state)
                    session.isActive = false
                }
            }
        } catch (_: Exception) {}
    }

    override fun onResume() {
        super.onResume()
        isActivityResumed = true
        hideSystemStatusBar(alsoHideNavBar = true)
        mainHandler.postDelayed({ hideSystemStatusBar(alsoHideNavBar = true) }, 250L)
        scheduleStatusBarReHide()
        if (shakeListeningRequested) registerShakeSensorListener()
        if (isVolumeInterceptEnabled) {
            updateMediaSessionState(true)
        }
    }

    override fun onPause() {
        isActivityResumed = false
        mainHandler.removeCallbacks(reHideStatusBarRunnable)
        try {
            sensorManager?.unregisterListener(this)
        } catch (_: Exception) {}
        super.onPause()
    }

    override fun onDestroy() {
        isActivityResumed = false
        mainHandler.removeCallbacks(reHideStatusBarRunnable)
        try {
            sensorManager?.unregisterListener(this)
            mediaSession?.isActive = false
            mediaSession?.release()
        } catch (_: Exception) {}
        super.onDestroy()
    }

    private fun checkStylusButtonEvent(ev: MotionEvent?): Boolean {
        if (!isVolumeInterceptEnabled || ev == null) return false
        val isStylus = ev.isFromSource(InputDevice.SOURCE_STYLUS) ||
            (ev.pointerCount > 0 && (
                ev.getToolType(0) == MotionEvent.TOOL_TYPE_STYLUS ||
                    ev.getToolType(0) == MotionEvent.TOOL_TYPE_ERASER
                ))
        if (!isStylus) return false

        val btnState = ev.buttonState
        val pressed = (btnState and MotionEvent.BUTTON_STYLUS_PRIMARY) != 0 ||
            (btnState and MotionEvent.BUTTON_SECONDARY) != 0

        if (pressed && !wasStylusButtonPressed) {
            wasStylusButtonPressed = true
            handleInstantSpenClick()
            return true
        } else if (!pressed && wasStylusButtonPressed) {
            wasStylusButtonPressed = false
        }
        return false
    }

    override fun dispatchGenericMotionEvent(ev: MotionEvent?): Boolean {
        if (isVolumeInterceptEnabled) {
            checkStylusButtonEvent(ev)
        }
        return super.dispatchGenericMotionEvent(ev)
    }

    override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
        if (ev != null && (ev.actionMasked == MotionEvent.ACTION_DOWN || ev.actionMasked == MotionEvent.ACTION_UP)) {
            if (isStatusBarCurrentlyVisible()) {
                hideSystemStatusBar()
            }
        }
        if (isVolumeInterceptEnabled) {
            checkStylusButtonEvent(ev)
        }
        return super.dispatchTouchEvent(ev)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (isVolumeInterceptEnabled &&
            (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN)
        ) {
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (isVolumeInterceptEnabled &&
            (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN)
        ) {
            return true
        }
        return super.onKeyUp(keyCode, event)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val keyCode = event.keyCode
        val action = event.action

        if (isVolumeInterceptEnabled) {
            val now = SystemClock.uptimeMillis()
            if (isVolUpPressed && (now - lastVolUpEventTime > 1800L)) {
                isVolUpPressed = false
            }
            if (isVolDownPressed && (now - lastVolDownEventTime > 1800L)) {
                isVolDownPressed = false
            }
            if (!isVolUpPressed && !isVolDownPressed && (now - lastVolUpDownTime > 500L) && (now - lastVolDownDownTime > 500L)) {
                comboTriggered = false
            }

            if (keyCode == KeyEvent.KEYCODE_VOLUME_UP) {
                if (action == KeyEvent.ACTION_DOWN) {
                    lastVolUpEventTime = now
                    if (event.repeatCount == 0) {
                        lastVolUpDownTime = now
                        isVolUpPressed = true
                        if (isVolDownPressed || (now - lastVolDownDownTime in 0L..420L)) {
                            comboTriggered = true
                            pendingVolDownRunnable?.let { mainHandler.removeCallbacks(it) }
                            pendingVolUpRunnable?.let { mainHandler.removeCallbacks(it) }
                            eventSink?.success("VOL_BOTH_UNLOCK")
                            return true
                        }
                        val r = Runnable {
                            if (!comboTriggered) {
                                eventSink?.success("UP")
                            }
                        }
                        pendingVolUpRunnable = r
                        mainHandler.postDelayed(r, 130L)
                    }
                } else if (action == KeyEvent.ACTION_UP) {
                    isVolUpPressed = false
                    if (!isVolDownPressed) comboTriggered = false
                }
                return true
            }

            if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
                if (action == KeyEvent.ACTION_DOWN) {
                    lastVolDownEventTime = now
                    if (event.repeatCount == 0) {
                        lastVolDownDownTime = now
                        isVolDownPressed = true
                        if (isVolUpPressed || (now - lastVolUpDownTime in 0L..420L)) {
                            comboTriggered = true
                            pendingVolUpRunnable?.let { mainHandler.removeCallbacks(it) }
                            pendingVolDownRunnable?.let { mainHandler.removeCallbacks(it) }
                            eventSink?.success("VOL_BOTH_UNLOCK")
                            return true
                        }
                        val r = Runnable {
                            if (!comboTriggered) {
                                eventSink?.success("DOWN")
                            }
                        }
                        pendingVolDownRunnable = r
                        mainHandler.postDelayed(r, 130L)
                    }
                } else if (action == KeyEvent.ACTION_UP) {
                    isVolDownPressed = false
                    if (!isVolUpPressed) comboTriggered = false
                }
                return true
            }

            if (keyCode == KeyEvent.KEYCODE_PAGE_UP ||
                keyCode == KeyEvent.KEYCODE_DPAD_LEFT ||
                keyCode == KeyEvent.KEYCODE_DPAD_UP ||
                keyCode == KeyEvent.KEYCODE_MEDIA_NEXT ||
                keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS
            ) {
                if (action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                    handleDirectSpenDouble()
                }
                return true
            }

            if (keyCode == KeyEvent.KEYCODE_PAGE_DOWN ||
                keyCode == KeyEvent.KEYCODE_DPAD_RIGHT ||
                keyCode == KeyEvent.KEYCODE_DPAD_DOWN ||
                keyCode == KeyEvent.KEYCODE_SPACE ||
                keyCode == KeyEvent.KEYCODE_ENTER ||
                keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE ||
                keyCode == KeyEvent.KEYCODE_MEDIA_PLAY ||
                keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE ||
                keyCode == KeyEvent.KEYCODE_CAMERA ||
                keyCode == KeyEvent.KEYCODE_F1 ||
                keyCode == KeyEvent.KEYCODE_F2
            ) {
                if (action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                    handleInstantSpenClick()
                }
                return true
            }
        }

        return super.dispatchKeyEvent(event)
    }

    // ── PDF 내보내기 ──────────────────────────────────────────────────────────

    /** 화면에 보이는 WebView 중 가장 큰 것 (EPUB 본문) */
    private fun postStatusNotification(title: String, text: String, id: Int): Boolean {
        return try {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
            if (Build.VERSION.SDK_INT >= 24 && !nm.areNotificationsEnabled()) return false
            val channelId = "freader_prep"
            if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(channelId) == null) {
                val ch = android.app.NotificationChannel(channelId, "스크롤 보기 준비", android.app.NotificationManager.IMPORTANCE_DEFAULT)
                ch.description = "스크롤 보기 준비가 끝나면 알려 줘요"
                ch.setSound(null, null)
                nm.createNotificationChannel(ch)
            }
            val launch = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                addFlags(android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP or android.content.Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            }
            val pi = if (launch != null) android.app.PendingIntent.getActivity(
                this, id, launch,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= 23) android.app.PendingIntent.FLAG_IMMUTABLE else 0)
            ) else null
            val b = if (Build.VERSION.SDK_INT >= 26) android.app.Notification.Builder(this, channelId)
                    else @Suppress("DEPRECATION") android.app.Notification.Builder(this)
            b.setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(android.app.Notification.BigTextStyle().bigText(text))
                .setAutoCancel(true)
                .setShowWhen(true)
            if (pi != null) b.setContentIntent(pi)
            nm.notify(id, b.build())
            true
        } catch (_: Throwable) {
            false
        }
    }

    private fun findScrollWebView(root: View, tag: String? = null): WebView? {
        if (root is WebView) {
            val url = try { root.url } catch (_: Throwable) { null }
            // 숨은 화면이 여러 개(동시에 2개 준비)일 수 있어 작업 표시(tag)까지 맞는 것만
            if (url != null && url.contains("freaderScroll=1") && (tag == null || url.contains("freaderTag=$tag"))) return root
            return null
        }
        if (root is ViewGroup) {
            for (i in 0 until root.childCount) {
                val found = findScrollWebView(root.getChildAt(i), tag)
                if (found != null) return found
            }
        }
        return null
    }

    /// 쪽 자리만 잘라(crop = [x, y, w, h], 0~1, 가장자리 몇 픽셀은 안쪽으로) 위아래 빈 종이를 걷고 JPEG로 저장
    private fun cropTrimSave(src: Bitmap, crop: List<Number>?, trim: Boolean, paper: Int, pad: Float, outPath: String, trimTop: Boolean = true): IntArray {
        val bw = src.width
        val bh = src.height
        var shot = src
        if (crop != null && crop.size == 4) {
            // 쪽 테두리에 걸친 줄(바깥 바탕색)이 끼지 않게 가장자리를 조금 안쪽으로
            val inset = maxOf(2, (bw / 400f).toInt())
            val cx = ((crop[0].toFloat() * bw).toInt() + inset).coerceIn(0, bw - 1)
            val cy = ((crop[1].toFloat() * bh).toInt() + inset).coerceIn(0, bh - 1)
            val cw = ((crop[2].toFloat() * bw).toInt() - inset * 2).coerceIn(1, bw - cx)
            val ch = ((crop[3].toFloat() * bh).toInt() - inset * 2).coerceIn(1, bh - cy)
            shot = Bitmap.createBitmap(src, cx, cy, cw, ch)
            if (shot !== src) src.recycle()
        }
        if (trim) {
            val w = shot.width
            val h = shot.height
            val pr = (paper shr 16) and 0xFF
            val pg = (paper shr 8) and 0xFF
            val pb = paper and 0xFF
            val row = IntArray(w)
            val edge = maxOf(2, w / 100)
            val span = maxOf(1, w - edge * 2)
            // 글·그림이 있는 줄인가: 종이색과 다른 점이 있고, 줄 전체를 가로지르는 선(쪽 테두리 등)만 있는 줄은 아님
            fun content(y: Int): Boolean {
                shot.getPixels(row, 0, w, 0, y, w, 1)
                var n = 0
                var x = edge
                while (x < w - edge) {
                    val c = row[x]
                    if (Math.abs(((c shr 16) and 0xFF) - pr) > 24 ||
                        Math.abs(((c shr 8) and 0xFF) - pg) > 24 ||
                        Math.abs((c and 0xFF) - pb) > 24) n++
                    x += 1
                }
                return n > 0 && n < span * 0.92f
            }
            var top = 0
            while (top < h && !content(top)) top++
            var bottom = h - 1
            while (bottom > top && !content(bottom)) bottom--
            val keep = (w * pad).toInt()
            // 위쪽 여백은 그대로 두는 경우(쪽 넘김 보기와 같은 자리에서 글이 시작되게): 아래 빈 종이만 걷음
            if (!trimTop && top < h) top = keep
            if (top >= h) {
                val strip = maxOf(1, minOf(h, (w * 0.12f).toInt()))
                val t = Bitmap.createBitmap(shot, 0, 0, w, strip)
                if (t !== shot) shot.recycle()
                shot = t
            } else {
                val y0 = maxOf(0, top - keep)
                val y1 = minOf(h, bottom + 1 + keep)
                if (y0 > 0 || y1 < h) {
                    val t = Bitmap.createBitmap(shot, 0, y0, w, y1 - y0)
                    if (t !== shot) shot.recycle()
                    shot = t
                }
            }
        }
        val outW = shot.width
        val outH = shot.height
        FileOutputStream(File(outPath)).use { out -> shot.compress(Bitmap.CompressFormat.JPEG, 90, out) }
        shot.recycle()
        return intArrayOf(outW, outH)
    }

    private fun findLargestWebView(root: View): WebView? {
        var best: WebView? = null
        fun walk(v: View) {
            // 표지 만들기용 투명 WebView(alpha 0)는 제외
            if (v is WebView && v.isShown && v.alpha > 0f) {
                val b = best
                if (b == null || v.width * v.height > b.width * b.height) best = v
            }
            if (v is ViewGroup) {
                for (i in 0 until v.childCount) walk(v.getChildAt(i))
            }
        }
        walk(root)
        return best
    }

    /** 너무 큰 그림은 메모리를 넘지 않게 줄여서 읽는다 (긴 변 최대 약 3200px) */
    private fun decodePageBitmap(path: String): Bitmap? {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 3200) sample *= 2
        val opts = BitmapFactory.Options().apply { inSampleSize = sample }
        return BitmapFactory.decodeFile(path, opts)
    }

    private fun exportPdfWithMemos(pages: List<Map<String, Any?>>, fileName: String, fallbackDir: String?, keepTemp: Boolean = false): String {
        val doc = PdfDocument()
        val tmp = File(cacheDir, "export_${System.currentTimeMillis()}.pdf")
        try {
            val total = pages.size
            for ((idx, page) in pages.withIndex()) {
                val imagePath = page["image"] as? String ?: continue
                val bmp = decodePageBitmap(imagePath) ?: continue
                val w = bmp.width
                val h = bmp.height
                val info = PdfDocument.PageInfo.Builder(w, h, idx + 1).create()
                val pdfPage = doc.startPage(info)
                val canvas = pdfPage.canvas
                canvas.drawColor(Color.WHITE)
                canvas.drawBitmap(bmp, 0f, 0f, null)
                bmp.recycle()

                // 보이지 않는 글자 층: 그림 위 같은 자리에 글을 (거의) 투명하게 넣어 PDF에서 글 찾기·복사가 되게 함
                @Suppress("UNCHECKED_CAST")
                val texts = page["texts"] as? List<Map<String, Any?>> ?: emptyList()
                if (texts.isNotEmpty()) {
                    val tp = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        color = 0x01FFFFFF // 완전 투명이면 PDF에 글이 남지 않아 아주 조금만 남김
                        typeface = android.graphics.Typeface.DEFAULT
                    }
                    for (tb in texts) {
                        val t = (tb["t"] as? String) ?: continue
                        if (t.isBlank()) continue
                        val bx = ((tb["x"] as? Number)?.toFloat() ?: continue) * w
                        val by = ((tb["y"] as? Number)?.toFloat() ?: continue) * h
                        val bw = ((tb["w"] as? Number)?.toFloat() ?: continue) * w
                        val bh = ((tb["h"] as? Number)?.toFloat() ?: continue) * h
                        if (bw <= 0.5f || bh <= 0.5f || bx > w || by > h) continue
                        tp.textScaleX = 1f
                        tp.textSize = bh * 0.82f
                        val m = tp.measureText(t)
                        if (m > 0f) tp.textScaleX = (bw / m).coerceIn(0.15f, 6f)
                        canvas.drawText(t, bx, by + bh * 0.8f, tp)
                    }
                }

                // 화면에서 그린 필기 굵기를 이 그림 크기에 맞게 키운다
                val refWidth = (page["refWidth"] as? Number)?.toFloat() ?: 0f
                val scale = if (refWidth > 1f) w / refWidth else 1f

                @Suppress("UNCHECKED_CAST")
                val strokes = page["strokes"] as? List<Map<String, Any?>> ?: emptyList()
                for (st in strokes) {
                    @Suppress("UNCHECKED_CAST")
                    val xs = (st["x"] as? List<Number>) ?: continue
                    @Suppress("UNCHECKED_CAST")
                    val ys = (st["y"] as? List<Number>) ?: continue
                    if (xs.isEmpty() || xs.size != ys.size) continue
                    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        style = Paint.Style.STROKE
                        strokeCap = Paint.Cap.ROUND
                        strokeJoin = Paint.Join.ROUND
                        color = ((st["c"] as? Number)?.toLong() ?: 0xFFFFC107L).toInt()
                        strokeWidth = ((st["w"] as? Number)?.toFloat() ?: 2f) * scale
                    }
                    val path = Path()
                    path.moveTo(xs[0].toFloat() * w, ys[0].toFloat() * h)
                    if (xs.size == 1) {
                        path.lineTo(xs[0].toFloat() * w + 0.01f, ys[0].toFloat() * h)
                    } else {
                        for (i in 1 until xs.size) path.lineTo(xs[i].toFloat() * w, ys[i].toFloat() * h)
                    }
                    canvas.drawPath(path, paint)
                }

                // 텍스트 메모: 화면과 같은 노란 메모지 (왼쪽 위)
                val note = (page["note"] as? String)?.trim().orEmpty()
                if (note.isNotEmpty()) drawNoteBox(canvas, note, scale)

                doc.finishPage(pdfPage)
                val cur = idx + 1
                mainHandler.post {
                    try {
                        pdfMethodChannel?.invokeMethod("onPdfExportProgress", mapOf("current" to cur, "total" to total))
                    } catch (_: Exception) {}
                }
            }
            FileOutputStream(tmp).use { doc.writeTo(it) }
        } finally {
            doc.close()
        }
        if (keepTemp) return tmp.absolutePath
        try {
            return savePdfToDownloads(tmp, fileName, fallbackDir)
        } finally {
            tmp.delete()
        }
    }

    private fun drawNoteBox(canvas: Canvas, note: String, scale: Float) {
        val pad = 12f * scale
        val maxW = 220f * scale
        val tp = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = 0xDD000000.toInt()
            textSize = 12f * scale
        }
        val innerMax = (maxW - 20f * scale).toInt().coerceAtLeast(10)
        val textW = minOf(innerMax.toFloat(), tp.measureText(note.replace('\n', ' '))).toInt().coerceAtLeast(10)
        val layout = StaticLayout.Builder.obtain(note, 0, note.length, tp, textW)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setMaxLines(3)
            .setEllipsize(TextUtils.TruncateAt.END)
            .build()
        val boxW = layout.width + 20f * scale
        val boxH = layout.height + 12f * scale
        val box = RectF(pad, pad, pad + boxW, pad + boxH)
        val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0xF2FFE082.toInt() }
        val r = 8f * scale
        canvas.drawRoundRect(box, r, r, bg)
        canvas.save()
        canvas.translate(pad + 10f * scale, pad + 6f * scale)
        layout.draw(canvas)
        canvas.restore()
    }

    /** 다운로드/FReader 폴더에 저장. 안드로이드 10 미만이면 앱 서재 폴더에 저장. 저장 위치를 돌려준다. */
    private fun savePdfToDownloads(src: File, fileName: String, fallbackDir: String?): String {
        val safeName = fileName.replace(Regex("[\\\\/:*?\"<>|]"), "_")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, safeName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/FReader")
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val resolver = contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: throw IllegalStateException("Cannot create file in Downloads")
            resolver.openOutputStream(uri)?.use { out -> src.inputStream().use { it.copyTo(out) } }
                ?: throw IllegalStateException("Cannot write file in Downloads")
            values.clear()
            values.put(MediaStore.MediaColumns.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            // 같은 이름이 있으면 시스템이 이름 뒤에 (1) 등을 붙이므로 실제 이름을 다시 읽는다
            var finalName = safeName
            try {
                resolver.query(uri, arrayOf(MediaStore.MediaColumns.DISPLAY_NAME), null, null, null)?.use { c ->
                    if (c.moveToFirst()) finalName = c.getString(0) ?: safeName
                }
            } catch (_: Exception) {}
            return Environment.DIRECTORY_DOWNLOADS + "/FReader/" + finalName
        }
        val dir = File(fallbackDir ?: filesDir.absolutePath)
        dir.mkdirs()
        var out = File(dir, safeName)
        var n = 1
        while (out.exists()) {
            out = File(dir, safeName.removeSuffix(".pdf") + " ($n).pdf")
            n++
        }
        src.copyTo(out)
        return out.absolutePath
    }

    // ── PDF 글자 검색 (안드로이드 15+, 또는 시스템 업데이트로 PDF 확장 13 이상인 11~14) ──
    private fun pdfSearchSupported(): Boolean {
        if (Build.VERSION.SDK_INT >= 35) return true
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return false
        return try {
            android.os.ext.SdkExtensions.getExtensionVersion(Build.VERSION_CODES.S) >= 13
        } catch (_: Throwable) {
            false
        }
    }

    @android.annotation.SuppressLint("NewApi")
    private fun searchPdfText(path: String, query: String): List<Map<String, Any>> {
        val out = ArrayList<Map<String, Any>>()
        if (query.isBlank()) return out
        val pfd = ParcelFileDescriptor.open(File(path), ParcelFileDescriptor.MODE_READ_ONLY)
        try {
            if (Build.VERSION.SDK_INT >= 35) {
                PdfRenderer(pfd).use { renderer ->
                    for (i in 0 until renderer.pageCount) {
                        renderer.openPage(i).use { page ->
                            addPdfMatches(out, i, page.width.toFloat(), page.height.toFloat(), page.searchText(query))
                        }
                    }
                }
            } else {
                android.graphics.pdf.PdfRendererPreV(pfd).use { renderer ->
                    for (i in 0 until renderer.pageCount) {
                        renderer.openPage(i).use { page ->
                            addPdfMatches(out, i, page.width.toFloat(), page.height.toFloat(), page.searchText(query))
                        }
                    }
                }
            }
        } finally {
            try { pfd.close() } catch (_: Exception) {}
        }
        return out
    }

    private var koreanRecognizer: com.google.mlkit.vision.text.TextRecognizer? = null

    private fun ocrLines(path: String): List<Map<String, Any>> {
        val bmp = BitmapFactory.decodeFile(path) ?: return emptyList()
        try {
            val recognizer = koreanRecognizer ?: com.google.mlkit.vision.text.TextRecognition.getClient(
                com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions.Builder().build()
            ).also { koreanRecognizer = it }
            val image = com.google.mlkit.vision.common.InputImage.fromBitmap(bmp, 0)
            val text = com.google.android.gms.tasks.Tasks.await(recognizer.process(image), 20, java.util.concurrent.TimeUnit.SECONDS)
            val w = bmp.width.toFloat().coerceAtLeast(1f)
            val h = bmp.height.toFloat().coerceAtLeast(1f)
            val out = ArrayList<Map<String, Any>>()
            for (block in text.textBlocks) {
                for (line in block.lines) {
                    val r = line.boundingBox ?: continue
                    out.add(mapOf("t" to line.text, "x" to r.left / w, "y" to r.top / h, "w" to r.width() / w, "h" to r.height() / h))
                }
            }
            return out
        } finally {
            bmp.recycle()
        }
    }

    /** EPUB 안의 표지 그림: container.xml → OPF → 표지(cover-image / meta cover / 이름에 cover) */
    private fun findEpubCover(zip: ZipFile): ZipEntry? {
        return try {
            val container = zip.getEntry("META-INF/container.xml") ?: return null
            val cxml = zip.getInputStream(container).use { it.readBytes().toString(Charsets.UTF_8) }
            val opfPath = Regex("full-path\\s*=\\s*[\"']([^\"']+)[\"']").find(cxml)?.groupValues?.get(1) ?: return null
            val opfEntry = zip.getEntry(opfPath) ?: return null
            val opf = zip.getInputStream(opfEntry).use { it.readBytes().toString(Charsets.UTF_8) }
            val base = opfPath.substringBeforeLast('/', "")
            fun attr(tag: String, name: String): String? =
                Regex("\\b$name\\s*=\\s*[\"']([^\"']*)[\"']", RegexOption.IGNORE_CASE).find(tag)?.groupValues?.get(1)
            val items = Regex("<(?:\\w+:)?item\\b[^>]*>", RegexOption.IGNORE_CASE).findAll(opf).map { it.value }.toList()
            fun isImage(tag: String) = (attr(tag, "media-type") ?: "").startsWith("image/")
            var href: String? = items.firstOrNull { isImage(it) && (attr(it, "properties") ?: "").split(' ').contains("cover-image") }?.let { attr(it, "href") }
            if (href == null) {
                val meta = Regex("<(?:\\w+:)?meta\\b[^>]*>", RegexOption.IGNORE_CASE).findAll(opf).map { it.value }
                    .firstOrNull { (attr(it, "name") ?: "").equals("cover", true) }
                val id = meta?.let { attr(it, "content") }
                if (id != null) href = items.firstOrNull { attr(it, "id") == id && isImage(it) }?.let { attr(it, "href") }
            }
            if (href == null) {
                href = items.firstOrNull { isImage(it) && ((attr(it, "id") ?: "").contains("cover", true) || (attr(it, "href") ?: "").contains("cover", true)) }
                    ?.let { attr(it, "href") }
            }
            if (href == null) return null
            val decoded = java.net.URLDecoder.decode(href.replace("+", "%2B"), "UTF-8")
            val parts = ArrayList<String>()
            for (seg in ((if (base.isEmpty()) "" else "$base/") + decoded).split('/')) {
                when (seg) {
                    "", "." -> {}
                    ".." -> if (parts.isNotEmpty()) parts.removeAt(parts.size - 1)
                    else -> parts.add(seg)
                }
            }
            zip.getEntry(parts.joinToString("/"))
        } catch (_: Throwable) {
            null
        }
    }

    @android.annotation.SuppressLint("NewApi")
    private fun pdfTextBoxes(path: String): List<List<Map<String, Any>>> {
        val out = ArrayList<List<Map<String, Any>>>()
        val pfd = ParcelFileDescriptor.open(File(path), ParcelFileDescriptor.MODE_READ_ONLY)
        fun collect(pw: Float, ph: Float, contents: List<android.graphics.pdf.content.PdfPageTextContent>) {
            val boxes = ArrayList<Map<String, Any>>()
            if (pw > 0f && ph > 0f) {
                for (c in contents) {
                    val text = c.text ?: continue
                    val rects = c.bounds
                    if (rects.isEmpty() || text.isBlank()) continue
                    val lines = text.split('\n')
                    if (lines.size == rects.size) {
                        for (k in rects.indices) {
                            val r = rects[k]
                            if (lines[k].isBlank()) continue
                            boxes.add(mapOf("t" to lines[k], "x" to r.left / pw, "y" to r.top / ph, "w" to r.width() / pw, "h" to r.height() / ph))
                        }
                    } else {
                        val u = android.graphics.RectF(rects[0])
                        for (r in rects) u.union(r)
                        boxes.add(mapOf("t" to text.replace('\n', ' '), "x" to u.left / pw, "y" to u.top / ph, "w" to u.width() / pw, "h" to (u.height() / rects.size) / ph))
                    }
                }
            }
            out.add(boxes)
        }
        try {
            if (Build.VERSION.SDK_INT >= 35) {
                PdfRenderer(pfd).use { renderer ->
                    for (i in 0 until renderer.pageCount) {
                        renderer.openPage(i).use { page -> collect(page.width.toFloat(), page.height.toFloat(), page.textContents) }
                    }
                }
            } else {
                android.graphics.pdf.PdfRendererPreV(pfd).use { renderer ->
                    for (i in 0 until renderer.pageCount) {
                        renderer.openPage(i).use { page -> collect(page.width.toFloat(), page.height.toFloat(), page.textContents) }
                    }
                }
            }
        } finally {
            try { pfd.close() } catch (_: Exception) {}
        }
        return out
    }

    /** 줄 상자 안 글자의 획 굵기 ÷ 줄 높이: 글자 부분을 가려낸 뒤(오츠 방법) 넓이 × 2 ÷ 테두리 길이 = 획 굵기 */
    private fun strokeRatio(src: Bitmap, r: android.graphics.Rect): Double {
        val left = r.left.coerceIn(0, src.width - 1)
        val top = r.top.coerceIn(0, src.height - 1)
        val right = r.right.coerceIn(left + 1, src.width)
        val bottom = r.bottom.coerceIn(top + 1, src.height)
        val bw = right - left
        val bh = bottom - top
        if (bw < 2 || bh < 4) return 0.0
        val k = maxOf(1, Math.round(48f / bh))
        val crop = Bitmap.createBitmap(src, left, top, bw, bh)
        val img = if (k > 1) Bitmap.createScaledBitmap(crop, bw * k, bh * k, true) else crop
        try {
            val W = img.width
            val H = img.height
            val px = IntArray(W * H)
            img.getPixels(px, 0, W, 0, 0, W, H)
            val lum = IntArray(W * H)
            val hist = IntArray(256)
            for (i in px.indices) {
                val c = px[i]
                val v = (((c shr 16) and 0xFF) * 299 + ((c shr 8) and 0xFF) * 587 + (c and 0xFF) * 114) / 1000
                lum[i] = v
                hist[v]++
            }
            val total = W * H
            var sumAll = 0.0
            for (t in 0 until 256) sumAll += t.toDouble() * hist[t]
            var wb = 0.0
            var sb = 0.0
            var bestVar = -1.0
            var th = 127
            for (t in 0 until 256) {
                wb += hist[t]
                if (wb == 0.0) continue
                val wf = total - wb
                if (wf == 0.0) break
                sb += t.toDouble() * hist[t]
                val mb = sb / wb
                val mf = (sumAll - sb) / wf
                val v = wb * wf * (mb - mf) * (mb - mf)
                if (v > bestVar) { bestVar = v; th = t }
            }
            val ink = BooleanArray(total)
            var dark = 0
            for (i in 0 until total) if (lum[i] <= th) { ink[i] = true; dark++ }
            if (dark > total / 2) for (i in 0 until total) ink[i] = !ink[i]
            var area = 0
            var edge = 0
            for (y in 0 until H) for (x in 0 until W) {
                val i = y * W + x
                if (!ink[i]) continue
                area++
                if (x == 0 || y == 0 || x == W - 1 || y == H - 1 || !ink[i - 1] || !ink[i + 1] || !ink[i - W] || !ink[i + W]) edge++
            }
            if (area == 0 || edge == 0) return 0.0
            return (2.0 * area / edge) / H
        } finally {
            if (img !== crop) img.recycle()
            if (crop !== src) crop.recycle()
        }
    }

    /**
     * PDF 목차용: 쪽마다 {aspect: 가로÷세로, lines: 줄들 {t, x0, x1, y, h} (쪽 크기 대비 0~1)}.
     * [withBold]이면 쪽을 그림으로 그려 줄마다 글자 획 굵기 비율 sw도 넣는다 (굵은 글씨 가늠용, 60자 이하 줄만)
     */
    @android.annotation.SuppressLint("NewApi")
    private fun pdfLines(path: String, from: Int, to: Int, withBold: Boolean): List<Map<String, Any>> {
        val out = ArrayList<Map<String, Any>>()
        val pfd = ParcelFileDescriptor.open(File(path), ParcelFileDescriptor.MODE_READ_ONLY)
        fun collect(pw: Float, ph: Float, contents: List<android.graphics.pdf.content.PdfPageTextContent>, draw: ((Bitmap) -> Unit)?,
                    search: (String) -> List<android.graphics.pdf.models.PageMatchBounds>) {
            // 글 조각들: 줄바꿈 수와 상자 수가 같으면 줄마다 짝짓고, 다르면 상자 너비에 비례해 글자를 나눠 담음
            val segs = ArrayList<Pair<String, android.graphics.RectF>>()
            if (pw > 0f && ph > 0f) {
                for (c in contents) {
                    val text = c.text ?: continue
                    val rects = c.bounds.filter { it.width() > 0f && it.height() > 0f }
                    if (text.isBlank()) continue
                    if (rects.isEmpty()) {
                        // 기기에 따라 쪽 글 전체만 주고 위치(상자)는 주지 않는다 → 줄마다 '쪽 안에서 찾기'로 위치를 얻음
                        val seen = HashMap<String, Int>()
                        val used = ArrayList<android.graphics.RectF>()
                        var lastY = 0f
                        var searched = 0
                        for (raw in text.split(Regex("\r\n|\n|\r"))) {
                            val line = raw.trim()
                            if (line.isEmpty()) continue
                            var box: android.graphics.RectF? = null
                            if (line.length <= 120 && searched < 80) {
                                searched++
                                val k = seen[line] ?: 0
                                seen[line] = k + 1
                                try {
                                    // 찾은 자리마다 한 줄 상자로 (줄이 바뀐 부분은 빼고)
                                    val boxes = search(line).mapNotNull { m ->
                                        val first = m.bounds.firstOrNull { it.width() > 0f && it.height() > 0f } ?: return@mapNotNull null
                                        val u = android.graphics.RectF(first)
                                        for (r in m.bounds) if (r.width() > 0f && r.height() > 0f && Math.abs(r.centerY() - u.centerY()) < u.height()) u.union(r)
                                        u
                                    }
                                    // 이미 다른 줄이 차지한 자리 안(더 긴 줄 속 같은 글자)은 건너뜀
                                    box = boxes.firstOrNull { b -> used.none { it.contains(b.centerX(), b.centerY()) } } ?: boxes.getOrNull(k) ?: boxes.firstOrNull()
                                    box?.let { used.add(it) }
                                } catch (_: Throwable) {}
                            }
                            // 위치를 못 찾은 줄은 앞 줄 바로 아래로 (글 복사에는 순서만 맞으면 됨)
                            val r = box ?: android.graphics.RectF(0f, lastY + 0.01f, pw, lastY + 0.02f)
                            lastY = r.bottom
                            segs.add(line to r)
                        }
                        continue
                    }
                    val parts = text.split(Regex("\r\n|\n|\r"))
                    if (parts.size == rects.size) {
                        for (k in rects.indices) if (parts[k].isNotBlank()) segs.add(parts[k] to rects[k])
                    } else {
                        val flat = text.replace(Regex("[\r\n]+"), " ")
                        val total = rects.sumOf { it.width().toDouble() }.coerceAtLeast(1.0)
                        var pos = 0
                        for ((k, r) in rects.withIndex()) {
                            val n = if (k == rects.size - 1) flat.length - pos else Math.round(flat.length * r.width() / total).toInt()
                            val end = (pos + n).coerceIn(pos, flat.length)
                            val piece = flat.substring(pos, end)
                            pos = end
                            if (piece.isNotBlank()) segs.add(piece to android.graphics.RectF(r))
                        }
                    }
                }
            }
            // 같은 높이(같은 줄)에 있는 조각은 한 줄로 합침
            segs.sortWith(compareBy({ it.second.centerY() }, { it.second.left }))
            val lines = ArrayList<Pair<String, android.graphics.RectF>>()
            for ((t, r) in segs) {
                val last = lines.lastOrNull()
                if (last != null && Math.abs(last.second.centerY() - r.centerY()) < minOf(last.second.height(), r.height()) * 0.5f &&
                    r.left >= last.second.left - 1f && r.left - last.second.right < r.height() * 3f) {
                    val u = android.graphics.RectF(last.second); u.union(r)
                    val gap = if (r.left - last.second.right > r.height() * 0.15f) " " else ""
                    lines[lines.size - 1] = (last.first + gap + t) to u
                } else lines.add(t to r)
            }
            var bmp: Bitmap? = null
            var scale = 1f
            if (draw != null && lines.any { it.first.trim().length <= 60 } && pw > 0f) {
                scale = 1100f / pw
                try {
                    bmp = Bitmap.createBitmap(1100, maxOf(1, (ph * scale).toInt()), Bitmap.Config.ARGB_8888)
                    bmp.eraseColor(android.graphics.Color.WHITE)
                    draw(bmp)
                } catch (_: Throwable) {
                    bmp?.recycle(); bmp = null
                }
            }
            val page = ArrayList<Map<String, Any>>()
            for ((t, r) in lines) {
                val m = HashMap<String, Any>()
                m["t"] = t; m["x0"] = r.left / pw; m["x1"] = r.right / pw; m["y"] = r.top / ph; m["h"] = r.height() / ph
                val b = bmp
                if (b != null && t.trim().length <= 60) {
                    val rr = android.graphics.Rect((r.left * scale).toInt(), (r.top * scale).toInt(), (r.right * scale).toInt() + 1, (r.bottom * scale).toInt() + 1)
                    m["sw"] = try { strokeRatio(b, rr) } catch (_: Throwable) { 0.0 }
                }
                page.add(m)
            }
            bmp?.recycle()
            out.add(mapOf("aspect" to (if (ph > 0f) (pw / ph).toDouble() else 1.0), "lines" to page))
        }
        try {
            if (Build.VERSION.SDK_INT >= 35) {
                PdfRenderer(pfd).use { renderer ->
                    for (i in maxOf(0, from) until minOf(renderer.pageCount, to)) {
                        renderer.openPage(i).use { pg ->
                            collect(pg.width.toFloat(), pg.height.toFloat(), pg.textContents,
                                if (withBold) { b -> pg.render(b, null, android.graphics.Matrix().apply { setScale(b.width / pg.width.toFloat(), b.width / pg.width.toFloat()) }, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY) } else null,
                                { q -> pg.searchText(q) })
                        }
                    }
                }
            } else {
                android.graphics.pdf.PdfRendererPreV(pfd).use { renderer ->
                    for (i in maxOf(0, from) until minOf(renderer.pageCount, to)) {
                        renderer.openPage(i).use { pg ->
                            collect(pg.width.toFloat(), pg.height.toFloat(), pg.textContents,
                                if (withBold) { b -> pg.render(b, null, android.graphics.Matrix().apply { setScale(b.width / pg.width.toFloat(), b.width / pg.width.toFloat()) },
                                    android.graphics.pdf.RenderParams.Builder(android.graphics.pdf.RenderParams.RENDER_MODE_FOR_DISPLAY).build()) } else null,
                                { q -> pg.searchText(q) })
                        }
                    }
                }
            }
        } finally {
            try { pfd.close() } catch (_: Exception) {}
        }
        return out
    }

    @android.annotation.SuppressLint("NewApi")
    private fun addPdfMatches(out: ArrayList<Map<String, Any>>, pageIndex: Int, w: Float, h: Float, matches: List<android.graphics.pdf.models.PageMatchBounds>) {
        if (w <= 0f || h <= 0f) return
        for (m in matches) {
            val rects = ArrayList<Double>()
            for (r in m.bounds) {
                rects.add((r.left / w).toDouble()); rects.add((r.top / h).toDouble())
                rects.add((r.right / w).toDouble()); rects.add((r.bottom / h).toDouble())
            }
            if (rects.isNotEmpty()) out.add(mapOf("page" to pageIndex, "rects" to rects))
        }
    }

    // ── 문서 스캔 (카메라 촬영 + 스캔 필터 보정 + PDF 묶기) ──────────────────

    private fun launchCameraForScan(result: MethodChannel.Result) {
        if (pendingCameraResult != null) {
            try { pendingCameraResult?.success(null) } catch (_: Exception) {}
            pendingCameraResult = null
        }
        try {
            val scanDir = File(cacheDir, "scan_photos")
            if (!scanDir.exists()) scanDir.mkdirs()
            val outFile = File(scanDir, "raw_${System.currentTimeMillis()}.jpg")
            pendingCameraFile = outFile
            pendingCameraResult = result

            val authority = "${applicationContext.packageName}.scanprovider"
            val uri = android.net.Uri.parse("content://$authority/scan_photos/${outFile.name}")
            val intent = android.content.Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                putExtra(MediaStore.EXTRA_OUTPUT, uri)
                clipData = android.content.ClipData.newRawUri("", uri)
                addFlags(
                    android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
                        android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }
            startActivityForResult(intent, REQ_SCAN_CAMERA)
        } catch (e: Throwable) {
            pendingCameraResult = null
            pendingCameraFile = null
            result.error("CAMERA_ERR", e.message ?: "카메라를 실행할 수 없습니다.", null)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        if (requestCode == REQ_SCAN_CAMERA) {
            val cb = pendingCameraResult
            val file = pendingCameraFile
            pendingCameraResult = null
            pendingCameraFile = null
            if (cb == null) return
            if (resultCode != android.app.Activity.RESULT_OK) {
                try { file?.delete() } catch (_: Exception) {}
                cb.success(null)
                return
            }
            thumbExecutor.execute {
                try {
                    val outFile = file ?: File(File(cacheDir, "scan_photos").apply { mkdirs() }, "raw_${System.currentTimeMillis()}.jpg")
                    if (!outFile.exists() || outFile.length() == 0L) {
                        val dataUri = data?.data
                        if (dataUri != null) {
                            contentResolver.openInputStream(dataUri)?.use { input ->
                                FileOutputStream(outFile).use { output -> input.copyTo(output) }
                            }
                        } else {
                            @Suppress("DEPRECATION")
                            val thumb = data?.extras?.get("data") as? Bitmap
                            if (thumb != null) {
                                FileOutputStream(outFile).use { output ->
                                    thumb.compress(Bitmap.CompressFormat.JPEG, 92, output)
                                }
                            }
                        }
                    }
                    if (!outFile.exists() || outFile.length() == 0L) {
                        runOnUiThread { cb.success(null) }
                        return@execute
                    }
                    normalizeCameraImageFile(outFile, 2400)
                    runOnUiThread { cb.success(outFile.absolutePath) }
                } catch (e: Throwable) {
                    runOnUiThread { cb.error("CAMERA_SAVE_ERR", e.message, null) }
                }
            }
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    private fun normalizeCameraImageFile(file: File, maxDim: Int) {
        val exifDeg = try {
            val exif = android.media.ExifInterface(file.absolutePath)
            when (exif.getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, android.media.ExifInterface.ORIENTATION_NORMAL)) {
                android.media.ExifInterface.ORIENTATION_ROTATE_90 -> 90
                android.media.ExifInterface.ORIENTATION_ROTATE_180 -> 180
                android.media.ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }
        } catch (_: Throwable) { 0 }

        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > maxDim * 2) {
            sample *= 2
        }
        val decoded = BitmapFactory.decodeFile(file.absolutePath, BitmapFactory.Options().apply { inSampleSize = sample }) ?: return
        val maxSide = maxOf(decoded.width, decoded.height)
        val scale = if (maxSide > maxDim) maxDim.toFloat() / maxSide.toFloat() else 1f
        if (exifDeg == 0 && scale >= 0.999f) {
            decoded.recycle()
            return
        }
        val m = android.graphics.Matrix()
        if (scale < 0.999f) m.postScale(scale, scale)
        if (exifDeg != 0) m.postRotate(exifDeg.toFloat())
        val normalized = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, m, true)
        if (normalized !== decoded) decoded.recycle()
        FileOutputStream(file).use { out ->
            normalized.compress(Bitmap.CompressFormat.JPEG, 92, out)
        }
        normalized.recycle()
    }

    /**
     * 카메라로 찍은 문서 사진을 실제 스캔본처럼 보정한다.
     * - 2차원 적분 영상(Integral Image)으로 지역 배경 밝기를 추정하여 조명 그림자·누런 종이 배경을 하얗게 제거하고 글자 획을 선명하게 강조한다.
     */
    private fun processDocumentScanBitmap(
        inputPath: String,
        outputPath: String,
        mode: String,
        contrast: Float,
        rotation: Int,
        crop: List<Number>?,
        maxDim: Int
    ): String {
        val srcFile = File(inputPath)
        if (!srcFile.exists()) throw IllegalStateException("원본 이미지가 없습니다.")

        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(inputPath, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw IllegalStateException("이미지를 읽을 수 없습니다.")
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > maxDim * 2) {
            sample *= 2
        }
        var bmp = BitmapFactory.decodeFile(inputPath, BitmapFactory.Options().apply { inSampleSize = sample })
            ?: throw IllegalStateException("이미지 디코딩 실패")

        // 1. 회전 적용 (0, 90, 180, 270)
        val rot = ((rotation % 360) + 360) % 360
        if (rot != 0) {
            val m = android.graphics.Matrix().apply { postRotate(rot.toFloat()) }
            val rotated = Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
            if (rotated !== bmp) bmp.recycle()
            bmp = rotated
        }

        // 2. 자르기 영역 적용 (crop = [left, top, right, bottom], 0.0~1.0)
        if (crop != null && crop.size == 4) {
            val l = crop[0].toFloat().coerceIn(0f, 0.95f)
            val t = crop[1].toFloat().coerceIn(0f, 0.95f)
            val r = crop[2].toFloat().coerceIn(l + 0.05f, 1f)
            val b = crop[3].toFloat().coerceIn(t + 0.05f, 1f)
            if (l > 0.005f || t > 0.005f || r < 0.995f || b < 0.995f) {
                val cx = (l * bmp.width).toInt().coerceIn(0, bmp.width - 1)
                val cy = (t * bmp.height).toInt().coerceIn(0, bmp.height - 1)
                val cw = ((r - l) * bmp.width).toInt().coerceIn(1, bmp.width - cx)
                val ch = ((b - t) * bmp.height).toInt().coerceIn(1, bmp.height - cy)
                val cropped = Bitmap.createBitmap(bmp, cx, cy, cw, ch)
                if (cropped !== bmp) bmp.recycle()
                bmp = cropped
            }
        }

        // 3. 최대 해상도 제한
        val longest = maxOf(bmp.width, bmp.height)
        if (longest > maxDim) {
            val scale = maxDim.toFloat() / longest.toFloat()
            val sw = maxOf(1, (bmp.width * scale).toInt())
            val sh = maxOf(1, (bmp.height * scale).toInt())
            val scaled = Bitmap.createScaledBitmap(bmp, sw, sh, true)
            if (scaled !== bmp) bmp.recycle()
            bmp = scaled
        }

        // 4. 스캔 필터 적용
        if (mode != "original") {
            val w = bmp.width
            val h = bmp.height
            val pixels = IntArray(w * h)
            bmp.getPixels(pixels, 0, w, 0, 0, w, h)

            val lum = IntArray(w * h)
            val stride = w + 1
            val integral = LongArray((w + 1) * (h + 1))

            for (y in 0 until h) {
                var rowSum = 0L
                val rowOffset = y * w
                val intRow = (y + 1) * stride
                val intPrevRow = y * stride
                for (x in 0 until w) {
                    val c = pixels[rowOffset + x]
                    val r = (c shr 16) and 0xFF
                    val g = (c shr 8) and 0xFF
                    val b = c and 0xFF
                    val l = (r * 77 + g * 150 + b * 29) shr 8
                    lum[rowOffset + x] = l
                    rowSum += l
                    integral[intRow + x + 1] = integral[intPrevRow + x + 1] + rowSum
                }
            }

            val rad = maxOf(18, minOf(w, h) / 14)
            // contrast(0..1): 높을수록 글자가 더 진해지고 배경이 더 강하게 하얘짐
            val paperWhiteFloor = (232 - (contrast * 28f)).toInt().coerceIn(195, 242)
            val inkDarkCeil = (95 + (contrast * 70f)).toInt().coerceIn(80, 175)
            val span = maxOf(1, paperWhiteFloor - inkDarkCeil)

            for (y in 0 until h) {
                val y0 = maxOf(0, y - rad)
                val y1 = minOf(h - 1, y + rad)
                val r0 = y0 * stride
                val r1 = (y1 + 1) * stride
                val rowOffset = y * w
                for (x in 0 until w) {
                    val x0 = maxOf(0, x - rad)
                    val x1 = minOf(w - 1, x + rad)
                    val count = (x1 - x0 + 1) * (y1 - y0 + 1)
                    val sum = integral[r1 + x1 + 1] - integral[r0 + x1 + 1] - integral[r1 + x0] + integral[r0 + x0]
                    val localBg = maxOf(45, (sum / count).toInt())

                    val idx = rowOffset + x
                    val l = lum[idx]
                    // 지역 배경 대비 상대 밝기 (0~255)
                    val rel = ((l * 255) / localBg).coerceIn(0, 255)

                    when (mode) {
                        "scan_bw" -> {
                            // 스캔본 (선명한 흑백 문서): 배경 그림자는 순백색(255)으로 날리고 글자 획은 선명하고 진하게
                            val v = when {
                                rel >= paperWhiteFloor -> 255
                                rel <= inkDarkCeil -> (rel * 35 / maxOf(1, inkDarkCeil)).coerceIn(0, 35)
                                else -> {
                                    val t = (rel - inkDarkCeil).toFloat() / span.toFloat()
                                    // 부드러운 S-커브로 글자 가장자리 깨짐 방지
                                    val smooth = t * t * (3f - 2f * t)
                                    (35f + smooth * 220f).toInt().coerceIn(0, 255)
                                }
                            }
                            pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                        }
                        "scan_gray" -> {
                            // 회색조 스캔 (그림·도표가 있는 문서용): 그림자만 제거하고 부드러운 회색조 유지
                            val whitePt = (240 - (contrast * 18f)).toInt().coerceIn(215, 245)
                            val blackPt = (40 + (contrast * 40f)).toInt().coerceIn(30, 90)
                            val v = when {
                                rel >= whitePt -> 255
                                rel <= blackPt -> 0
                                else -> ((rel - blackPt) * 255 / maxOf(1, whitePt - blackPt)).coerceIn(0, 255)
                            }
                            pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                        }
                        "scan_color" -> {
                            // 컬러 스캔: 종이 배경 그림자는 순백색으로 만들고 색깔 있는 글씨·형광펜·도장은 선명하게 보존
                            val c = pixels[idx]
                            val r = (c shr 16) and 0xFF
                            val g = (c shr 8) and 0xFF
                            val b = c and 0xFF
                            val maxCh = maxOf(r, maxOf(g, b))
                            val minCh = minOf(r, minOf(g, b))
                            val sat = maxCh - minCh

                            if (rel >= paperWhiteFloor && sat < 36) {
                                pixels[idx] = 0xFFFFFFFF.toInt()
                            } else {
                                val nr = ((r * 255) / localBg).coerceIn(0, 255)
                                val ng = ((g * 255) / localBg).coerceIn(0, 255)
                                val nb = ((b * 255) / localBg).coerceIn(0, 255)
                                val gain = 1.15f + contrast * 0.35f
                                val fr = (255f - (255 - nr) * gain).toInt().coerceIn(0, 255)
                                val fg = (255f - (255 - ng) * gain).toInt().coerceIn(0, 255)
                                val fb = (255f - (255 - nb) * gain).toInt().coerceIn(0, 255)
                                pixels[idx] = (0xFF shl 24) or (fr shl 16) or (fg shl 8) or fb
                            }
                        }
                    }
                }
            }
            val outBmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            outBmp.setPixels(pixels, 0, w, 0, 0, w, h)
            bmp.recycle()
            bmp = outBmp
        }

        val outFile = File(outputPath)
        outFile.parentFile?.mkdirs()
        FileOutputStream(outFile).use { out ->
            bmp.compress(Bitmap.CompressFormat.JPEG, 90, out)
        }
        bmp.recycle()
        return outFile.absolutePath
    }

    private fun buildScannedPdfFromImages(imagePaths: List<String>, outputPath: String): String {
        val doc = PdfDocument()
        try {
            val total = imagePaths.size
            val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
            for ((idx, path) in imagePaths.withIndex()) {
                val f = File(path)
                if (!f.exists()) continue
                val cur = idx + 1
                mainHandler.post {
                    try {
                        pdfMethodChannel?.invokeMethod(
                            "onScanPdfProgress",
                            mapOf("current" to cur, "total" to total)
                        )
                    } catch (_: Exception) {}
                }
                val bmp = decodePageBitmap(path) ?: continue
                // A4 비율에 가까운 고해상도 페이지 폭(1440px 기준)으로 정규화하여 저장
                val targetW = 1440
                val scale = targetW.toFloat() / bmp.width.toFloat().coerceAtLeast(1f)
                val pageW = targetW
                val pageH = (bmp.height * scale).toInt().coerceAtLeast(400)

                val pageInfo = PdfDocument.PageInfo.Builder(pageW, pageH, cur).create()
                val page = doc.startPage(pageInfo)
                val canvas = page.canvas
                canvas.drawColor(Color.WHITE)
                val dstRect = RectF(0f, 0f, pageW.toFloat(), pageH.toFloat())
                canvas.drawBitmap(bmp, null, dstRect, paint)
                doc.finishPage(page)
                bmp.recycle()
            }
            val outFile = File(outputPath)
            outFile.parentFile?.mkdirs()
            FileOutputStream(outFile).use { outStream ->
                doc.writeTo(outStream)
            }
            return outFile.absolutePath
        } finally {
            try { doc.close() } catch (_: Exception) {}
        }
    }
}

class ScanFileProvider : android.content.ContentProvider() {
    override fun onCreate(): Boolean = true

    private fun resolveScanFile(uri: android.net.Uri): File {
        val ctx = context ?: throw java.io.FileNotFoundException("No context")
        val segs = uri.pathSegments
        if (segs.size < 2 || segs[0] != "scan_photos") {
            throw java.io.FileNotFoundException("Invalid scan uri: $uri")
        }
        val safeName = File(segs[1]).name
        val dir = File(ctx.cacheDir, "scan_photos")
        if (!dir.exists()) dir.mkdirs()
        return File(dir, safeName)
    }

    override fun query(
        uri: android.net.Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): android.database.Cursor {
        val f = resolveScanFile(uri)
        val cols = projection ?: arrayOf(
            android.provider.OpenableColumns.DISPLAY_NAME,
            android.provider.OpenableColumns.SIZE
        )
        val row = Array<Any?>(cols.size) { i ->
            when (cols[i]) {
                android.provider.OpenableColumns.DISPLAY_NAME -> f.name
                android.provider.OpenableColumns.SIZE -> f.length()
                else -> null
            }
        }
        return android.database.MatrixCursor(cols, 1).apply { addRow(row) }
    }

    override fun getType(uri: android.net.Uri): String = "image/jpeg"
    override fun insert(uri: android.net.Uri, values: ContentValues?): android.net.Uri? = null
    override fun delete(uri: android.net.Uri, selection: String?, selectionArgs: Array<out String>?): Int = 0
    override fun update(uri: android.net.Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int = 0

    override fun openFile(uri: android.net.Uri, mode: String): ParcelFileDescriptor? {
        val f = resolveScanFile(uri)
        if (!f.exists() && mode.contains("w")) {
            f.parentFile?.mkdirs()
            f.createNewFile()
        }
        return ParcelFileDescriptor.open(f, ParcelFileDescriptor.parseMode(mode))
    }
}
