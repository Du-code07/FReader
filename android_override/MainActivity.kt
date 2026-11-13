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
            } else if (call.method == "openInAppDocumentCamera") {
                val batchMode = call.argument<Boolean>("batchMode") ?: false
                val shutterSound = call.argument<Boolean>("shutterSound") ?: false
                val colorEnhance = call.argument<Boolean>("colorEnhance") ?: true
                val eraseFingers = call.argument<Boolean>("eraseFingers") ?: true
                val flattenQuad = call.argument<Boolean>("flattenQuad") ?: true
                launchInAppDocumentCamera(
                    result = result,
                    batchMode = batchMode,
                    shutterSound = shutterSound,
                    colorEnhance = colorEnhance,
                    eraseFingers = eraseFingers,
                    flattenQuad = flattenQuad
                )
            } else if (call.method == "capturePhotoWithCamera") {
                launchInAppDocumentCamera(
                    result = result,
                    batchMode = false,
                    shutterSound = false,
                    colorEnhance = true,
                    eraseFingers = true,
                    flattenQuad = true,
                    singlePathReturn = true
                )
            } else if (call.method == "detectDocumentQuad") {
                val imagePath = call.argument<String>("imagePath")
                if (imagePath == null) {
                    result.error("INVALID_ARGS", "Missing imagePath", null)
                    return@setMethodCallHandler
                }
                thumbExecutor.execute {
                    try {
                        val quad = DocumentQuadDetector.detectQuadFromFile(imagePath)
                        runOnUiThread { result.success(quad.map { it.toDouble() }) }
                    } catch (e: Throwable) {
                        runOnUiThread {
                            result.success(listOf(0.06, 0.06, 0.94, 0.06, 0.94, 0.94, 0.06, 0.94))
                        }
                    }
                }
            } else if (call.method == "processScannedImage") {
                val inputPath = call.argument<String>("inputPath")
                val outputPath = call.argument<String>("outputPath")
                val mode = call.argument<String>("mode") ?: "magic"
                val contrast = (call.argument<Number>("contrast")?.toFloat() ?: 0.55f).coerceIn(0f, 1f)
                val rotation = (call.argument<Number>("rotation")?.toInt() ?: 0)
                val quadArg = call.argument<List<Number>>("quad") ?: call.argument<List<Number>>("crop")
                val eraseFingers = call.argument<Boolean>("eraseFingers") ?: true
                val maxDim = (call.argument<Number>("maxDim")?.toInt() ?: 1800).coerceIn(220, 3200)
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
                            quadOrCrop = quadArg,
                            eraseFingers = eraseFingers,
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
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 3600) sample *= 2
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

    // ── 문서 스캔 (OpenCV 4.10 오픈소스 엔진 + 완전 무음 카메라 + 청록색 종이 인식 틀 + 원근 보정) ──

    private var pendingCameraSinglePathMode = false

    private fun launchInAppDocumentCamera(
        result: MethodChannel.Result,
        batchMode: Boolean,
        shutterSound: Boolean,
        colorEnhance: Boolean,
        eraseFingers: Boolean,
        flattenQuad: Boolean,
        singlePathReturn: Boolean = false
    ) {
        if (pendingCameraResult != null) {
            try { pendingCameraResult?.success(null) } catch (_: Exception) {}
            pendingCameraResult = null
        }
        try {
            OpenCvScanEngine.ensureInitialized()
            pendingCameraResult = result
            pendingCameraSinglePathMode = singlePathReturn
            val intent = android.content.Intent(this, DocumentCameraActivity::class.java).apply {
                putExtra("batchMode", batchMode)
                putExtra("colorEnhance", colorEnhance)
                putExtra("eraseFingers", eraseFingers)
                putExtra("flattenQuad", flattenQuad)
            }
            startActivityForResult(intent, REQ_SCAN_CAMERA)
        } catch (e: Throwable) {
            pendingCameraResult = null
            result.error("CAMERA_ERR", e.message ?: "스캔 카메라를 열 수 없습니다.", null)
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        if (requestCode == REQ_SCAN_CAMERA) {
            val cb = pendingCameraResult
            val singleMode = pendingCameraSinglePathMode
            pendingCameraResult = null
            pendingCameraSinglePathMode = false
            if (cb == null) return
            if (resultCode != android.app.Activity.RESULT_OK || data == null) {
                cb.success(null)
                return
            }
            val paths = data.getStringArrayListExtra("paths") ?: arrayListOf()
            val quads = data.getStringArrayListExtra("quads") ?: arrayListOf()
            val pickGallery = data.getBooleanExtra("pickGallery", false)
            val colorEnhance = data.getBooleanExtra("colorEnhance", true)
            val eraseFingers = data.getBooleanExtra("eraseFingers", true)
            val flattenQuad = data.getBooleanExtra("flattenQuad", true)

            if (singleMode) {
                cb.success(paths.firstOrNull())
                return
            }

            val pageList = ArrayList<Map<String, Any>>()
            for (i in paths.indices) {
                val p = paths[i]
                val qStr = quads.getOrNull(i) ?: "0.0,0.0,1.0,0.0,1.0,1.0,0.0,1.0"
                val qFloats = qStr.split(",").mapNotNull { it.toDoubleOrNull() }
                val quad = if (qFloats.size == 8) qFloats else listOf(0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0)
                pageList.add(
                    mapOf(
                        "rawPath" to p,
                        "quad" to quad
                    )
                )
            }
            cb.success(
                mapOf(
                    "pages" to pageList,
                    "pickGallery" to pickGallery,
                    "shutterSound" to false,
                    "colorEnhance" to colorEnhance,
                    "eraseFingers" to eraseFingers,
                    "flattenQuad" to flattenQuad
                )
            )
            return
        }
        super.onActivityResult(requestCode, resultCode, data)
    }

    /**
     * 초고화질 문서·필기·책 글자 선명화 스캔 파이프라인 (v102):
     * 1) OpenCV Bicubic(INTER_CUBIC) 4점 원근 투시 변환 및 서브픽셀 업스케일링 (작은 손글씨·발음기호 해상력 극대화)
     * 2) 배경 조명 맵(bgGrid) 오염을 일으키던 사전 테두리 덧칠을 제거하고, 원본 밝기에서 직접 3x3 모폴로지 조명 맵을 추출하여
     *    좌하단 등 어두운 그림자 영역(lum ~ 90)도 단차나 얼룩 없이 100% 순백색(#FFFFFF)으로 자연스럽게 평탄화
     * 3) 등방성 3x3 가우시안 언샤프 마스크(노이즈 코어링 포함) + 안티앨리어싱 보존 S-커브 LUT로
     *    획 뭉개짐·번짐 없이 타 스캔 앱(vFlat/CamScanner) 수준의 얇고 또렷한 글자 획 복원
     */
    private fun processDocumentScanBitmap(
        inputPath: String,
        outputPath: String,
        mode: String,
        contrast: Float,
        rotation: Int,
        quadOrCrop: List<Number>?,
        eraseFingers: Boolean,
        maxDim: Int
    ): String {
        val srcFile = File(inputPath)
        if (!srcFile.exists()) throw IllegalStateException("원본 이미지가 없습니다.")

        val effectiveMaxDim = if (maxDim >= 1600) maxOf(maxDim, 3200) else maxDim
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(inputPath, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw IllegalStateException("이미지를 읽을 수 없습니다.")
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > effectiveMaxDim * 2) {
            sample *= 2
        }
        val decodeOpts = BitmapFactory.Options().apply {
            inSampleSize = sample
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        var bmp = BitmapFactory.decodeFile(inputPath, decodeOpts)
            ?: throw IllegalStateException("이미지 디코딩 실패")

        // 1. 4점 사각형(청록색 종이 인식 틀) 고해상도 Bicubic 원근 투시 보정
        if (quadOrCrop != null) {
            val q: FloatArray? = when (quadOrCrop.size) {
                8 -> FloatArray(8) { i -> quadOrCrop[i].toFloat().coerceIn(0f, 1f) }
                4 -> {
                    val l = quadOrCrop[0].toFloat().coerceIn(0f, 0.95f)
                    val t = quadOrCrop[1].toFloat().coerceIn(0f, 0.95f)
                    val r = quadOrCrop[2].toFloat().coerceIn(l + 0.05f, 1f)
                    val b = quadOrCrop[3].toFloat().coerceIn(t + 0.05f, 1f)
                    floatArrayOf(l, t, r, t, r, b, l, b)
                }
                else -> null
            }
            if (q != null) {
                val isFull = (q[0] < 0.01f && q[1] < 0.01f &&
                    q[2] > 0.99f && q[3] < 0.01f &&
                    q[4] > 0.99f && q[5] > 0.99f &&
                    q[6] < 0.01f && q[7] > 0.99f)
                if (!isFull) {
                    bmp = safeWarpPerspectiveQuad(bmp, q, effectiveMaxDim)
                }
            }
        }

        // 2. 회전 적용 (0, 90, 180, 270)
        val rot = ((rotation % 360) + 360) % 360
        if (rot != 0) {
            val m = android.graphics.Matrix().apply { postRotate(rot.toFloat()) }
            val rotated = Bitmap.createBitmap(bmp, 0, 0, bmp.width, bmp.height, m, true)
            if (rotated !== bmp) bmp.recycle()
            bmp = rotated
        }

        // 3. 해상도 최적화: 메인 스캔본(effectiveMaxDim >= 2000)인데 원근 보정 후 해상도가 낮으면
        //    OpenCV INTER_CUBIC으로 최소 2200px 급으로 서브픽셀 보간하여 작은 손글씨 계단 현상 방지
        val longest = maxOf(bmp.width, bmp.height)
        if (longest > effectiveMaxDim) {
            val scale = effectiveMaxDim.toFloat() / longest.toFloat()
            val sw = maxOf(1, (bmp.width * scale).toInt())
            val sh = maxOf(1, (bmp.height * scale).toInt())
            val scaled = OpenCvScanEngine.resizeCubicOrFallback(bmp, sw, sh)
            if (scaled !== bmp) bmp.recycle()
            bmp = scaled
        } else if (effectiveMaxDim >= 2000 && longest in 400..1999) {
            val targetLong = minOf(effectiveMaxDim, 2400)
            val scale = targetLong.toFloat() / longest.toFloat()
            val sw = maxOf(1, (bmp.width * scale).toInt())
            val sh = maxOf(1, (bmp.height * scale).toInt())
            val upscaled = OpenCvScanEngine.resizeCubicOrFallback(bmp, sw, sh)
            if (upscaled !== bmp) bmp.recycle()
            bmp = upscaled
        }

        val w = bmp.width
        val h = bmp.height
        val pixels = IntArray(w * h)
        bmp.getPixels(pixels, 0, w, 0, 0, w, h)

        // 3.5. 휘어진 책 페이지 자동 평탄화(2D Cylindrical & Text-Line Correlation Book Dewarping):
        //      상·하단 다중 대역 글자 줄의 수직 기울기 교차상관으로 책 곡률(dy)과 책등 원근 압축(dx)을 자동 복원
        if (w >= 240 && h >= 240) {
            dewarpCurvedBookPageInPlace(pixels, w, h)
        }

        // 4. 정밀 모폴로지 배경 조명 분리 + 3x3 등방성 가우시안 샤프닝 + 안티앨리어싱 S-커브 적용
        //    (주의: bgGrid 조명 계산 전에 가장자리 픽셀을 인위적으로 칠하면 좌하단 그림자 경계에 L자 단차가 생기므로
        //     반드시 원본 픽셀 그대로 조명 정규화를 먼저 수행한다!)
        if (mode != "original") {
            enhanceDocumentPixelsHighQuality(pixels, w, h, mode, contrast, eraseFingers)
        } else if (eraseFingers && w >= 80 && h >= 80) {
            eraseEdgeFingersInPlace(pixels, w, h)
        }

        // 항상 새 Mutable Bitmap에 픽셀을 기록하여 Immutable Bitmap 예외 및 검은 이미지 현상 원천 차단
        val outBmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        outBmp.setPixels(pixels, 0, w, 0, 0, w, h)
        bmp.recycle()

        val outFile = File(outputPath)
        outFile.parentFile?.mkdirs()
        FileOutputStream(outFile).use { out ->
            outBmp.compress(Bitmap.CompressFormat.JPEG, 96, out)
        }
        outBmp.recycle()
        return outFile.absolutePath
    }

    /**
     * 4점 다각형 [tlX, tlY, trX, trY, brX, brY, blX, blY]을 정렬·검증한 뒤 직사각형으로 원근 보정한다.
     * - OpenCV INTER_CUBIC(4x4 3차 회선 보간)을 우선 사용하여 글자 획의 선예도를 보존한다.
     */
    /**
     * 휘어진 책 페이지 자동 평탄화 엔진 (2D Multi-Band Text-Line Cross-Correlation & Spine Foreshortening Dewarping):
     * 1) 사진·도표 영역을 제외한 순수 글자 줄의 수직 그래디언트 에너지를 20개 세로 스트립 × 상·하 6개 대역에서 추출
     * 2) 인접 스트립 간 정규화 교차상관(Normalized Cross-Correlation + 포물선 서브픽셀 보간)으로
     *    상단 곡선(cTop)과 하단 곡선(cBot)의 3D 책 휨 프로파일을 정밀 산출
     * 3) 책등(척추선) 근처에서 급격히 휘어지며 가로로 좁아진 글자 폭(Foreshortening)까지 아크 길이(Arc-Length) 보정으로 자동 복원
     * 4) 2D 양선형 보간(Bilinear Remap)으로 휘어진 글자 줄을 인쇄본처럼 반듯한 수평선으로 펴준다.
     */
    private fun dewarpCurvedBookPageInPlace(pixels: IntArray, w: Int, h: Int) {
        val aw = 400
        val ah = (h * aw / maxOf(1, w)).coerceIn(300, 640)
        val aTotal = aw * ah
        val aLum = IntArray(aTotal)

        for (ay in 0 until ah) {
            val sy = (ay * h / ah).coerceIn(0, h - 1)
            val sRow = sy * w
            val aRow = ay * aw
            for (ax in 0 until aw) {
                val sx = (ax * w / aw).coerceIn(0, w - 1)
                val c = pixels[sRow + sx]
                val r = (c shr 16) and 0xFF
                val g = (c shr 8) and 0xFF
                val b = c and 0xFF
                aLum[aRow + ax] = (r * 77 + g * 150 + b * 29) shr 8
            }
        }

        // 15x15 및 7x7 로컬 최대값 필터로 어두운 사진/박스 내부를 판별하여 제외하고 순수 글자 수직 그래디언트만 추출
        val max7H = IntArray(aTotal)
        val max15H = IntArray(aTotal)
        for (y in 0 until ah) {
            val row = y * aw
            for (x in 0 until aw) {
                var m7 = 0
                val x0_7 = maxOf(0, x - 3)
                val x1_7 = minOf(aw - 1, x + 3)
                for (xx in x0_7..x1_7) {
                    val v = aLum[row + xx]
                    if (v > m7) m7 = v
                }
                max7H[row + x] = m7

                var m15 = 0
                val x0_15 = maxOf(0, x - 7)
                val x1_15 = minOf(aw - 1, x + 7)
                for (xx in x0_15..x1_15) {
                    val v = aLum[row + xx]
                    if (v > m15) m15 = v
                }
                max15H[row + x] = m15
            }
        }

        val vgrad = FloatArray(aTotal)
        for (y in 1 until ah - 1) {
            val y0_7 = maxOf(0, y - 3)
            val y1_7 = minOf(ah - 1, y + 3)
            val y0_15 = maxOf(0, y - 7)
            val y1_15 = minOf(ah - 1, y + 7)
            val row = y * aw
            for (x in 0 until aw) {
                var m7 = 0
                for (yy in y0_7..y1_7) {
                    val v = max7H[yy * aw + x]
                    if (v > m7) m7 = v
                }
                var m15 = 0
                for (yy in y0_15..y1_15) {
                    val v = max15H[yy * aw + x]
                    if (v > m15) m15 = v
                }
                if (m15 - m7 <= 18) {
                    val g = kotlin.math.abs(aLum[(y + 1) * aw + x] - aLum[(y - 1) * aw + x]) - 14
                    if (g > 0) vgrad[row + x] = g.toFloat()
                }
            }
        }

        val N = 20
        val stripW = aw / N

        fun computeSubBandCurve(bands: List<Pair<Int, Int>>): FloatArray {
            val bCount = bands.size
            val bandShifts = Array(bCount) { FloatArray(N) }
            val bandConfs = Array(bCount) { FloatArray(N) }

            for (bIdx in 0 until bCount) {
                val y0 = bands[bIdx].first.coerceIn(1, ah - 10)
                val y1 = bands[bIdx].second.coerceIn(y0 + 8, ah - 2)
                val len = y1 - y0
                val profiles = Array(N) { FloatArray(len) }

                for (k in 0 until N) {
                    val x0 = k * stripW
                    val x1 = minOf(aw, (k + 1) * stripW)
                    val spanX = maxOf(1, x1 - x0).toFloat()
                    var sum = 0f
                    for (yy in y0 until y1) {
                        val r = yy * aw
                        var rowSum = 0f
                        for (xx in x0 until x1) rowSum += vgrad[r + xx]
                        val v = rowSum / spanX
                        profiles[k][yy - y0] = v
                        sum += v
                    }
                    val mean = sum / len.toFloat()
                    for (i in 0 until len) profiles[k][i] -= mean
                }

                for (k in 1 until N - 1) {
                    val p0 = profiles[k]
                    val p1 = profiles[k + 1]
                    var e0 = 0.0
                    var e1 = 0.0
                    for (i in 0 until len) {
                        e0 += p0[i] * p0[i]
                        e1 += p1[i] * p1[i]
                    }
                    val denom = kotlin.math.sqrt(e0 * e1).toFloat()
                    if (denom < 1e-3f) continue

                    val maxLag = if (k <= 4 || k >= N - 6) 6 else 3
                    val corrs = FloatArray(maxLag * 2 + 1)
                    var bestLag = 0
                    var bestCorr = -1e9f

                    for (lag in -maxLag..maxLag) {
                        var sum = 0f
                        if (lag < 0) {
                            val off = -lag
                            for (i in 0 until (len - off)) sum += p0[i + off] * p1[i]
                        } else if (lag > 0) {
                            for (i in 0 until (len - lag)) sum += p0[i] * p1[i + lag]
                        } else {
                            for (i in 0 until len) sum += p0[i] * p1[i]
                        }
                        val c = sum / denom
                        corrs[lag + maxLag] = c
                        if (c > bestCorr) {
                            bestCorr = c
                            bestLag = lag
                        }
                    }

                    var subLag = bestLag.toFloat()
                    if (bestLag > -maxLag && bestLag < maxLag) {
                        val cm = corrs[bestLag - 1 + maxLag]
                        val c0 = corrs[bestLag + maxLag]
                        val cp = corrs[bestLag + 1 + maxLag]
                        val d = 2f * (2f * c0 - cm - cp)
                        if (kotlin.math.abs(d) > 1e-5f) {
                            subLag += ((cp - cm) / d).coerceIn(-0.5f, 0.5f)
                        }
                    }
                    if (bestCorr > 0.30f) {
                        bandShifts[bIdx][k + 1] = subLag
                        bandConfs[bIdx][k + 1] = bestCorr
                    }
                }
            }

            val finalS = FloatArray(N)
            for (k in 1 until N) {
                val vals = ArrayList<Float>()
                val wts = ArrayList<Float>()
                for (bIdx in 0 until bCount) {
                    val c = bandConfs[bIdx][k]
                    if (c > 0.30f) {
                        vals.add(bandShifts[bIdx][k])
                        wts.add(c * c)
                    }
                }
                if (vals.isNotEmpty()) {
                    val sorted = vals.sorted()
                    val med = sorted[sorted.size / 2]
                    var sw = 0f
                    var sv = 0f
                    for (i in vals.indices) {
                        if (kotlin.math.abs(vals[i] - med) <= 2.4f) {
                            sv += vals[i] * wts[i]
                            sw += wts[i]
                        }
                    }
                    if (sw > 0f) finalS[k] = sv / sw
                }
            }

            val rawCurve = FloatArray(N)
            var acc = 0f
            for (k in 0 until N) {
                acc += finalS[k]
                rawCurve[k] = acc
            }
            var refMean = 0f
            for (k in 5..14) refMean += rawCurve[k]
            refMean /= 10f
            for (k in 0 until N) rawCurve[k] -= refMean

            val smoothed = FloatArray(N)
            for (k in 0 until N) {
                val km = rawCurve[maxOf(0, k - 1)]
                val k0 = rawCurve[k]
                val kp = rawCurve[minOf(N - 1, k + 1)]
                smoothed[k] = 0.2f * km + 0.6f * k0 + 0.2f * kp
            }
            return smoothed
        }

        val cTop = computeSubBandCurve(
            listOf(
                (ah * 7 / 100) to (ah * 22 / 100),
                (ah * 14 / 100) to (ah * 32 / 100),
                (ah * 20 / 100) to (ah * 36 / 100)
            )
        )
        val cBot = computeSubBandCurve(
            listOf(
                (ah * 36 / 100) to (ah * 54 / 100),
                (ah * 42 / 100) to (ah * 64 / 100),
                (ah * 50 / 100) to (ah * 78 / 100)
            )
        )

        // 표(Table)가 많은 평평한 유인물(예: 영어소리의 실제)인지 검사:
        // 긴 수직 표 테두리 선이 여러 개 존재하면 평평한 표 문서이므로 곡면 변형을 건너뛰어 표의 직선성을 100% 유지!
        var verticalTableLineCols = 0
        for (x in (aw / 8) until (aw * 7 / 8) step 2) {
            var darkRun = 0
            var maxRun = 0
            for (y in (ah / 8) until (ah * 7 / 8)) {
                val idx = y * aw + x
                if (max15H[idx] - aLum[idx] > 28) {
                    darkRun++
                    if (darkRun > maxRun) maxRun = darkRun
                } else {
                    darkRun = 0
                }
            }
            if (maxRun > ah / 7) verticalTableLineCols++
        }
        if (verticalTableLineCols >= 3) return

        var maxBend = 0f
        for (k in 0 until N) {
            maxBend = maxOf(maxBend, maxOf(kotlin.math.abs(cTop[k]), kotlin.math.abs(cBot[k])))
        }
        // 실제 휘어진 책 페이지만 보정하고 평평한 종이(곡률 2.8px 미만)는 직선 원근 투영 그대로 보존
        if (maxBend < 2.8f) return

        val scaleY = h.toFloat() / ah.toFloat()
        val dyTop = FloatArray(w)
        val dyBot = FloatArray(w)
        val fullStripW = w.toFloat() / N.toFloat()

        for (x in 0 until w) {
            val pos = (x.toFloat() / fullStripW) - 0.5f
            val k0 = pos.toInt().coerceIn(0, N - 1)
            val k1 = (k0 + 1).coerceIn(0, N - 1)
            val t = (pos - k0.toFloat()).coerceIn(0f, 1f)
            dyTop[x] = ((1f - t) * cTop[k0] + t * cTop[k1]) * scaleY
            dyBot[x] = ((1f - t) * cBot[k0] + t * cBot[k1]) * scaleY
        }

        // 책등 곡률 기울기(|dC/dx|)에 따른 가로 폭 압축(Foreshortening) 역보정 테이블 생성
        val cumArc = FloatArray(w)
        var arcAcc = 0f
        for (x in 0 until w) {
            val xm = maxOf(0, x - 1)
            val xp = minOf(w - 1, x + 1)
            val dxSpan = maxOf(1, xp - xm).toFloat()
            val slope = 0.5f * ((dyTop[xp] - dyTop[xm]) + (dyBot[xp] - dyBot[xm])) / dxSpan
            val stretch = kotlin.math.sqrt(1.0 + 3.2 * (slope * slope)).toFloat().coerceIn(1.0f, 1.45f)
            arcAcc += stretch
            cumArc[x] = arcAcc
        }

        val srcXFixed = IntArray(w)
        val totalArc = maxOf(1e-4f, cumArc[w - 1] - cumArc[0])
        var searchIdx = 0
        for (x in 0 until w) {
            val targetArc = cumArc[0] + (x.toFloat() / maxOf(1, w - 1).toFloat()) * totalArc
            while (searchIdx < w - 2 && cumArc[searchIdx + 1] < targetArc) {
                searchIdx++
            }
            val a0 = cumArc[searchIdx]
            val a1 = cumArc[minOf(w - 1, searchIdx + 1)]
            val frac = if (a1 > a0) ((targetArc - a0) / (a1 - a0)).coerceIn(0f, 1f) else 0f
            srcXFixed[x] = ((searchIdx.toFloat() + frac) * 256f).toInt().coerceIn(0, (w - 1) shl 8)
        }

        val yRefTop = h * 0.22f
        val yRefSpan = maxOf(1f, h * 0.38f)
        val outPixels = IntArray(w * h)

        for (y in 0 until h) {
            val wBot = ((y.toFloat() - yRefTop) / yRefSpan).coerceIn(0f, 1f)
            val wTop = 1f - wBot
            // 상·하단 최외곽 3% 모서리에서 부드럽게 감쇠
            val edgeFade = when {
                y < h * 0.03f -> (y.toFloat() / maxOf(1f, h * 0.03f))
                y > h * 0.97f -> ((h - 1 - y).toFloat() / maxOf(1f, h * 0.03f))
                else -> 1f
            }.coerceIn(0f, 1f)

            val outRow = y * w
            for (x in 0 until w) {
                val dy = (wTop * dyTop[x] + wBot * dyBot[x]) * edgeFade
                val syFixed = ((y.toFloat() + dy) * 256f).toInt()
                if (syFixed < 0 || syFixed >= ((h - 1) shl 8)) {
                    outPixels[outRow + x] = 0xFFFFFFFF.toInt()
                    continue
                }
                val sxFixed = srcXFixed[x]
                val sx0 = sxFixed shr 8
                val sx1 = minOf(w - 1, sx0 + 1)
                val wx1 = sxFixed and 0xFF
                val wx0 = 256 - wx1

                val sy0 = syFixed shr 8
                val sy1 = minOf(h - 1, sy0 + 1)
                val wy1 = syFixed and 0xFF
                val wy0 = 256 - wy1

                val r0 = sy0 * w
                val r1 = sy1 * w
                val c00 = pixels[r0 + sx0]
                val c01 = pixels[r0 + sx1]
                val c10 = pixels[r1 + sx0]
                val c11 = pixels[r1 + sx1]

                val w00 = wx0 * wy0
                val w01 = wx1 * wy0
                val w10 = wx0 * wy1
                val w11 = wx1 * wy1

                val red = (((c00 shr 16 and 0xFF) * w00 + (c01 shr 16 and 0xFF) * w01 + (c10 shr 16 and 0xFF) * w10 + (c11 shr 16 and 0xFF) * w11) shr 16).coerceIn(0, 255)
                val grn = (((c00 shr 8 and 0xFF) * w00 + (c01 shr 8 and 0xFF) * w01 + (c10 shr 8 and 0xFF) * w10 + (c11 shr 8 and 0xFF) * w11) shr 16).coerceIn(0, 255)
                val blu = (((c00 and 0xFF) * w00 + (c01 and 0xFF) * w01 + (c10 and 0xFF) * w10 + (c11 and 0xFF) * w11) shr 16).coerceIn(0, 255)

                outPixels[outRow + x] = (0xFF shl 24) or (red shl 16) or (grn shl 8) or blu
            }
        }

        System.arraycopy(outPixels, 0, pixels, 0, w * h)
    }

    private fun safeWarpPerspectiveQuad(src: Bitmap, rawQ: FloatArray, maxDim: Int): Bitmap {
        val ordered = DocumentQuadDetector.ensureValidOrderedQuad(rawQ) ?: return src
        val sw = src.width.toFloat()
        val sh = src.height.toFloat()
        val srcPts = floatArrayOf(
            ordered[0] * sw, ordered[1] * sh,
            ordered[2] * sw, ordered[3] * sh,
            ordered[4] * sw, ordered[5] * sh,
            ordered[6] * sw, ordered[7] * sh
        )
        val topW = kotlin.math.hypot((srcPts[2] - srcPts[0]).toDouble(), (srcPts[3] - srcPts[1]).toDouble()).toFloat()
        val botW = kotlin.math.hypot((srcPts[4] - srcPts[6]).toDouble(), (srcPts[5] - srcPts[7]).toDouble()).toFloat()
        val leftH = kotlin.math.hypot((srcPts[6] - srcPts[0]).toDouble(), (srcPts[7] - srcPts[1]).toDouble()).toFloat()
        val rightH = kotlin.math.hypot((srcPts[4] - srcPts[2]).toDouble(), (srcPts[5] - srcPts[3]).toDouble()).toFloat()

        if (topW < sw * 0.20f || botW < sw * 0.20f || leftH < sh * 0.20f || rightH < sh * 0.20f) {
            return src
        }

        var dstW = maxOf(topW, botW).coerceAtLeast(240f)
        var dstH = maxOf(leftH, rightH).coerceAtLeast(240f)
        val longest = maxOf(dstW, dstH)
        if (longest > maxDim) {
            val s = maxDim.toFloat() / longest
            dstW *= s
            dstH *= s
        } else if (maxDim >= 2000 && longest < 2200f) {
            val s = minOf(maxDim.toFloat(), 2300f) / longest
            dstW *= s
            dstH *= s
        }
        val iw = dstW.toInt().coerceAtLeast(120)
        val ih = dstH.toInt().coerceAtLeast(120)

        OpenCvScanEngine.warpPerspectiveCubic(src, srcPts, iw, ih)?.let { cubicOut ->
            if (cubicOut !== src) src.recycle()
            return cubicOut
        }

        val dstPts = floatArrayOf(
            0f, 0f,
            iw.toFloat(), 0f,
            iw.toFloat(), ih.toFloat(),
            0f, ih.toFloat()
        )
        val matrix = android.graphics.Matrix()
        if (!matrix.setPolyToPoly(srcPts, 0, dstPts, 0, 4)) {
            return src
        }
        return try {
            val out = Bitmap.createBitmap(iw, ih, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(out)
            canvas.drawColor(Color.WHITE)
            val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
            canvas.drawBitmap(src, matrix, paint)
            if (out !== src) src.recycle()
            out
        } catch (_: Throwable) {
            src
        }
    }

    /**
     * 책·노트 필기·인쇄 글자 가독성 극대화 알고리즘 (v102):
     * 1) 사전 테두리 변형 없이 순수 원본 밝기에서 블록 상위 밝기(88퍼센타일 수준) + 3x3 모폴로지 팽창 + 3x3 스무딩으로
     *    좌하단 등 짙은 그림자 영역(lum ~ 90)까지 단차 없이 100% 매끄럽게 추적한다.
     * 2) 조명 정규화된 반사율(normLum) 위에서 등방성 3x3 가우시안 언샤프 마스크(노이즈 코어링 포함)를 적용하여
     *    글자 획 두께를 부풀리지 않고 중심 선예도만 또렷하게 살린다.
     * 3) 안티앨리어싱 계조 보존형 S-커브 LUT(inkDarkCeil ~ 75, paperWhiteFloor ~ 223)를 적용하여
     *    배경은 100% 순백색(#FFFFFF)으로 만들면서 작은 한글 받침과 손글씨 획 사이가 뭉개지지 않게 복원한다.
     */
    private fun enhanceDocumentPixelsHighQuality(
        pixels: IntArray,
        w: Int,
        h: Int,
        mode: String,
        contrast: Float,
        eraseFingers: Boolean
    ) {
        val total = w * h
        val rawLum = IntArray(total)
        for (i in 0 until total) {
            val c = pixels[i]
            val r = (c shr 16) and 0xFF
            val g = (c shr 8) and 0xFF
            val b = c and 0xFF
            rawLum[i] = (r * 77 + g * 150 + b * 29) shr 8
        }

        // 짙은 손/휴대폰 그림자(밝기 85~120)도 회색 얼룩 없이 255 순백색으로 정규화되도록 하한을 48로 설정
        val minBgFloor = 48

        // 1. 모폴로지 배경 조명 그리드 생성 (셀 크기 step = min(w,h) / 75)
        val step = maxOf(8, minOf(w, h) / 75)
        val gw = (w + step - 1) / step
        val gh = (h + step - 1) / step
        val gridMax = IntArray(gw * gh)

        for (gy in 0 until gh) {
            val y0 = gy * step
            val y1 = minOf(h, y0 + step)
            for (gx in 0 until gw) {
                val x0 = gx * step
                val x1 = minOf(w, x0 + step)
                var firstL = 0
                var secondL = 0
                var thirdL = 0
                for (y in y0 until y1 step 2) {
                    val row = y * w
                    for (x in x0 until x1 step 2) {
                        val l = rawLum[row + x]
                        if (l >= firstL) {
                            thirdL = secondL; secondL = firstL; firstL = l
                        } else if (l >= secondL) {
                            thirdL = secondL; secondL = l
                        } else if (l > thirdL) {
                            thirdL = l
                        }
                    }
                }
                val cellPaper = if (thirdL > 0) thirdL else if (secondL > 0) secondL else firstL
                gridMax[gy * gw + gx] = maxOf(minBgFloor, cellPaper)
            }
        }

        // 3x3 모폴로지 팽창 (급격한 그림자 경계에서도 L자 단차나 후광이 생기지 않도록 국소 종이 밝기 추적)
        val gridDilated = IntArray(gw * gh)
        for (gy in 0 until gh) {
            val r0 = maxOf(0, gy - 1)
            val r1 = minOf(gh - 1, gy + 1)
            for (gx in 0 until gw) {
                val c0 = maxOf(0, gx - 1)
                val c1 = minOf(gw - 1, gx + 1)
                var m = minBgFloor
                for (yy in r0..r1) {
                    val ro = yy * gw
                    for (xx in c0..c1) {
                        if (gridMax[ro + xx] > m) m = gridMax[ro + xx]
                    }
                }
                gridDilated[gy * gw + gx] = m
            }
        }

        // 3x3 가중 스무딩으로 조명 경계를 매끄럽게 연결
        val bgGrid = IntArray(gw * gh)
        for (gy in 0 until gh) {
            val r0 = maxOf(0, gy - 1)
            val r1 = minOf(gh - 1, gy + 1)
            for (gx in 0 until gw) {
                val c0 = maxOf(0, gx - 1)
                val c1 = minOf(gw - 1, gx + 1)
                var sum = 0
                var wSum = 0
                for (yy in r0..r1) {
                    val wy = 2 - kotlin.math.abs(yy - gy)
                    val ro = yy * gw
                    for (xx in c0..c1) {
                        val wx = 2 - kotlin.math.abs(xx - gx)
                        val wt = wy * wx
                        sum += gridDilated[ro + xx] * wt
                        wSum += wt
                    }
                }
                bgGrid[gy * gw + gx] = maxOf(minBgFloor, sum / maxOf(1, wSum))
            }
        }

        // 2. 픽셀별 양선형 배경 조명 보간 -> 정규화 반사율(normLum) 및 로컬 배경(localBgArr) 계산
        val normLum = IntArray(total)
        val localBgArr = IntArray(total)
        val invStep = 1.0f / step.toFloat()
        for (y in 0 until h) {
            val fy = (y * invStep).coerceIn(0f, (gh - 1).toFloat())
            val gy0 = fy.toInt().coerceIn(0, gh - 1)
            val gy1 = minOf(gh - 1, gy0 + 1)
            val wy = fy - gy0
            val wy0 = ((1f - wy) * 256f).toInt()
            val wy1 = (wy * 256f).toInt()
            val ro0 = gy0 * gw
            val ro1 = gy1 * gw
            val rowOffset = y * w

            for (x in 0 until w) {
                val fx = (x * invStep).coerceIn(0f, (gw - 1).toFloat())
                val gx0 = fx.toInt().coerceIn(0, gw - 1)
                val gx1 = minOf(gw - 1, gx0 + 1)
                val wx = fx - gx0
                val wx0 = ((1f - wx) * 256f).toInt()
                val wx1 = (wx * 256f).toInt()

                val b0 = bgGrid[ro0 + gx0] * wx0 + bgGrid[ro0 + gx1] * wx1
                val b1 = bgGrid[ro1 + gx0] * wx0 + bgGrid[ro1 + gx1] * wx1
                val localBg = maxOf(minBgFloor, (b0 * wy0 + b1 * wy1) shr 16).coerceAtMost(255)

                val idx = rowOffset + x
                localBgArr[idx] = localBg
                normLum[idx] = ((rawLum[idx] * 255 + (localBg shr 1)) / localBg).coerceIn(0, 255)
            }
        }

        // 3. 등방성 3x3 가우시안 언샤프 마스크 (노이즈 코어링으로 종이 질감 노이즈 증폭 차단 + 얇은 글자 획 보존)
        val sharpRel = IntArray(total)
        for (y in 0 until h) {
            val row = y * w
            if (y == 0 || y == h - 1) {
                for (x in 0 until w) sharpRel[row + x] = normLum[row + x]
                continue
            }
            sharpRel[row] = normLum[row]
            sharpRel[row + w - 1] = normLum[row + w - 1]
            for (x in 1 until w - 1) {
                val idx = row + x
                val c = normLum[idx]
                val blur = (
                    normLum[idx - w - 1] + (normLum[idx - w] shl 1) + normLum[idx - w + 1] +
                    (normLum[idx - 1] shl 1) + (c shl 2) + (normLum[idx + 1] shl 1) +
                    normLum[idx + w - 1] + (normLum[idx + w] shl 1) + normLum[idx + w + 1]
                ) shr 4
                val diff = c - blur
                val boosted = if (diff in -3..3) c else (c + (diff * 7) / 8).coerceIn(0, 255)
                sharpRel[idx] = boosted
            }
        }

        // 4. 안티앨리어싱 보존형 S-커브 LUT (글자 획이 뭉개지거나 두꺼워지지 않도록 75..223 계조를 매끄럽게 유지)
        val paperWhiteFloor = (232 - (contrast * 18f)).toInt().coerceIn(206, 242)
        val inkDarkCeil = (56 + (contrast * 38f)).toInt().coerceIn(45, 110)
        val span = maxOf(1, paperWhiteFloor - inkDarkCeil)
        val gamma = 1.10 + contrast * 0.28

        val lut = IntArray(256)
        for (v in 0..255) {
            lut[v] = when {
                v >= paperWhiteFloor -> 255
                v <= inkDarkCeil -> (v * 20 / maxOf(1, inkDarkCeil)).coerceIn(0, 20)
                else -> {
                    val t = ((v - inkDarkCeil).toDouble() / span.toDouble()).coerceIn(0.0, 1.0)
                    val curved = Math.pow(t, gamma)
                    (20.0 + curved * 235.0).toInt().coerceIn(0, 255)
                }
            }
        }

        // 5. 모드별 최종 픽셀 합성
        for (idx in 0 until total) {
            val c = pixels[idx]
            val r = (c shr 16) and 0xFF
            val g = (c shr 8) and 0xFF
            val b = c and 0xFF
            val maxC = maxOf(r, maxOf(g, b))
            val minC = minOf(r, minOf(g, b))
            val sat = maxC - minC
            val rel = sharpRel[idx]
            val localBg = localBgArr[idx]

            when (mode) {
                "magic" -> {
                    if (sat < 42) {
                        val v = lut[rel]
                        pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                    } else if (rel >= paperWhiteFloor && sat < 54) {
                        pixels[idx] = 0xFFFFFFFF.toInt()
                    } else {
                        val targetLum = lut[rel]
                        val curLum = maxOf(1, rawLum[idx])
                        val scale = (targetLum * 256) / curLum
                        val fr = ((r * scale) shr 8).coerceIn(0, 255)
                        val fg = ((g * scale) shr 8).coerceIn(0, 255)
                        val fb = ((b * scale) shr 8).coerceIn(0, 255)
                        pixels[idx] = (0xFF shl 24) or (fr shl 16) or (fg shl 8) or fb
                    }
                }
                "noshadow" -> {
                    val softFloor = (236 - (contrast * 14f)).toInt().coerceIn(216, 244)
                    val softCeil = (48 + (contrast * 28f)).toInt().coerceIn(38, 92)
                    if (sat < 38) {
                        val v = when {
                            rel >= softFloor -> 255
                            rel <= softCeil -> (rel * 26 / maxOf(1, softCeil)).coerceIn(0, 26)
                            else -> {
                                val t = (rel - softCeil).toFloat() / maxOf(1, softFloor - softCeil).toFloat()
                                (26f + t * 229f).toInt().coerceIn(0, 255)
                            }
                        }
                        pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                    } else {
                        val nr = ((r * 255) / localBg).coerceIn(0, 255)
                        val ng = ((g * 255) / localBg).coerceIn(0, 255)
                        val nb = ((b * 255) / localBg).coerceIn(0, 255)
                        pixels[idx] = (0xFF shl 24) or (nr shl 16) or (ng shl 8) or nb
                    }
                }
                "brighten" -> {
                    val boost = (localBg * 3 + 255 * 2) / 5
                    val br = ((r * 255) / maxOf(80, boost)).coerceIn(0, 255)
                    val bg = ((g * 255) / maxOf(80, boost)).coerceIn(0, 255)
                    val bb = ((b * 255) / maxOf(80, boost)).coerceIn(0, 255)
                    pixels[idx] = (0xFF shl 24) or (br shl 16) or (bg shl 8) or bb
                }
                "scan_bw" -> {
                    val bwCenter = (168 + ((contrast - 0.5f) * 44f)).toInt().coerceIn(130, 205)
                    val v = when {
                        rel >= bwCenter + 18 -> 255
                        rel <= bwCenter - 18 -> 0
                        else -> ((rel - (bwCenter - 18)) * 255 / 36).coerceIn(0, 255)
                    }
                    pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                }
                "invert" -> {
                    val v = lut[rel]
                    val inv = (255 - v).coerceIn(18, 250)
                    pixels[idx] = (0xFF shl 24) or (inv shl 16) or (inv shl 8) or inv
                }
            }
        }

        // 6. 조명 정규화 완료 후 손가락·테두리 이물질·반대쪽 책 페이지 잘린 글씨 자동 보정
        //    (이미 배경이 순백색 #FFFFFF로 정규화된 뒤에 순백색으로 지우므로 단차나 얼룩이 절대 생기지 않음!)
        if (w >= 80 && h >= 80) {
            autoCleanFingersAndOuterClutterAfterEnhance(pixels, normLum, w, h, mode)
        }
    }

    /**
     * 조명 정규화 이후 실행되는 손가락·외곽 이물질·반대쪽 페이지 잘린 글자 자동 제거기:
     * 1) 상·하·좌·우 11% 가장자리 내의 손가락(피부색 및 손가락 그림자 덩어리)을 찾아 주변까지 순백색으로 지움
     * 2) 이미지 최외곽(x=0, x=w-1, y=0, y=h-1)과 직접 맞닿아 있는 책 표지·책상 모서리·잡동사니(최대 5% 폭)를 순백색으로 제거
     * 3) 펼친 책 스캔 시 좌/우 끝 2.4% 이내에 반대쪽 페이지 글자 조각이 걸친 경우 여백을 감지해 자동으로 백색 보정
     */
    private fun autoCleanFingersAndOuterClutterAfterEnhance(
        pixels: IntArray,
        normLum: IntArray,
        w: Int,
        h: Int,
        mode: String
    ) {
        val fillWhite = if (mode == "invert") 0xFF141414.toInt() else 0xFFFFFFFF.toInt()
        val marginX = (w * 0.11f).toInt().coerceAtLeast(8)
        val marginY = (h * 0.11f).toInt().coerceAtLeast(8)

        // 1. 손가락(피부색) 마스크 검출 및 반경 확장 제거
        val skinMask = BooleanArray(w * h)
        var hasSkin = false
        for (y in 0 until h) {
            val inEdgeY = y < marginY || y >= h - marginY
            val row = y * w
            for (x in 0 until w) {
                if (!inEdgeY && x >= marginX && x < w - marginX) continue
                val c = pixels[row + x]
                val r = (c shr 16) and 0xFF
                val g = (c shr 8) and 0xFF
                val b = c and 0xFF
                val maxC = maxOf(r, maxOf(g, b))
                val minC = minOf(r, minOf(g, b))
                val sat = maxC - minC
                if (r > 95 && g > 42 && b > 22 && sat >= 24 && r > g && (r - b) >= 20 && (r + g + b) in 180..680) {
                    skinMask[row + x] = true
                    hasSkin = true
                }
            }
        }
        if (hasSkin) {
            val rad = maxOf(3, minOf(w, h) / 110)
            for (y in 0 until h) {
                val inEdgeY = y < marginY || y >= h - marginY
                val row = y * w
                for (x in 0 until w) {
                    if (!inEdgeY && x >= marginX && x < w - marginX) continue
                    if (skinMask[row + x]) {
                        val y0 = maxOf(0, y - rad)
                        val y1 = minOf(h - 1, y + rad)
                        val x0 = maxOf(0, x - rad)
                        val x1 = minOf(w - 1, x + rad)
                        for (yy in y0..y1) {
                            val rr = yy * w
                            for (xx in x0..x1) {
                                pixels[rr + xx] = fillWhite
                            }
                        }
                    }
                }
            }
        }

        // 2. 최외곽 경계(x=0, x=w-1, y=0, y=h-1)에 직접 붙어 있는 책 표지·책상 테두리 이물질 제거
        //    (normLum 기준으로 이미 종이 그림자는 >= 225이므로, normLum < 212인 실제 외곽 이물질만 정확히 제거됨)
        val borderMaxX = (w * 0.048f).toInt().coerceIn(4, 120)
        val borderMaxY = (h * 0.042f).toInt().coerceIn(4, 105)

        for (y in 0 until h) {
            val row = y * w
            if (normLum[row] < 210) {
                var x = 0
                while (x < borderMaxX && normLum[row + x] < 224) {
                    pixels[row + x] = fillWhite
                    x++
                }
                if (x in 1 until borderMaxX) {
                    for (f in 0..2) if (x + f < w) pixels[row + x + f] = fillWhite
                }
            }
            if (normLum[row + w - 1] < 210) {
                var x = w - 1
                val minX = w - 1 - borderMaxX
                while (x > minX && normLum[row + x] < 224) {
                    pixels[row + x] = fillWhite
                    x--
                }
                if (x < w - 1 && x > minX) {
                    for (f in 0..2) if (x - f >= 0) pixels[row + x - f] = fillWhite
                }
            }
        }

        for (x in 0 until w) {
            if (normLum[(h - 1) * w + x] < 210) {
                var y = h - 1
                val minY = h - 1 - borderMaxY
                while (y > minY && normLum[y * w + x] < 224) {
                    pixels[y * w + x] = fillWhite
                    y--
                }
                if (y < h - 1 && y > minY) {
                    for (f in 0..2) if (y - f >= 0) pixels[(y - f) * w + x] = fillWhite
                }
            }
            if (normLum[x] < 200) {
                var y = 0
                val maxY = (h * 0.028f).toInt().coerceIn(3, 70)
                while (y < maxY && normLum[y * w + x] < 222) {
                    pixels[y * w + x] = fillWhite
                    y++
                }
            }
        }

        // 3. 좌/우 끝 2.4% 가장자리에 반대쪽 책 페이지 글자 조각이나 접힌 자국이 찍힌 경우:
        //    그 안쪽(2.6% ~ 4.8%)에 세로 흰 여백(Clean Margin Gap)이 존재하면 바깥 2.4%의 잔여 흔적을 깔끔하게 지움
        val stripW = (w * 0.024f).toInt().coerceIn(4, 65)
        val gapW = (w * 0.022f).toInt().coerceIn(4, 60)
        if (w > 240) {
            // 우측 끝 검사
            var rightGapWhiteCount = 0
            var rightGapTotal = 0
            val gx0 = w - stripW - gapW
            val gx1 = w - stripW
            for (y in (h / 8) until (h * 7 / 8) step 2) {
                val row = y * w
                for (x in gx0 until gx1 step 2) {
                    rightGapTotal++
                    if (normLum[row + x] >= 220) rightGapWhiteCount++
                }
            }
            if (rightGapTotal > 0 && rightGapWhiteCount * 100 / rightGapTotal >= 90) {
                for (y in 0 until h) {
                    val row = y * w
                    for (x in (w - stripW) until w) {
                        pixels[row + x] = fillWhite
                    }
                }
            }

            // 좌측 끝 검사
            var leftGapWhiteCount = 0
            var leftGapTotal = 0
            for (y in (h / 8) until (h * 7 / 8) step 2) {
                val row = y * w
                for (x in stripW until (stripW + gapW) step 2) {
                    leftGapTotal++
                    if (normLum[row + x] >= 220) leftGapWhiteCount++
                }
            }
            if (leftGapTotal > 0 && leftGapWhiteCount * 100 / leftGapTotal >= 90) {
                for (y in 0 until h) {
                    val row = y * w
                    for (x in 0 until stripW) {
                        pixels[row + x] = fillWhite
                    }
                }
            }
        }

        // 4. 문구(글씨·표·도표·쪽번호)가 없는 바깥쪽 빈 여백을 100% 순백색(#FFFFFF)으로 덮기:
        //    행별로 실제 문구가 존재하는 좌·우 경계(rowLeft[y] ~ rowRight[y])를 찾고,
        //    문구 바깥쪽의 빈 상·하·좌·우 여백 및 접힌 모서리 그림자를 깔끔하게 순백색으로 덮는다.
        val pad = (minOf(w, h) * 0.024f).toInt().coerceIn(8, 72)
        val ix0 = (w * 0.08f).toInt()
        val ix1 = (w * 0.92f).toInt()
        val iy0 = (h * 0.05f).toInt()
        val iy1 = (h * 0.90f).toInt()
        val bx = (w * 0.032f).toInt().coerceAtLeast(4)
        val by = (h * 0.026f).toInt().coerceAtLeast(4)
        val cornerX = (w * 0.12f).toInt()
        val cornerY = (h * 0.10f).toInt()

        val rowMin = IntArray(h) { w }
        val rowMax = IntArray(h) { -1 }

        for (y in by until (h - by)) {
            val row = y * w
            val inInteriorY = y in iy0..iy1
            val inBottomCornerY = y >= h - cornerY
            var firstX = w
            var lastX = -1
            var inkCount = 0

            val rUp = maxOf(0, y - 3) * w
            val rDn = minOf(h - 1, y + 3) * w

            for (x in bx until (w - bx)) {
                if (inBottomCornerY && (x < cornerX || x >= w - cornerX)) continue
                val idx = row + x
                val v = normLum[idx]
                val inInterior = inInteriorY && (x in ix0..ix1)
                val lumLimit = if (inInterior) 185 else 145
                if (v < lumLimit) {
                    val xL = maxOf(0, x - 3)
                    val xR = minOf(w - 1, x + 3)
                    val localMax = maxOf(
                        maxOf(normLum[row + xL], normLum[row + xR]),
                        maxOf(normLum[rUp + x], normLum[rDn + x])
                    )
                    val contrastNeed = if (inInterior) 28 else 48
                    if (localMax - v >= contrastNeed) {
                        if (x < firstX) firstX = x
                        if (x > lastX) lastX = x
                        inkCount++
                    }
                }
            }
            if (inkCount >= 2 && firstX <= lastX) {
                rowMin[y] = maxOf(0, firstX - pad)
                rowMax[y] = minOf(w - 1, lastX + pad)
            }
        }

        val rowLeft = IntArray(h) { w }
        val rowRight = IntArray(h) { -1 }
        var anyContentFound = false
        for (y in 0 until h) {
            val y0 = maxOf(0, y - pad)
            val y1 = minOf(h - 1, y + pad)
            var minL = w
            var maxR = -1
            for (yy in y0..y1) {
                if (rowMin[yy] < minL) minL = rowMin[yy]
                if (rowMax[yy] > maxR) maxR = rowMax[yy]
            }
            rowLeft[y] = minL
            rowRight[y] = maxR
            if (minL <= maxR) anyContentFound = true
        }

        if (anyContentFound) {
            for (y in 0 until h) {
                val row = y * w
                val l = rowLeft[y]
                val r = rowRight[y]
                if (l > r) {
                    for (x in 0 until w) pixels[row + x] = fillWhite
                } else {
                    for (x in 0 until l) pixels[row + x] = fillWhite
                    for (x in (r + 1) until w) pixels[row + x] = fillWhite
                }
            }
        }
    }

    private fun eraseEdgeFingersInPlace(pixels: IntArray, w: Int, h: Int) {
        val marginX = (w * 0.06f).toInt().coerceAtLeast(4)
        val marginBottom = (h * 0.06f).toInt().coerceAtLeast(4)

        var sumR = 0L; var sumG = 0L; var sumB = 0L; var cnt = 0L
        val stepY = maxOf(1, h / 40)
        val stepX = maxOf(1, w / 40)
        for (y in marginBottom until (h - marginBottom) step stepY) {
            val row = y * w
            for (x in marginX until (w - marginX) step stepX) {
                val c = pixels[row + x]
                val r = (c shr 16) and 0xFF
                val g = (c shr 8) and 0xFF
                val b = c and 0xFF
                if (r + g + b > 420) {
                    sumR += r; sumG += g; sumB += b; cnt++
                }
            }
        }
        val paperR = if (cnt > 0) (sumR / cnt).toInt().coerceIn(200, 255) else 245
        val paperG = if (cnt > 0) (sumG / cnt).toInt().coerceIn(200, 255) else 245
        val paperB = if (cnt > 0) (sumB / cnt).toInt().coerceIn(200, 255) else 245
        val paperColor = (0xFF shl 24) or (paperR shl 16) or (paperG shl 8) or paperB

        for (y in 0 until h) {
            val row = y * w
            val inBottom = y >= h - marginBottom
            for (x in 0 until w) {
                if (x < marginX || x >= w - marginX || inBottom) {
                    val c = pixels[row + x]
                    val r = (c shr 16) and 0xFF
                    val g = (c shr 8) and 0xFF
                    val b = c and 0xFF
                    val sat = maxOf(r, maxOf(g, b)) - minOf(r, minOf(g, b))
                    if (r > 105 && g > 50 && b > 30 && sat > 32 && (r - g) > 18 && g >= b && (r + g + b) in 200..650) {
                        pixels[row + x] = paperColor
                    }
                }
            }
        }
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
                val targetW = 2480
                val scale = targetW.toFloat() / bmp.width.toFloat().coerceAtLeast(1f)
                val pageW = targetW
                val pageH = (bmp.height * scale).toInt().coerceAtLeast(600)

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

/**
 * 무료 오픈소스 OpenCV (org.opencv:opencv:4.10.0, Apache 2.0 라이선스) 기반
 * - Bicubic(INTER_CUBIC) 서브픽셀 원근 보정 및 리사이즈
 */
object OpenCvScanEngine {
    @Volatile
    var isLoaded = false

    fun ensureInitialized(): Boolean {
        if (isLoaded) return true
        return try {
            isLoaded = org.opencv.android.OpenCVLoader.initLocal()
            isLoaded
        } catch (_: Throwable) {
            false
        }
    }

    fun warpPerspectiveCubic(src: Bitmap, srcPts: FloatArray, iw: Int, ih: Int): Bitmap? {
        if (!ensureInitialized()) return null
        val srcMat = org.opencv.core.Mat()
        val dstMat = org.opencv.core.Mat()
        val srcQuad = org.opencv.core.MatOfPoint2f(
            org.opencv.core.Point(srcPts[0].toDouble(), srcPts[1].toDouble()),
            org.opencv.core.Point(srcPts[2].toDouble(), srcPts[3].toDouble()),
            org.opencv.core.Point(srcPts[4].toDouble(), srcPts[5].toDouble()),
            org.opencv.core.Point(srcPts[6].toDouble(), srcPts[7].toDouble())
        )
        val dstQuad = org.opencv.core.MatOfPoint2f(
            org.opencv.core.Point(0.0, 0.0),
            org.opencv.core.Point(iw.toDouble(), 0.0),
            org.opencv.core.Point(iw.toDouble(), ih.toDouble()),
            org.opencv.core.Point(0.0, ih.toDouble())
        )
        var M: org.opencv.core.Mat? = null
        return try {
            org.opencv.android.Utils.bitmapToMat(src, srcMat)
            M = org.opencv.imgproc.Imgproc.getPerspectiveTransform(srcQuad, dstQuad)
            org.opencv.imgproc.Imgproc.warpPerspective(
                srcMat,
                dstMat,
                M,
                org.opencv.core.Size(iw.toDouble(), ih.toDouble()),
                org.opencv.imgproc.Imgproc.INTER_CUBIC,
                org.opencv.core.Core.BORDER_CONSTANT,
                org.opencv.core.Scalar(255.0, 255.0, 255.0, 255.0)
            )
            val out = Bitmap.createBitmap(iw, ih, Bitmap.Config.ARGB_8888)
            org.opencv.android.Utils.matToBitmap(dstMat, out)
            out
        } catch (_: Throwable) {
            null
        } finally {
            srcMat.release()
            dstMat.release()
            srcQuad.release()
            dstQuad.release()
            M?.release()
        }
    }

    fun resizeCubicOrFallback(src: Bitmap, targetW: Int, targetH: Int): Bitmap {
        if (src.width == targetW && src.height == targetH) return src
        if (ensureInitialized()) {
            val srcMat = org.opencv.core.Mat()
            val dstMat = org.opencv.core.Mat()
            try {
                org.opencv.android.Utils.bitmapToMat(src, srcMat)
                val interp = if (targetW > src.width || targetH > src.height) {
                    org.opencv.imgproc.Imgproc.INTER_CUBIC
                } else {
                    org.opencv.imgproc.Imgproc.INTER_AREA
                }
                org.opencv.imgproc.Imgproc.resize(
                    srcMat,
                    dstMat,
                    org.opencv.core.Size(targetW.toDouble(), targetH.toDouble()),
                    0.0,
                    0.0,
                    interp
                )
                val out = Bitmap.createBitmap(targetW, targetH, Bitmap.Config.ARGB_8888)
                org.opencv.android.Utils.matToBitmap(dstMat, out)
                return out
            } catch (_: Throwable) {
            } finally {
                srcMat.release()
                dstMat.release()
            }
        }
        return Bitmap.createScaledBitmap(src, targetW, targetH, true)
    }
}

/**
 * 4방향 종이 포락선(Envelope) 경계 스캐닝 + 펼친 책 척추선(Book Spine Crease) 분리 + 2단계 이상치 제거 직선 피팅 검출기 (v105):
 * - 기존의 단순 밝기 Flood-Fill 방식이 가진 두 가지 한계 완벽 해결:
 *   1) 펼친 책(Open Book) 스캔 시 반대쪽 페이지까지 영역이 넘어가는 문제 -> 수직 9x1 최대값 필터로 글자 줄을 무시하고
 *      실제 책등(접힌 골짜기 그림자 선)을 정확히 찾아 한 페이지 영역만 깔끔하게 분리!
 *   2) 책 하단이나 모서리에 그림자·그래프가 있을 때 사각형이 중간에서 잘리는 문제 ->
 *      9x9 종이 포락선(env) 위에서 국소 대비(4픽셀 전후 비율)로 상·하·좌·우 4개 변의 경계 점들을 찾고
 *      2단계 직선 회귀(Outlier-Rejected Line Fitting)의 교점으로 4개 모서리 [TL, TR, BR, BL]을 산출!
 * - 카메라 실시간 프리뷰와 [사진 자르기 -> 자동 인식] 버튼 모두에서 동일하게 작동.
 */
object DocumentQuadDetector {
    fun insetQuadSlightly(q: FloatArray, ratio: Float = 0.013f): FloatArray {
        if (q.size != 8) return q
        val cx = (q[0] + q[2] + q[4] + q[6]) * 0.25f
        val cy = (q[1] + q[3] + q[5] + q[7]) * 0.25f
        return FloatArray(8) { i ->
            val c = if (i % 2 == 0) cx else cy
            (q[i] + (c - q[i]) * ratio).coerceIn(0.01f, 0.99f)
        }
    }

    fun ensureValidOrderedQuad(q: FloatArray): FloatArray? {
        if (q.size != 8) return null
        val pts = listOf(
            q[0].coerceIn(0.01f, 0.99f) to q[1].coerceIn(0.01f, 0.99f),
            q[2].coerceIn(0.01f, 0.99f) to q[3].coerceIn(0.01f, 0.99f),
            q[4].coerceIn(0.01f, 0.99f) to q[5].coerceIn(0.01f, 0.99f),
            q[6].coerceIn(0.01f, 0.99f) to q[7].coerceIn(0.01f, 0.99f)
        )
        val byY = pts.sortedBy { it.second }
        val top2 = byY.take(2).sortedBy { it.first }
        val bot2 = byY.drop(2).sortedBy { it.first }
        val tl = top2[0]
        val tr = top2[1]
        val bl = bot2[0]
        val br = bot2[1]

        val topW = kotlin.math.hypot((tr.first - tl.first).toDouble(), (tr.second - tl.second).toDouble()).toFloat()
        val botW = kotlin.math.hypot((br.first - bl.first).toDouble(), (br.second - bl.second).toDouble()).toFloat()
        val leftH = kotlin.math.hypot((bl.first - tl.first).toDouble(), (bl.second - tl.second).toDouble()).toFloat()
        val rightH = kotlin.math.hypot((br.first - tr.first).toDouble(), (br.second - tr.second).toDouble()).toFloat()

        if (topW < 0.22f || botW < 0.22f || leftH < 0.22f || rightH < 0.22f) {
            return null
        }

        val ratioW = maxOf(topW, botW) / maxOf(0.01f, minOf(topW, botW))
        val ratioH = maxOf(leftH, rightH) / maxOf(0.01f, minOf(leftH, rightH))
        if (ratioW > 1.48f || ratioH > 1.48f) {
            return null
        }

        val ordered = arrayOf(tl, tr, br, bl)
        for (i in 0 until 4) {
            val a = ordered[i]
            val b = ordered[(i + 1) % 4]
            val c = ordered[(i + 2) % 4]
            val cross = (b.first - a.first) * (c.second - b.second) - (b.second - a.second) * (c.first - b.first)
            if (cross <= 0.008f) return null
        }

        return floatArrayOf(
            tl.first, tl.second,
            tr.first, tr.second,
            br.first, br.second,
            bl.first, bl.second
        )
    }

    fun detectQuadFromFile(path: String): FloatArray {
        val defaultQuad = floatArrayOf(0.08f, 0.08f, 0.92f, 0.08f, 0.92f, 0.92f, 0.08f, 0.92f)
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return defaultQuad
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 560) sample *= 2
        val bmp = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sample })
            ?: return defaultQuad
        try {
            return detectQuadFromBitmap(bmp)
        } finally {
            bmp.recycle()
        }
    }

    fun detectQuadFromBitmap(src: Bitmap): FloatArray {
        val defaultQuad = floatArrayOf(0.08f, 0.08f, 0.92f, 0.08f, 0.92f, 0.92f, 0.08f, 0.92f)
        val W = 200
        val H = maxOf(150, (src.height * W / maxOf(1, src.width)).coerceIn(150, 320))
        val small = if (src.width == W && src.height == H) src else Bitmap.createScaledBitmap(src, W, H, true)
        try {
            val total = W * H
            val px = IntArray(total)
            small.getPixels(px, 0, W, 0, 0, W, H)

            val lum = FloatArray(total)
            val score = FloatArray(total)
            for (i in 0 until total) {
                val c = px[i]
                val r = (c shr 16) and 0xFF
                val g = (c shr 8) and 0xFF
                val b = c and 0xFF
                val l = ((r * 77 + g * 150 + b * 29) shr 8).toFloat()
                val sat = (maxOf(r, maxOf(g, b)) - minOf(r, minOf(g, b))).toFloat()
                lum[i] = l
                score[i] = (l - sat * 0.65f).coerceIn(0f, 255f)
            }

            // 1. 9x9 최대값 필터(Max Filter) + 5x5 평균 필터로 글자·그래프·스프링 구멍의 영향을 제거한 순수 종이 포락선(env) 생성
            val maxH = FloatArray(total)
            for (y in 0 until H) {
                val row = y * W
                for (x in 0 until W) {
                    var m = 0f
                    val x0 = maxOf(0, x - 4)
                    val x1 = minOf(W - 1, x + 4)
                    for (xx in x0..x1) {
                        val v = score[row + xx]
                        if (v > m) m = v
                    }
                    maxH[row + x] = m
                }
            }
            val maxHV = FloatArray(total)
            for (y in 0 until H) {
                val y0 = maxOf(0, y - 4)
                val y1 = minOf(H - 1, y + 4)
                val row = y * W
                for (x in 0 until W) {
                    var m = 0f
                    for (yy in y0..y1) {
                        val v = maxH[yy * W + x]
                        if (v > m) m = v
                    }
                    maxHV[row + x] = m
                }
            }
            val env = FloatArray(total)
            for (y in 0 until H) {
                val y0 = maxOf(0, y - 2)
                val y1 = minOf(H - 1, y + 2)
                val row = y * W
                for (x in 0 until W) {
                    val x0 = maxOf(0, x - 2)
                    val x1 = minOf(W - 1, x + 2)
                    var s = 0f
                    var cnt = 0
                    for (yy in y0..y1) {
                        val r = yy * W
                        for (xx in x0..x1) {
                            s += maxHV[r + xx]
                            cnt++
                        }
                    }
                    env[row + x] = s / maxOf(1, cnt)
                }
            }

            // 화면 중앙(0.30~0.70) 종이 포락선의 상위 75% 값 산출
            val centerSamples = ArrayList<Float>()
            for (y in (H * 30 / 100)..(H * 70 / 100) step 2) {
                val row = y * W
                for (x in (W * 30 / 100)..(W * 65 / 100) step 2) {
                    centerSamples.add(env[row + x])
                }
            }
            if (centerSamples.isEmpty()) return defaultQuad
            centerSamples.sort()
            val centerVal = centerSamples[(centerSamples.size * 75 / 100).coerceIn(0, centerSamples.size - 1)]
            if (centerVal < 95f) return defaultQuad

            // 2. 중앙에서 좌·우·상·하 4방향으로 스캔하며 국소 밝기 급감(종이 끝) 지점 수집
            val leftPts = ArrayList<Pair<Float, Float>>()
            val startXL = (W * 0.42f).toInt()
            for (y in (H * 16 / 100)..(H * 84 / 100) step 3) {
                val row = y * W
                if (env[row + startXL] < centerVal * 0.52f) continue
                for (x in startXL downTo 4) {
                    val cur = env[row + x]
                    val ahead = env[row + maxOf(0, x - 4)]
                    if (ahead < cur * 0.74f || ahead < centerVal * 0.48f) {
                        leftPts.add((x - 1).toFloat() to y.toFloat())
                        break
                    }
                }
            }

            val rightPts = ArrayList<Pair<Float, Float>>()
            val startXR = (W * 0.46f).toInt()
            for (y in (H * 16 / 100)..(H * 84 / 100) step 3) {
                val row = y * W
                if (env[row + startXR] < centerVal * 0.52f) continue
                for (x in startXR until (W - 4)) {
                    val cur = env[row + x]
                    val ahead = env[row + minOf(W - 1, x + 4)]
                    if (ahead < cur * 0.74f || ahead < centerVal * 0.52f) {
                        rightPts.add((x + 1).toFloat() to y.toFloat())
                        break
                    }
                }
            }

            // 펼친 책 척추선(Book Spine Crease) 감지:
            // 우측 또는 좌측으로 반대쪽 페이지가 이어져 외곽 경계가 안 잡힌 경우(pts < 8),
            // 수직 9x1 최대값 필터(가로 글자 줄은 지우고 세로 책등 골짜기 그림자는 보존)로 책등 경계선 추출!
            if (rightPts.size < 8 || leftPts.size < 8) {
                val envVert = FloatArray(total)
                for (y in 0 until H) {
                    val y0 = maxOf(0, y - 4)
                    val y1 = minOf(H - 1, y + 4)
                    val row = y * W
                    for (x in 0 until W) {
                        var m = 0f
                        for (yy in y0..y1) {
                            val v = lum[yy * W + x]
                            if (v > m) m = v
                        }
                        envVert[row + x] = m
                    }
                }
                if (rightPts.size < 8) {
                    rightPts.clear()
                    val xMin = (W * 0.70f).toInt()
                    val xMax = (W * 0.93f).toInt()
                    for (y in (H * 14 / 100)..(H * 84 / 100) step 3) {
                        val row = y * W
                        var bestX = (W * 0.84f).toInt()
                        var bestDrop = -999f
                        for (x in xMin..xMax) {
                            val drop = envVert[row + maxOf(0, x - 4)] - envVert[row + minOf(W - 1, x + 1)]
                            if (drop > bestDrop) {
                                bestDrop = drop
                                bestX = x
                            }
                        }
                        rightPts.add(bestX.toFloat() to y.toFloat())
                    }
                }
                if (leftPts.size < 8) {
                    leftPts.clear()
                    val xMin = (W * 0.07f).toInt()
                    val xMax = (W * 0.30f).toInt()
                    for (y in (H * 14 / 100)..(H * 84 / 100) step 3) {
                        val row = y * W
                        var bestX = (W * 0.16f).toInt()
                        var bestDrop = -999f
                        for (x in xMin..xMax) {
                            val drop = envVert[row + minOf(W - 1, x + 4)] - envVert[row + maxOf(0, x - 1)]
                            if (drop > bestDrop) {
                                bestDrop = drop
                                bestX = x
                            }
                        }
                        leftPts.add(bestX.toFloat() to y.toFloat())
                    }
                }
            }

            val topPts = ArrayList<Pair<Float, Float>>()
            val startYT = (H * 0.45f).toInt()
            for (x in (W * 20 / 100)..(W * 74 / 100) step 3) {
                if (env[startYT * W + x] < centerVal * 0.52f) continue
                var hit = false
                for (y in startYT downTo 4) {
                    val cur = env[y * W + x]
                    val ahead = env[maxOf(0, y - 4) * W + x]
                    if (ahead < cur * 0.74f || ahead < centerVal * 0.48f) {
                        topPts.add(x.toFloat() to (y - 1).toFloat())
                        hit = true
                        break
                    }
                }
                if (!hit) topPts.add(x.toFloat() to (H * 0.05f))
            }

            val botPts = ArrayList<Pair<Float, Float>>()
            val startYB = (H * 0.50f).toInt()
            for (x in (W * 18 / 100)..(W * 74 / 100) step 3) {
                if (env[startYB * W + x] < centerVal * 0.52f) continue
                var hit = false
                for (y in startYB until (H - 4)) {
                    val cur = env[y * W + x]
                    val ahead = env[minOf(H - 1, y + 4) * W + x]
                    if (ahead < cur * 0.75f || ahead < centerVal * 0.45f) {
                        botPts.add(x.toFloat() to (y + 1).toFloat())
                        hit = true
                        break
                    }
                }
                if (!hit) botPts.add(x.toFloat() to (H * 0.94f))
            }

            // 3. 2단계 이상치 제거 선형 회귀(Outlier-Rejected Line Fitting)로 4개 변의 직선 방정식 산출
            //    (손가락이 종이 가장자리를 잡고 있어도 손가락 점들은 이상치로 걸러져 곧은 종이 테두리 직선을 유지함!)
            fun fitLineLinear(indep: FloatArray, dep: FloatArray, defaultIntercept: Float): Pair<Float, Float> {
                val n = indep.size
                if (n < 3) return 0f to defaultIntercept
                var sx = 0.0; var sy = 0.0; var sxx = 0.0; var sxy = 0.0
                for (i in 0 until n) {
                    val u = indep[i].toDouble()
                    val v = dep[i].toDouble()
                    sx += u; sy += v; sxx += u * u; sxy += u * v
                }
                val denom = n * sxx - sx * sx
                if (kotlin.math.abs(denom) < 1e-5) return 0f to (sy / n).toFloat()
                var a = ((n * sxy - sx * sy) / denom).toFloat()
                var b = ((sy - a * sx) / n).toFloat()

                // 잔차 상위 30% 이상치(손가락, 부분 그림자 등) 제거 후 2차 정밀 피팅
                val residuals = FloatArray(n) { i -> kotlin.math.abs(dep[i] - (a * indep[i] + b)) }
                val sortedRes = residuals.clone().also { it.sort() }
                val cutoff = maxOf(3.0f, sortedRes[(n * 70 / 100).coerceIn(0, n - 1)])

                var sx2 = 0.0; var sy2 = 0.0; var sxx2 = 0.0; var sxy2 = 0.0; var cnt = 0
                for (i in 0 until n) {
                    if (residuals[i] <= cutoff) {
                        val u = indep[i].toDouble()
                        val v = dep[i].toDouble()
                        sx2 += u; sy2 += v; sxx2 += u * u; sxy2 += u * v
                        cnt++
                    }
                }
                if (cnt >= 3) {
                    val d2 = cnt * sxx2 - sx2 * sx2
                    if (kotlin.math.abs(d2) > 1e-5) {
                        a = ((cnt * sxy2 - sx2 * sy2) / d2).toFloat()
                        b = ((sy2 - a * sx2) / cnt).toFloat()
                    }
                }
                return a.coerceIn(-0.45f, 0.45f) to b
            }

            // 좌·우 변: x = a * y + b
            val (al, bl) = fitLineLinear(
                FloatArray(leftPts.size) { leftPts[it].second },
                FloatArray(leftPts.size) { leftPts[it].first },
                W * 0.08f
            )
            val (ar, br) = fitLineLinear(
                FloatArray(rightPts.size) { rightPts[it].second },
                FloatArray(rightPts.size) { rightPts[it].first },
                W * 0.92f
            )
            // 상·하 변: y = c * x + d
            val (ct, dt) = fitLineLinear(
                FloatArray(topPts.size) { topPts[it].first },
                FloatArray(topPts.size) { topPts[it].second },
                H * 0.08f
            )
            val (cb, db) = fitLineLinear(
                FloatArray(botPts.size) { botPts[it].first },
                FloatArray(botPts.size) { botPts[it].second },
                H * 0.92f
            )

            fun intersectLines(a: Float, b: Float, c: Float, d: Float): Pair<Float, Float> {
                val denom = 1f - a * c
                val safeDenom = if (kotlin.math.abs(denom) < 1e-4f) 1e-4f else denom
                val x = (a * d + b) / safeDenom
                val y = c * x + d
                return (x / W).coerceIn(0.02f, 0.98f) to (y / H).coerceIn(0.02f, 0.98f)
            }

            val tl = intersectLines(al, bl, ct, dt)
            val tr = intersectLines(ar, br, ct, dt)
            val brPt = intersectLines(ar, br, cb, db)
            val blPt = intersectLines(al, bl, cb, db)

            val rawCandidate = floatArrayOf(
                tl.first, tl.second,
                tr.first, tr.second,
                brPt.first, brPt.second,
                blPt.first, blPt.second
            )
            return ensureValidOrderedQuad(rawCandidate)?.let { insetQuadSlightly(it, 0.013f) } ?: defaultQuad
        } finally {
            if (small !== src) small.recycle()
        }
    }
}

/**
 * 인앱 무음 문서 스캔 카메라 화면 (v105):
 * - 첫 실행 시 카메라 프리뷰가 하얗게 멈추는 현상 완벽 해결:
 *   1) onCreate에서 백그라운드 스레드 즉시 초기화
 *   2) 모든 기기 GPU SurfaceTexture가 100% 지원하는 1920x1440 / 1920x1080 규격 사용 및 레이아웃 재할당 충돌 제거
 *   3) 650ms 첫 프레임 워치독(Watchdog) 및 권한 허용 직후 자동 재시도 로직 탑재
 */
class DocumentCameraActivity : android.app.Activity(), android.view.TextureView.SurfaceTextureListener {
    private lateinit var cameraFrame: android.widget.FrameLayout
    private lateinit var textureView: android.view.TextureView
    private lateinit var overlayView: DocumentQuadOverlayView
    private lateinit var flashIconView: android.widget.ImageView
    private lateinit var singleTabBtn: android.widget.TextView
    private lateinit var batchTabBtn: android.widget.TextView
    private lateinit var thumbBadgeView: android.widget.TextView
    private lateinit var thumbImageView: android.widget.ImageView
    private lateinit var thumbContainer: android.widget.FrameLayout
    private lateinit var confirmBatchBtn: android.widget.TextView
    private var placeholderIconBmp: Bitmap? = null
    private val flashIconCache = HashMap<Int, Bitmap>()

    private var cameraDevice: android.hardware.camera2.CameraDevice? = null
    private var captureSession: android.hardware.camera2.CameraCaptureSession? = null
    private var previewRequestBuilder: android.hardware.camera2.CaptureRequest.Builder? = null
    private var bgThread: android.os.HandlerThread? = null
    private var bgHandler: Handler? = null
    private val uiHandler = Handler(Looper.getMainLooper())

    private var batchMode = false
    private var colorEnhance = true
    private var eraseFingers = true
    private var flattenQuad = true
    private var isCapturing = false
    private var isAnalyzing = false
    @Volatile
    private var isOpeningCamera = false
    @Volatile
    private var hasReceivedFrame = false

    // 플래시 모드: 0 = 끄기(OFF), 1 = 오토(AUTO), 2 = 켜기(ON)
    private var flashMode = 0
    private var hasFlashUnit = true
    @Volatile
    private var lastAmbientLum = 160f

    private val capturedPaths = ArrayList<String>()
    private val capturedQuads = ArrayList<String>()
    private var currentQuad = floatArrayOf(0.14f, 0.12f, 0.86f, 0.12f, 0.86f, 0.88f, 0.14f, 0.88f)
    private var previewSize = android.util.Size(1920, 1440)

    companion object {
        private const val REQ_CAM_PERM = 9102
        private val TEAL_COLOR = Color.parseColor("#76D632")
    }

    private fun dp(v: Float): Int = (v * resources.displayMetrics.density).toInt()

    private fun getSystemNavBarSafeInset(): Int {
        var navPx = 0
        try {
            val resId = resources.getIdentifier("navigation_bar_height", "dimen", "android")
            if (resId > 0) {
                navPx = resources.getDimensionPixelSize(resId)
            }
        } catch (_: Throwable) {}
        return maxOf(navPx, dp(52f))
    }

    /**
     * 플래시 모드별 깔끔한 벡터 아이콘 비트맵 생성 (0: 끄기, 1: 오토, 2: 켜기)
     */
    private fun getFlashIconBitmap(mode: Int): Bitmap {
        flashIconCache[mode]?.let { if (!it.isRecycled) return it }
        val s = dp(22f).coerceAtLeast(44)
        val bmp = Bitmap.createBitmap(s, s, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val p = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#1E2228")
            style = Paint.Style.FILL
        }

        // 번개 모양 경로
        val bolt = Path().apply {
            moveTo(s * 0.56f, s * 0.10f)
            lineTo(s * 0.24f, s * 0.54f)
            lineTo(s * 0.46f, s * 0.54f)
            lineTo(s * 0.38f, s * 0.90f)
            lineTo(s * 0.74f, s * 0.44f)
            lineTo(s * 0.52f, s * 0.44f)
            close()
        }
        if (mode == 0) {
            p.alpha = 150
        }
        canvas.drawPath(bolt, p)

        // 0(끄기): 대각선 사선 표시
        if (mode == 0) {
            val slashPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.parseColor("#1E2228")
                style = Paint.Style.STROKE
                strokeWidth = s * 0.085f
                strokeCap = Paint.Cap.ROUND
            }
            canvas.drawLine(s * 0.18f, s * 0.18f, s * 0.82f, s * 0.82f, slashPaint)
        } else if (mode == 1) {
            // 1(오토): 우하단에 작은 'A' 표시
            val aPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.parseColor("#1E2228")
                textSize = s * 0.36f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                textAlign = Paint.Align.CENTER
            }
            canvas.drawText("A", s * 0.80f, s * 0.88f, aPaint)
        }

        flashIconCache[mode] = bmp
        return bmp
    }

    /**
     * 셔터 버튼 왼쪽에 찍은 이미지가 없을 때 표시할 깔끔한 '이미지(갤러리 사진) 아이콘' 비트맵 생성
     */
    private fun getOrCreatePlaceholderIcon(): Bitmap {
        placeholderIconBmp?.let { if (!it.isRecycled) return it }
        val size = dp(52f).coerceAtLeast(96)
        val bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val p = Paint(Paint.ANTI_ALIAS_FLAG)

        p.style = Paint.Style.FILL
        p.color = Color.parseColor("#F0F2F5")
        canvas.drawRect(0f, 0f, size.toFloat(), size.toFloat(), p)

        val pad = size * 0.24f
        val rect = RectF(pad, pad + size * 0.03f, size - pad, size - pad - size * 0.03f)
        p.style = Paint.Style.STROKE
        p.strokeWidth = size * 0.055f
        p.strokeJoin = Paint.Join.ROUND
        p.strokeCap = Paint.Cap.ROUND
        p.color = Color.parseColor("#4B5563")
        canvas.drawRoundRect(rect, size * 0.07f, size * 0.07f, p)

        p.style = Paint.Style.FILL
        canvas.drawCircle(
            rect.left + rect.width() * 0.30f,
            rect.top + rect.height() * 0.33f,
            size * 0.048f,
            p
        )

        p.style = Paint.Style.STROKE
        p.strokeWidth = size * 0.05f
        val mPath = Path().apply {
            moveTo(rect.left + rect.width() * 0.12f, rect.bottom - rect.height() * 0.16f)
            lineTo(rect.left + rect.width() * 0.42f, rect.top + rect.height() * 0.52f)
            lineTo(rect.left + rect.width() * 0.62f, rect.top + rect.height() * 0.70f)
            lineTo(rect.left + rect.width() * 0.76f, rect.top + rect.height() * 0.56f)
            lineTo(rect.right - rect.width() * 0.10f, rect.bottom - rect.height() * 0.16f)
        }
        canvas.drawPath(mPath, p)

        placeholderIconBmp = bmp
        return bmp
    }

    private fun hideSystemBarsImmersive() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                window.setDecorFitsSystemWindows(false)
                window.insetsController?.let { controller ->
                    controller.systemBarsBehavior =
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                }
            } else {
                @Suppress("DEPRECATION")
                window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        or View.SYSTEM_UI_FLAG_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
            }
        } catch (_: Throwable) {}
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or WindowManager.LayoutParams.FLAG_FULLSCREEN)
        OpenCvScanEngine.ensureInitialized()
        startBackgroundThread()

        batchMode = intent.getBooleanExtra("batchMode", false)
        colorEnhance = intent.getBooleanExtra("colorEnhance", true)
        eraseFingers = intent.getBooleanExtra("eraseFingers", true)
        flattenQuad = intent.getBooleanExtra("flattenQuad", true)

        buildCameraLayout()
        hideSystemBarsImmersive()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemBarsImmersive()
            if (textureView.isAvailable && cameraDevice == null && !isOpeningCamera) {
                checkPermAndOpenCamera()
            }
        }
    }

    private fun buildCameraLayout() {
        val navBarSafeBottom = getSystemNavBarSafeInset()
        val bottomPanelHeight = dp(142f)

        val root = android.widget.FrameLayout(this).apply {
            setBackgroundColor(Color.WHITE)
        }

        cameraFrame = android.widget.FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
        }
        textureView = android.view.TextureView(this).apply {
            surfaceTextureListener = this@DocumentCameraActivity
            setOnClickListener { triggerAutoFocusPulse() }
        }
        overlayView = DocumentQuadOverlayView(this)
        cameraFrame.addView(
            textureView,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        cameraFrame.addView(
            overlayView,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        val cameraFrameLp = android.widget.FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ).apply {
            topMargin = dp(52f)
            bottomMargin = bottomPanelHeight + navBarSafeBottom
        }
        root.addView(cameraFrame, cameraFrameLp)

        // 상단 컨트롤 바 (좌측 ✕ 닫기 버튼 + 우측 플래시 [끄기 / 오토 / 켜기] 전환 버튼)
        val topBar = android.widget.RelativeLayout(this).apply {
            setBackgroundColor(Color.WHITE)
            setPadding(dp(12f), dp(6f), dp(14f), dp(6f))
        }

        val closeBtn = android.widget.TextView(this).apply {
            text = "✕"
            setTextColor(Color.parseColor("#1E2228"))
            textSize = 21f
            setPadding(dp(12f), dp(4f), dp(12f), dp(4f))
            setOnClickListener { finishWithResult(cancelled = capturedPaths.isEmpty()) }
        }
        topBar.addView(
            closeBtn,
            android.widget.RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT)
                addRule(android.widget.RelativeLayout.CENTER_VERTICAL)
            }
        )

        val flashBtnContainer = android.widget.FrameLayout(this).apply {
            setPadding(dp(10f), dp(8f), dp(10f), dp(8f))
            setOnClickListener {
                flashMode = (flashMode + 1) % 3
                updateFlashUiAndHardware()
            }
        }
        flashIconView = android.widget.ImageView(this).apply {
            setImageBitmap(getFlashIconBitmap(flashMode))
        }
        flashBtnContainer.addView(
            flashIconView,
            android.widget.FrameLayout.LayoutParams(dp(24f), dp(24f), android.view.Gravity.CENTER)
        )

        topBar.addView(
            flashBtnContainer,
            android.widget.RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT)
                addRule(android.widget.RelativeLayout.CENTER_VERTICAL)
            }
        )

        root.addView(
            topBar,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(52f),
                android.view.Gravity.TOP
            )
        )

        // [ 단일 | 배치 ] 전환 캡슐
        val modePill = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#B322262C"))
                cornerRadius = dp(20f).toFloat()
            }
            setPadding(dp(4f), dp(4f), dp(4f), dp(4f))
        }

        singleTabBtn = android.widget.TextView(this).apply {
            text = "단일"
            textSize = 13.5f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(16f), dp(6f), dp(16f), dp(6f))
            setOnClickListener {
                batchMode = false
                updateBatchTabs()
            }
        }
        batchTabBtn = android.widget.TextView(this).apply {
            text = "배치"
            textSize = 13.5f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(16f), dp(6f), dp(16f), dp(6f))
            setOnClickListener {
                batchMode = true
                updateBatchTabs()
            }
        }
        modePill.addView(singleTabBtn)
        modePill.addView(batchTabBtn)
        updateBatchTabs()

        val modePillLp = android.widget.FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            android.view.Gravity.BOTTOM or android.view.Gravity.CENTER_HORIZONTAL
        ).apply {
            bottomMargin = bottomPanelHeight + navBarSafeBottom + dp(12f)
        }
        root.addView(modePill, modePillLp)

        // 하단 촬영 바 (흰색 배경 + 검정 글씨, 왼쪽에는 찍은 이미지 또는 기본 이미지 아이콘)
        val bottomPanel = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
            gravity = android.view.Gravity.CENTER
            setPadding(0, dp(6f), 0, dp(12f))
        }

        val modeLabel = android.widget.TextView(this).apply {
            text = "스캔"
            setTextColor(Color.parseColor("#1E2228"))
            textSize = 13.5f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, dp(8f))
        }
        bottomPanel.addView(modeLabel)

        // 3등분(1:1:1) 수평 레이아웃을 사용하여:
        // - 셔터 버튼은 화면 정중앙에 배치
        // - 왼쪽 이미지 아이콘/썸네일은 [화면 왼쪽 끝 ~ 셔터 버튼]의 정중앙에 배치!
        val actionRow = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
            weightSum = 3f
        }

        val leftZone = android.widget.FrameLayout(this)
        thumbContainer = android.widget.FrameLayout(this).apply {
            visibility = View.VISIBLE
            setOnClickListener {
                if (capturedPaths.isNotEmpty()) {
                    finishWithResult(cancelled = false)
                }
            }
        }
        thumbImageView = android.widget.ImageView(this).apply {
            scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#F0F2F5"))
                cornerRadius = dp(10f).toFloat()
                setStroke(dp(1.5f), Color.parseColor("#D0D5DD"))
            }
            clipToOutline = true
            outlineProvider = object : android.view.ViewOutlineProvider() {
                override fun getOutline(view: View, outline: android.graphics.Outline) {
                    outline.setRoundRect(0, 0, view.width, view.height, dp(10f).toFloat())
                }
            }
            setImageBitmap(getOrCreatePlaceholderIcon())
        }
        thumbContainer.addView(
            thumbImageView,
            android.widget.FrameLayout.LayoutParams(dp(52f), dp(52f), android.view.Gravity.CENTER)
        )
        thumbBadgeView = android.widget.TextView(this).apply {
            text = "0"
            visibility = View.GONE
            setTextColor(Color.WHITE)
            textSize = 11.5f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
            setPadding(dp(6f), dp(2f), dp(6f), dp(2f))
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(TEAL_COLOR)
                cornerRadius = dp(12f).toFloat()
            }
        }
        thumbContainer.addView(
            thumbBadgeView,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                android.view.Gravity.TOP or android.view.Gravity.END
            )
        )
        leftZone.addView(
            thumbContainer,
            android.widget.FrameLayout.LayoutParams(dp(64f), dp(64f), android.view.Gravity.CENTER)
        )
        actionRow.addView(
            leftZone,
            android.widget.LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)
        )

        val centerZone = android.widget.FrameLayout(this)
        val shutterOuter = android.widget.FrameLayout(this).apply {
            background = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.OVAL
                setColor(Color.TRANSPARENT)
                setStroke(dp(4.5f), TEAL_COLOR)
            }
            setOnClickListener { captureFrameSilently() }
        }
        val shutterInner = View(this).apply {
            background = android.graphics.drawable.GradientDrawable().apply {
                shape = android.graphics.drawable.GradientDrawable.OVAL
                setColor(Color.WHITE)
                setStroke(dp(1.5f), Color.parseColor("#D0D5DD"))
            }
        }
        shutterOuter.addView(
            shutterInner,
            android.widget.FrameLayout.LayoutParams(dp(56f), dp(56f), android.view.Gravity.CENTER)
        )
        centerZone.addView(
            shutterOuter,
            android.widget.FrameLayout.LayoutParams(dp(72f), dp(72f), android.view.Gravity.CENTER)
        )
        actionRow.addView(
            centerZone,
            android.widget.LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)
        )

        val rightZone = android.widget.FrameLayout(this)
        confirmBatchBtn = android.widget.TextView(this).apply {
            text = ""
            visibility = View.GONE
            setTextColor(Color.parseColor("#1E2228"))
            textSize = 12.5f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
            setPadding(dp(14f), dp(10f), dp(14f), dp(10f))
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(TEAL_COLOR)
                cornerRadius = dp(18f).toFloat()
            }
            setOnClickListener {
                if (capturedPaths.isNotEmpty()) {
                    finishWithResult(cancelled = false)
                }
            }
        }
        rightZone.addView(
            confirmBatchBtn,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                android.view.Gravity.CENTER
            )
        )
        actionRow.addView(
            rightZone,
            android.widget.LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f)
        )

        bottomPanel.addView(
            actionRow,
            android.widget.LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(80f)
            )
        )

        val bottomPanelLp = android.widget.FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            bottomPanelHeight,
            android.view.Gravity.BOTTOM
        ).apply {
            bottomMargin = navBarSafeBottom
        }
        root.addView(bottomPanel, bottomPanelLp)

        root.setOnApplyWindowInsetsListener { v, insets ->
            val sysBot = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                insets.getInsetsIgnoringVisibility(WindowInsets.Type.navigationBars()).bottom
            } else {
                @Suppress("DEPRECATION")
                insets.systemWindowInsetBottom
            }
            val safeBot = maxOf(navBarSafeBottom, sysBot + dp(8f))
            bottomPanelLp.bottomMargin = safeBot
            modePillLp.bottomMargin = bottomPanelHeight + safeBot + dp(12f)
            cameraFrameLp.bottomMargin = bottomPanelHeight + safeBot
            root.requestLayout()
            v.onApplyWindowInsets(insets)
        }

        setContentView(root)
    }

    private fun updateFlashUiAndHardware() {
        flashIconView.setImageBitmap(getFlashIconBitmap(flashMode))
        applyFlashModeToSession(forceTorchForAutoCapture = false)
    }

    private fun applyFlashModeToSession(forceTorchForAutoCapture: Boolean) {
        if (!hasFlashUnit) return
        try {
            val session = captureSession ?: return
            val builder = previewRequestBuilder ?: return
            builder.set(
                android.hardware.camera2.CaptureRequest.CONTROL_AE_MODE,
                android.hardware.camera2.CameraMetadata.CONTROL_AE_MODE_ON
            )
            val torchOn = (flashMode == 2) || (flashMode == 1 && forceTorchForAutoCapture)
            builder.set(
                android.hardware.camera2.CaptureRequest.FLASH_MODE,
                if (torchOn) android.hardware.camera2.CameraMetadata.FLASH_MODE_TORCH
                else android.hardware.camera2.CameraMetadata.FLASH_MODE_OFF
            )
            session.setRepeatingRequest(builder.build(), null, bgHandler)
        } catch (_: Throwable) {}
    }

    private fun updateBatchTabs() {
        val activeBg = android.graphics.drawable.GradientDrawable().apply {
            setColor(Color.parseColor("#556070"))
            cornerRadius = dp(16f).toFloat()
        }
        singleTabBtn.background = if (!batchMode) activeBg else null
        singleTabBtn.setTextColor(if (!batchMode) Color.WHITE else Color.LTGRAY)
        batchTabBtn.background = if (batchMode) activeBg else null
        batchTabBtn.setTextColor(if (batchMode) Color.WHITE else Color.LTGRAY)
    }

    private fun updateBottomCaptureState(latestBmp: Bitmap?) {
        thumbContainer.visibility = View.VISIBLE
        if (capturedPaths.isEmpty()) {
            thumbBadgeView.visibility = View.GONE
            thumbImageView.setImageBitmap(getOrCreatePlaceholderIcon())
            confirmBatchBtn.visibility = View.GONE
        } else {
            thumbBadgeView.visibility = View.VISIBLE
            thumbBadgeView.text = "${capturedPaths.size}"
            if (latestBmp != null) {
                thumbImageView.setImageBitmap(latestBmp)
            }
            confirmBatchBtn.visibility = View.VISIBLE
            confirmBatchBtn.text = "확인 (${capturedPaths.size}장) ✓"
            confirmBatchBtn.setTextColor(Color.parseColor("#1E2228"))
            confirmBatchBtn.background = android.graphics.drawable.GradientDrawable().apply {
                setColor(TEAL_COLOR)
                cornerRadius = dp(18f).toFloat()
            }
        }
    }

    private fun triggerAutoFocusPulse() {
        try {
            val session = captureSession ?: return
            val builder = previewRequestBuilder ?: return
            builder.set(
                android.hardware.camera2.CaptureRequest.CONTROL_AF_TRIGGER,
                android.hardware.camera2.CameraMetadata.CONTROL_AF_TRIGGER_START
            )
            session.capture(builder.build(), null, bgHandler)
            builder.set(
                android.hardware.camera2.CaptureRequest.CONTROL_AF_TRIGGER,
                android.hardware.camera2.CameraMetadata.CONTROL_AF_TRIGGER_IDLE
            )
            session.setRepeatingRequest(builder.build(), null, bgHandler)
        } catch (_: Throwable) {}
    }

    private fun captureFrameSilently() {
        if (isCapturing || !textureView.isAvailable) return
        isCapturing = true

        // 오토(AUTO) 모드인데 주변 밝기가 어두울 때(lastAmbientLum < 105)는 플래시 조명을 잠깐 켜고 노출 수렴 후 촬영!
        val needAutoTorch = hasFlashUnit && (flashMode == 1) && (lastAmbientLum < 105f)
        if (needAutoTorch) {
            applyFlashModeToSession(forceTorchForAutoCapture = true)
            uiHandler.postDelayed({
                performBitmapCapture(turnOffAutoTorchAfter = true)
            }, 320L)
        } else {
            performBitmapCapture(turnOffAutoTorchAfter = false)
        }
    }

    private fun performBitmapCapture(turnOffAutoTorchAfter: Boolean) {
        if (!textureView.isAvailable) {
            if (turnOffAutoTorchAfter) applyFlashModeToSession(forceTorchForAutoCapture = false)
            isCapturing = false
            return
        }
        val bufW = minOf(previewSize.width, previewSize.height).coerceAtLeast(1080)
        val bufH = maxOf(previewSize.width, previewSize.height).coerceAtLeast(1440)
        val capW = maxOf(bufW, 2160)
        val capH = ((capW.toLong() * bufH) / maxOf(1, bufW)).toInt().coerceIn(2400, 3400)

        val rawBmp = try {
            textureView.getBitmap(capW, capH) ?: textureView.bitmap
        } catch (_: Throwable) {
            textureView.bitmap
        }

        if (turnOffAutoTorchAfter) {
            applyFlashModeToSession(forceTorchForAutoCapture = false)
        }

        if (rawBmp == null) {
            isCapturing = false
            return
        }

        overlayView.triggerCaptureFlash()
        val quadSnapshot = currentQuad.clone()

        bgHandler?.post {
            try {
                val scanDir = File(cacheDir, "scan_photos")
                if (!scanDir.exists()) scanDir.mkdirs()
                val outFile = File(scanDir, "raw_${System.currentTimeMillis()}.jpg")
                FileOutputStream(outFile).use { out ->
                    rawBmp.compress(Bitmap.CompressFormat.JPEG, 98, out)
                }

                val refinedQuad = if (flattenQuad) {
                    DocumentQuadDetector.detectQuadFromBitmap(rawBmp)
                } else {
                    floatArrayOf(0f, 0f, 1f, 0f, 1f, 1f, 0f, 1f)
                }

                val finalQuad = DocumentQuadDetector.ensureValidOrderedQuad(refinedQuad)
                    ?: DocumentQuadDetector.ensureValidOrderedQuad(quadSnapshot)
                    ?: floatArrayOf(0f, 0f, 1f, 0f, 1f, 1f, 0f, 1f)

                val croppedThumbSource = try {
                    val sw = rawBmp.width.toFloat()
                    val sh = rawBmp.height.toFloat()
                    val srcPts = floatArrayOf(
                        finalQuad[0] * sw, finalQuad[1] * sh,
                        finalQuad[2] * sw, finalQuad[3] * sh,
                        finalQuad[4] * sw, finalQuad[5] * sh,
                        finalQuad[6] * sw, finalQuad[7] * sh
                    )
                    OpenCvScanEngine.warpPerspectiveCubic(rawBmp, srcPts, 140, 186)
                } catch (_: Throwable) {
                    null
                }
                val thumbBmp = croppedThumbSource ?: Bitmap.createScaledBitmap(rawBmp, 140, 186, true)
                rawBmp.recycle()

                val qString = finalQuad.joinToString(",") { String.format(java.util.Locale.US, "%.4f", it) }

                uiHandler.post {
                    capturedPaths.add(outFile.absolutePath)
                    capturedQuads.add(qString)
                    updateBottomCaptureState(thumbBmp)
                    isCapturing = false
                    if (!batchMode) {
                        finishWithResult(cancelled = false)
                    }
                }
            } catch (_: Throwable) {
                uiHandler.post { isCapturing = false }
            }
        }
    }

    private fun finishWithResult(cancelled: Boolean, pickGallery: Boolean = false) {
        if (cancelled && !pickGallery) {
            setResult(RESULT_CANCELED)
            finish()
            return
        }
        val data = android.content.Intent().apply {
            putStringArrayListExtra("paths", capturedPaths)
            putStringArrayListExtra("quads", capturedQuads)
            putExtra("pickGallery", pickGallery)
            putExtra("shutterSound", false)
            putExtra("colorEnhance", colorEnhance)
            putExtra("eraseFingers", eraseFingers)
            putExtra("flattenQuad", flattenQuad)
        }
        setResult(RESULT_OK, data)
        finish()
    }

    override fun onResume() {
        super.onResume()
        hideSystemBarsImmersive()
        startBackgroundThread()
        if (textureView.isAvailable) {
            checkPermAndOpenCamera()
        } else {
            textureView.surfaceTextureListener = this
        }
        scheduleCameraWatchdog(600L)
        scheduleCameraWatchdog(1400L)
    }

    private fun scheduleCameraWatchdog(delayMs: Long) {
        uiHandler.postDelayed({
            if (!isFinishing && !isDestroyed && textureView.isAvailable) {
                if (cameraDevice == null && !isOpeningCamera) {
                    checkPermAndOpenCamera()
                } else if (!hasReceivedFrame && cameraDevice != null) {
                    createCameraPreviewSession()
                }
            }
        }, delayMs)
    }

    override fun onPause() {
        uiHandler.removeCallbacksAndMessages(null)
        closeCamera()
        stopBackgroundThread()
        super.onPause()
    }

    private fun startBackgroundThread() {
        if (bgThread != null && bgHandler != null) return
        bgThread = android.os.HandlerThread("FReaderScanCam").also { it.start() }
        bgHandler = Handler(bgThread!!.looper)
    }

    private fun stopBackgroundThread() {
        bgThread?.quitSafely()
        try {
            bgThread?.join()
            bgThread = null
            bgHandler = null
        } catch (_: Throwable) {}
    }

    private fun checkPermAndOpenCamera() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            checkSelfPermission(android.Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(android.Manifest.permission.CAMERA), REQ_CAM_PERM)
            return
        }
        openCamera()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_CAM_PERM) {
            if (grantResults.isNotEmpty() && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                uiHandler.postDelayed({
                    if (!isFinishing && textureView.isAvailable) {
                        openCamera()
                    }
                }, 120L)
                scheduleCameraWatchdog(750L)
            } else {
                android.widget.Toast.makeText(this, "문서 스캔을 위해 카메라 권한이 필요합니다.", android.widget.Toast.LENGTH_SHORT).show()
                finishWithResult(cancelled = true)
            }
        }
    }

    @android.annotation.SuppressLint("MissingPermission")
    private fun openCamera() {
        if (cameraDevice != null || isOpeningCamera) return
        startBackgroundThread()
        try {
            val manager = getSystemService(Context.CAMERA_SERVICE) as android.hardware.camera2.CameraManager
            var camId: String? = null
            for (id in manager.cameraIdList) {
                val chars = manager.getCameraCharacteristics(id)
                val facing = chars.get(android.hardware.camera2.CameraCharacteristics.LENS_FACING)
                if (facing == android.hardware.camera2.CameraCharacteristics.LENS_FACING_BACK) {
                    camId = id
                    hasFlashUnit = chars.get(android.hardware.camera2.CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
                    val map = chars.get(android.hardware.camera2.CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
                    val prevSizes = map?.getOutputSizes(android.graphics.SurfaceTexture::class.java)
                    if (!prevSizes.isNullOrEmpty()) {
                        previewSize = prevSizes
                            .filter { maxOf(it.width, it.height) in 1280..1920 }
                            .maxByOrNull { it.width * it.height }
                            ?: prevSizes.filter { maxOf(it.width, it.height) <= 2560 }.maxByOrNull { it.width * it.height }
                            ?: prevSizes[0]
                    }
                    break
                }
            }
            if (camId == null && manager.cameraIdList.isNotEmpty()) {
                camId = manager.cameraIdList[0]
            }
            if (camId == null) return

            isOpeningCamera = true
            hasReceivedFrame = false
            manager.openCamera(camId, object : android.hardware.camera2.CameraDevice.StateCallback() {
                override fun onOpened(camera: android.hardware.camera2.CameraDevice) {
                    isOpeningCamera = false
                    cameraDevice = camera
                    createCameraPreviewSession()
                }
                override fun onDisconnected(camera: android.hardware.camera2.CameraDevice) {
                    isOpeningCamera = false
                    camera.close()
                    cameraDevice = null
                }
                override fun onError(camera: android.hardware.camera2.CameraDevice, error: Int) {
                    isOpeningCamera = false
                    camera.close()
                    cameraDevice = null
                    scheduleCameraWatchdog(400L)
                }
            }, bgHandler)
        } catch (_: Throwable) {
            isOpeningCamera = false
        }
    }

    private fun createCameraPreviewSession() {
        try {
            val device = cameraDevice ?: return
            val texture = textureView.surfaceTexture ?: return
            texture.setDefaultBufferSize(previewSize.width, previewSize.height)
            val previewSurface = android.view.Surface(texture)

            previewRequestBuilder = device.createCaptureRequest(android.hardware.camera2.CameraDevice.TEMPLATE_PREVIEW).apply {
                addTarget(previewSurface)
                set(
                    android.hardware.camera2.CaptureRequest.CONTROL_AF_MODE,
                    android.hardware.camera2.CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE
                )
                set(
                    android.hardware.camera2.CaptureRequest.CONTROL_AE_MODE,
                    android.hardware.camera2.CaptureRequest.CONTROL_AE_MODE_ON
                )
                if (hasFlashUnit && flashMode == 2) {
                    set(
                        android.hardware.camera2.CaptureRequest.FLASH_MODE,
                        android.hardware.camera2.CameraMetadata.FLASH_MODE_TORCH
                    )
                } else if (hasFlashUnit) {
                    set(
                        android.hardware.camera2.CaptureRequest.FLASH_MODE,
                        android.hardware.camera2.CameraMetadata.FLASH_MODE_OFF
                    )
                }
            }

            @Suppress("DEPRECATION")
            device.createCaptureSession(
                listOf(previewSurface),
                object : android.hardware.camera2.CameraCaptureSession.StateCallback() {
                    override fun onConfigured(session: android.hardware.camera2.CameraCaptureSession) {
                        if (cameraDevice == null) return
                        captureSession = session
                        try {
                            session.setRepeatingRequest(previewRequestBuilder!!.build(), null, bgHandler)
                        } catch (_: Throwable) {}
                    }
                    override fun onConfigureFailed(session: android.hardware.camera2.CameraCaptureSession) {}
                },
                bgHandler
            )
        } catch (_: Throwable) {}
    }

    private fun closeCamera() {
        isOpeningCamera = false
        try {
            captureSession?.close()
            captureSession = null
            cameraDevice?.close()
            cameraDevice = null
        } catch (_: Throwable) {}
    }

    override fun onSurfaceTextureAvailable(surface: android.graphics.SurfaceTexture, width: Int, height: Int) {
        checkPermAndOpenCamera()
    }

    override fun onSurfaceTextureSizeChanged(surface: android.graphics.SurfaceTexture, width: Int, height: Int) {}
    override fun onSurfaceTextureDestroyed(surface: android.graphics.SurfaceTexture): Boolean = true

    override fun onSurfaceTextureUpdated(surface: android.graphics.SurfaceTexture) {
        hasReceivedFrame = true
        if (isAnalyzing || isCapturing) return
        val smallBmp = textureView.getBitmap(200, 266) ?: return
        isAnalyzing = true
        bgHandler?.post {
            try {
                // 오토 플래시 판단을 위한 주변 평균 밝기 측정
                var lumSum = 0L
                val sw = smallBmp.width
                val sh = smallBmp.height
                val samplePx = IntArray(sw * sh)
                smallBmp.getPixels(samplePx, 0, sw, 0, 0, sw, sh)
                var sampleCnt = 0
                for (i in samplePx.indices step 8) {
                    val c = samplePx[i]
                    val r = (c shr 16) and 0xFF
                    val g = (c shr 8) and 0xFF
                    val b = c and 0xFF
                    lumSum += (r * 77 + g * 150 + b * 29) shr 8
                    sampleCnt++
                }
                if (sampleCnt > 0) {
                    lastAmbientLum = lumSum.toFloat() / sampleCnt.toFloat()
                }

                val detected = DocumentQuadDetector.detectQuadFromBitmap(smallBmp)
                smallBmp.recycle()
                for (i in 0 until 8) {
                    currentQuad[i] = currentQuad[i] * 0.48f + detected[i] * 0.52f
                }
                uiHandler.post {
                    overlayView.updateQuad(currentQuad)
                    isAnalyzing = false
                }
            } catch (_: Throwable) {
                isAnalyzing = false
            }
        }
    }
}

/**
 * 갤럭시 카메라 문서 스캔 스타일 오버레이 (플로팅 스캔 버튼 제거, 흰색 L자 모서리 외곽선 ┌ ┐ ┘ └ + 3x3 가이드 그리드):
 */
class DocumentQuadOverlayView(context: Context) : View(context) {
    private val quad = floatArrayOf(0.14f, 0.12f, 0.86f, 0.12f, 0.86f, 0.88f, 0.14f, 0.88f)
    private var flashAlpha = 0

    private val density = resources.displayMetrics.density

    private val gridPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 1.0f * density
        color = Color.argb(95, 255, 255, 255)
    }

    private val bracketShadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 5.5f * density
        strokeJoin = Paint.Join.ROUND
        strokeCap = Paint.Cap.ROUND
        color = Color.argb(110, 0, 0, 0)
    }

    private val bracketPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 3.8f * density
        strokeJoin = Paint.Join.ROUND
        strokeCap = Paint.Cap.ROUND
        color = Color.WHITE
    }

    private val bracketPath = Path()

    fun updateQuad(newQuad: FloatArray) {
        for (i in 0 until 8) quad[i] = newQuad[i]
        invalidate()
    }

    fun triggerCaptureFlash() {
        flashAlpha = 160
        invalidate()
        postDelayed({
            flashAlpha = 0
            invalidate()
        }, 110L)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) return

        // 1. 갤럭시 뷰파인더 3x3 가이드 그리드
        canvas.drawLine(w / 3f, 0f, w / 3f, h, gridPaint)
        canvas.drawLine(w * 2f / 3f, 0f, w * 2f / 3f, h, gridPaint)
        canvas.drawLine(0f, h / 3f, w, h / 3f, gridPaint)
        canvas.drawLine(0f, h * 2f / 3f, w, h * 2f / 3f, gridPaint)

        // 2. 종이 4개 모서리 흰색 L자 브래킷 (┌ ┐ ┘ └)
        val ptsX = floatArrayOf(quad[0] * w, quad[2] * w, quad[4] * w, quad[6] * w)
        val ptsY = floatArrayOf(quad[1] * h, quad[3] * h, quad[5] * h, quad[7] * h)
        val maxArm = 28f * density

        bracketPath.reset()
        for (i in 0 until 4) {
            val px = ptsX[i]
            val py = ptsY[i]
            val prevIdx = (i + 3) % 4
            val nextIdx = (i + 1) % 4

            val dx1 = ptsX[prevIdx] - px
            val dy1 = ptsY[prevIdx] - py
            val len1 = kotlin.math.hypot(dx1.toDouble(), dy1.toDouble()).toFloat().coerceAtLeast(1f)

            val dx2 = ptsX[nextIdx] - px
            val dy2 = ptsY[nextIdx] - py
            val len2 = kotlin.math.hypot(dx2.toDouble(), dy2.toDouble()).toFloat().coerceAtLeast(1f)

            val arm = minOf(maxArm, 0.24f * minOf(len1, len2))
            val ax1 = px + (dx1 / len1) * arm
            val ay1 = py + (dy1 / len1) * arm
            val ax2 = px + (dx2 / len2) * arm
            val ay2 = py + (dy2 / len2) * arm

            bracketPath.moveTo(ax1, ay1)
            bracketPath.lineTo(px, py)
            bracketPath.lineTo(ax2, ay2)
        }

        canvas.drawPath(bracketPath, bracketShadowPaint)
        canvas.drawPath(bracketPath, bracketPaint)

        if (flashAlpha > 0) {
            canvas.drawColor(Color.argb(flashAlpha, 255, 255, 255))
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
