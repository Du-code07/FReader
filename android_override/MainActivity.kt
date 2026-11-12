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

    // ── 문서 스캔 (무음 인앱 카메라 + 청록색 종이 인식 틀 + 4점 원근 투시 변환 + CamScanner 8종 필터) ──

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
            pendingCameraResult = result
            pendingCameraSinglePathMode = singlePathReturn
            val intent = android.content.Intent(this, DocumentCameraActivity::class.java).apply {
                putExtra("batchMode", batchMode)
                putExtra("shutterSound", shutterSound)
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
            val shutterSound = data.getBooleanExtra("shutterSound", false)
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
                    "shutterSound" to shutterSound,
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
     * 카메라로 찍은 문서 사진을 4점 원근 투시 변환(Perspective Warp) + 손가락 지우기 +
     * 언샤프 마스크(글자 선명화) + 다중 스케일 조명 그림자 제거로 실제 스캔본처럼 보정한다.
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

        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(inputPath, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) throw IllegalStateException("이미지를 읽을 수 없습니다.")
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > maxDim * 2) {
            sample *= 2
        }
        var bmp = BitmapFactory.decodeFile(inputPath, BitmapFactory.Options().apply { inSampleSize = sample })
            ?: throw IllegalStateException("이미지 디코딩 실패")

        // 1. 4점 사각형(청록색 종이 인식 틀) 원근 투시 보정 (Matrix.setPolyToPoly)
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
                val isFull = (q[0] < 0.008f && q[1] < 0.008f &&
                    q[2] > 0.992f && q[3] < 0.008f &&
                    q[4] > 0.992f && q[5] > 0.992f &&
                    q[6] < 0.008f && q[7] > 0.992f)
                if (!isFull) {
                    bmp = warpPerspectiveQuad(bmp, q, maxDim)
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

        val w = bmp.width
        val h = bmp.height
        val pixels = IntArray(w * h)
        bmp.getPixels(pixels, 0, w, 0, 0, w, h)

        // 4. 가장자리 손가락 지우기 (vFlat 스타일: 좌·우·하단 가장자리 7.5% 내 피부색 영역을 종이 배경색으로 덮음)
        if (eraseFingers && w >= 80 && h >= 80) {
            eraseEdgeFingersInPlace(pixels, w, h)
        }

        // 5. CamScanner 스타일 8종 스캔 필터 적용
        if (mode != "original") {
            val rawLum = IntArray(w * h)
            for (i in pixels.indices) {
                val c = pixels[i]
                val r = (c shr 16) and 0xFF
                val g = (c shr 8) and 0xFF
                val b = c and 0xFF
                rawLum[i] = (r * 77 + g * 150 + b * 29) shr 8
            }

            // 5a. 글자 획 선명화 (3x3 Unsharp Mask) — 흐릿한 카메라 글씨와 표 선을 또렷하게 복원
            val lum = IntArray(w * h)
            for (y in 0 until h) {
                val row = y * w
                if (y == 0 || y == h - 1) {
                    for (x in 0 until w) lum[row + x] = rawLum[row + x]
                    continue
                }
                lum[row] = rawLum[row]
                lum[row + w - 1] = rawLum[row + w - 1]
                for (x in 1 until w - 1) {
                    val idx = row + x
                    val center = rawLum[idx]
                    val avg4 = (rawLum[idx - 1] + rawLum[idx + 1] + rawLum[idx - w] + rawLum[idx + w]) shr 2
                    // 중심 대비(detail)를 증폭하여 작은 발음기호·한글 획을 선명하게
                    val sharp = center + ((center - avg4) * 5) / 4
                    lum[idx] = sharp.coerceIn(0, 255)
                }
            }

            // 5b. 2차원 적분 영상(Integral Image)으로 지역 조명 배경 추정
            val stride = w + 1
            val integral = LongArray((w + 1) * (h + 1))
            for (y in 0 until h) {
                var rowSum = 0L
                val rowOffset = y * w
                val intRow = (y + 1) * stride
                val intPrevRow = y * stride
                for (x in 0 until w) {
                    rowSum += rawLum[rowOffset + x]
                    integral[intRow + x + 1] = integral[intPrevRow + x + 1] + rowSum
                }
            }

            val radSmall = maxOf(16, minOf(w, h) / 14)
            val radLarge = maxOf(36, minOf(w, h) / 6)

            // contrast(0..1): 기본 0.55
            val paperWhiteFloor = (236 - (contrast * 30f)).toInt().coerceIn(192, 245)
            val inkDarkCeil = (108 + (contrast * 68f)).toInt().coerceIn(85, 182)
            val span = maxOf(1, paperWhiteFloor - inkDarkCeil)

            for (y in 0 until h) {
                val ys0 = maxOf(0, y - radSmall)
                val ys1 = minOf(h - 1, y + radSmall)
                val rs0 = ys0 * stride
                val rs1 = (ys1 + 1) * stride

                val yl0 = maxOf(0, y - radLarge)
                val yl1 = minOf(h - 1, y + radLarge)
                val rl0 = yl0 * stride
                val rl1 = (yl1 + 1) * stride

                val rowOffset = y * w
                for (x in 0 until w) {
                    val xs0 = maxOf(0, x - radSmall)
                    val xs1 = minOf(w - 1, x + radSmall)
                    val cntS = (xs1 - xs0 + 1) * (ys1 - ys0 + 1)
                    val sumS = integral[rs1 + xs1 + 1] - integral[rs0 + xs1 + 1] - integral[rs1 + xs0] + integral[rs0 + xs0]
                    val bgSmall = (sumS / cntS).toInt()

                    val xl0 = maxOf(0, x - radLarge)
                    val xl1 = minOf(w - 1, x + radLarge)
                    val cntL = (xl1 - xl0 + 1) * (yl1 - yl0 + 1)
                    val sumL = integral[rl1 + xl1 + 1] - integral[rl0 + xl1 + 1] - integral[rl1 + xl0] + integral[rl0 + xl0]
                    val bgLarge = (sumL / cntL).toInt()

                    // 두 스케일 중 더 밝은 배경값을 택하고 약간(4%) 보정하여 글자 주변 번짐 방지
                    val localBg = maxOf(48, (maxOf(bgSmall, bgLarge) * 265) shr 8).coerceAtMost(255)

                    val idx = rowOffset + x
                    val l = lum[idx]
                    val rel = ((l * 255) / localBg).coerceIn(0, 255)

                    when (mode) {
                        "magic" -> {
                            // 강화 (매직 프로): 종이 배경은 100% 순백색(#FFFFFF)으로 정리하고 글자·표·색상은 선명하게 강조
                            val c = pixels[idx]
                            val r = (c shr 16) and 0xFF
                            val g = (c shr 8) and 0xFF
                            val b = c and 0xFF
                            val sat = maxOf(r, maxOf(g, b)) - minOf(r, minOf(g, b))

                            if (rel >= paperWhiteFloor && sat < 42) {
                                pixels[idx] = 0xFFFFFFFF.toInt()
                            } else if (sat < 35) {
                                // 무채색 글자·표 선: 고대비 S-커브로 아주 또렷하게
                                val v = when {
                                    rel >= paperWhiteFloor -> 255
                                    rel <= inkDarkCeil -> (rel * 22 / maxOf(1, inkDarkCeil)).coerceIn(0, 24)
                                    else -> {
                                        val t = (rel - inkDarkCeil).toFloat() / span.toFloat()
                                        val smooth = t * t * (3f - 2f * t)
                                        (24f + smooth * 231f).toInt().coerceIn(0, 255)
                                    }
                                }
                                pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                            } else {
                                // 컬러 형광펜·도장·색글씨: 그림자 제거 후 채도·대비 강화
                                val nr = ((r * 255) / localBg).coerceIn(0, 255)
                                val ng = ((g * 255) / localBg).coerceIn(0, 255)
                                val nb = ((b * 255) / localBg).coerceIn(0, 255)
                                val gain = 1.25f + contrast * 0.40f
                                val fr = (255f - (255 - nr) * gain).toInt().coerceIn(0, 255)
                                val fg = (255f - (255 - ng) * gain).toInt().coerceIn(0, 255)
                                val fb = (255f - (255 - nb) * gain).toInt().coerceIn(0, 255)
                                pixels[idx] = (0xFF shl 24) or (fr shl 16) or (fg shl 8) or fb
                            }
                        }
                        "noshadow" -> {
                            // 음영 제거: 어두운 그림자만 걷어내고 종이 질감과 부드러운 글씨 톤을 자연스럽게 유지
                            val c = pixels[idx]
                            val r = (c shr 16) and 0xFF
                            val g = (c shr 8) and 0xFF
                            val b = c and 0xFF
                            val sat = maxOf(r, maxOf(g, b)) - minOf(r, minOf(g, b))
                            val softFloor = (240 - (contrast * 18f)).toInt().coerceIn(212, 246)
                            val softCeil = (65 + (contrast * 45f)).toInt().coerceIn(50, 125)
                            if (sat < 32) {
                                val v = when {
                                    rel >= softFloor -> 255
                                    rel <= softCeil -> (rel * 30 / maxOf(1, softCeil)).coerceIn(0, 30)
                                    else -> {
                                        val t = (rel - softCeil).toFloat() / maxOf(1, softFloor - softCeil).toFloat()
                                        (30f + t * 225f).toInt().coerceIn(0, 255)
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
                            // 밝게하기: 원본 색감과 도표 음영을 유지하면서 전체 문서를 환하고 깨끗하게
                            val c = pixels[idx]
                            val r = (c shr 16) and 0xFF
                            val g = (c shr 8) and 0xFF
                            val b = c and 0xFF
                            val boost = (localBg * 3 + 255 * 2) / 5
                            val br = ((r * 255) / maxOf(80, boost)).coerceIn(0, 255)
                            val bg = ((g * 255) / maxOf(80, boost)).coerceIn(0, 255)
                            val bb = ((b * 255) / maxOf(80, boost)).coerceIn(0, 255)
                            pixels[idx] = (0xFF shl 24) or (br shl 16) or (bg shl 8) or bb
                        }
                        "scan_bw" -> {
                            // 흑백: 또렷한 흑백 인쇄용 스캔본
                            val bwThreshold = (182 + ((contrast - 0.5f) * 56f)).toInt().coerceIn(135, 222)
                            val v = when {
                                rel >= bwThreshold + 12 -> 255
                                rel <= bwThreshold - 12 -> 0
                                else -> ((rel - (bwThreshold - 12)) * 255 / 24).coerceIn(0, 255)
                            }
                            pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                        }
                        "eco" -> {
                            // 에코 (토너·잉크 절약): 배경은 완전 백색, 진한 어두운 덩어리는 부드러운 먹색으로
                            val v = when {
                                rel >= paperWhiteFloor - 6 -> 255
                                rel <= inkDarkCeil -> 42
                                else -> {
                                    val t = (rel - inkDarkCeil).toFloat() / maxOf(1, paperWhiteFloor - 6 - inkDarkCeil).toFloat()
                                    (42f + t * 213f).toInt().coerceIn(42, 255)
                                }
                            }
                            pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                        }
                        "scan_gray" -> {
                            // 그레이스케일: 그림자 없는 정갈한 회색조 문서
                            val whitePt = (242 - (contrast * 16f)).toInt().coerceIn(218, 246)
                            val blackPt = (42 + (contrast * 38f)).toInt().coerceIn(30, 88)
                            val v = when {
                                rel >= whitePt -> 255
                                rel <= blackPt -> 0
                                else -> ((rel - blackPt) * 255 / maxOf(1, whitePt - blackPt)).coerceIn(0, 255)
                            }
                            pixels[idx] = (0xFF shl 24) or (v shl 16) or (v shl 8) or v
                        }
                        "invert" -> {
                            // 반전: 눈이 편한 다크 스캔본 (검은 배경 + 흰 글씨)
                            val v = when {
                                rel >= paperWhiteFloor -> 255
                                rel <= inkDarkCeil -> (rel * 20 / maxOf(1, inkDarkCeil)).coerceIn(0, 20)
                                else -> {
                                    val t = (rel - inkDarkCeil).toFloat() / span.toFloat()
                                    (20f + t * 235f).toInt().coerceIn(0, 255)
                                }
                            }
                            val inv = (255 - v).coerceIn(18, 250)
                            pixels[idx] = (0xFF shl 24) or (inv shl 16) or (inv shl 8) or inv
                        }
                    }
                }
            }
        }

        val outBmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        outBmp.setPixels(pixels, 0, w, 0, 0, w, h)
        bmp.recycle()

        val outFile = File(outputPath)
        outFile.parentFile?.mkdirs()
        FileOutputStream(outFile).use { out ->
            outBmp.compress(Bitmap.CompressFormat.JPEG, 92, out)
        }
        outBmp.recycle()
        return outFile.absolutePath
    }

    /** 4점 다각형 [tlX, tlY, trX, trY, brX, brY, blX, blY] (0~1) 영역을 직사각형으로 원근 보정 */
    private fun warpPerspectiveQuad(src: Bitmap, q: FloatArray, maxDim: Int): Bitmap {
        val sw = src.width.toFloat()
        val sh = src.height.toFloat()
        val srcPts = floatArrayOf(
            q[0] * sw, q[1] * sh,
            q[2] * sw, q[3] * sh,
            q[4] * sw, q[5] * sh,
            q[6] * sw, q[7] * sh
        )
        val topW = kotlin.math.hypot((srcPts[2] - srcPts[0]).toDouble(), (srcPts[3] - srcPts[1]).toDouble()).toFloat()
        val botW = kotlin.math.hypot((srcPts[4] - srcPts[6]).toDouble(), (srcPts[5] - srcPts[7]).toDouble()).toFloat()
        val leftH = kotlin.math.hypot((srcPts[6] - srcPts[0]).toDouble(), (srcPts[7] - srcPts[1]).toDouble()).toFloat()
        val rightH = kotlin.math.hypot((srcPts[4] - srcPts[2]).toDouble(), (srcPts[5] - srcPts[3]).toDouble()).toFloat()

        var dstW = maxOf(topW, botW).coerceAtLeast(200f)
        var dstH = maxOf(leftH, rightH).coerceAtLeast(200f)
        val longest = maxOf(dstW, dstH)
        if (longest > maxDim) {
            val s = maxDim.toFloat() / longest
            dstW *= s
            dstH *= s
        }
        val iw = dstW.toInt().coerceAtLeast(100)
        val ih = dstH.toInt().coerceAtLeast(100)
        val dstPts = floatArrayOf(
            0f, 0f,
            iw.toFloat(), 0f,
            iw.toFloat(), ih.toFloat(),
            0f, ih.toFloat()
        )
        val matrix = android.graphics.Matrix()
        return if (matrix.setPolyToPoly(srcPts, 0, dstPts, 0, 4)) {
            val out = Bitmap.createBitmap(iw, ih, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(out)
            canvas.drawColor(Color.WHITE)
            val paint = Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG)
            canvas.drawBitmap(src, matrix, paint)
            if (out !== src) src.recycle()
            out
        } else {
            src
        }
    }

    /** 좌·우·하단 가장자리(7.5%)에 맞닿은 손가락(피부색 영역)을 주변 종이 밝기로 자연스럽게 지운다 */
    private fun eraseEdgeFingersInPlace(pixels: IntArray, w: Int, h: Int) {
        val marginX = (w * 0.075f).toInt().coerceAtLeast(6)
        val marginBottom = (h * 0.075f).toInt().coerceAtLeast(6)

        // 안쪽 종이 영역의 평균 RGB 계산
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
                if (r + g + b > 380) {
                    sumR += r; sumG += g; sumB += b; cnt++
                }
            }
        }
        val paperR = if (cnt > 0) (sumR / cnt).toInt().coerceIn(200, 255) else 245
        val paperG = if (cnt > 0) (sumG / cnt).toInt().coerceIn(200, 255) else 245
        val paperB = if (cnt > 0) (sumB / cnt).toInt().coerceIn(200, 255) else 245
        val paperColor = (0xFF shl 24) or (paperR shl 16) or (paperG shl 8) or paperB

        fun isSkinPixel(c: Int): Boolean {
            val r = (c shr 16) and 0xFF
            val g = (c shr 8) and 0xFF
            val b = c and 0xFF
            val maxC = maxOf(r, maxOf(g, b))
            val minC = minOf(r, minOf(g, b))
            return r > 95 && g > 40 && b > 20 &&
                (maxC - minC) > 22 &&
                (r - g) > 15 && r > b &&
                (r + g + b) < 660
        }

        for (y in 0 until h) {
            val row = y * w
            val inBottom = y >= h - marginBottom
            for (x in 0 until w) {
                if (x < marginX || x >= w - marginX || inBottom) {
                    if (isSkinPixel(pixels[row + x])) {
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

/**
 * 실시간 및 정지 영상에서 종이(문서)의 4개 꼭짓점 [tlX, tlY, trX, trY, brX, brY, blX, blY] (0~1)을 찾는다.
 * - 기울어진 종이나 모서리가 살짝 접힌 종이(Screenshot 7)도 4변 직선 피팅 및 교점 계산으로 정확하게 사변형 틀을 인식한다.
 */
object DocumentQuadDetector {
    fun detectQuadFromFile(path: String): FloatArray {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
            return floatArrayOf(0.06f, 0.06f, 0.94f, 0.06f, 0.94f, 0.94f, 0.06f, 0.94f)
        }
        var sample = 1
        while (maxOf(bounds.outWidth, bounds.outHeight) / sample > 360) sample *= 2
        val bmp = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sample })
            ?: return floatArrayOf(0.06f, 0.06f, 0.94f, 0.06f, 0.94f, 0.94f, 0.06f, 0.94f)
        try {
            return detectQuadFromBitmap(bmp)
        } finally {
            bmp.recycle()
        }
    }

    fun detectQuadFromBitmap(src: Bitmap): FloatArray {
        val defaultQuad = floatArrayOf(0.07f, 0.08f, 0.93f, 0.08f, 0.93f, 0.92f, 0.07f, 0.92f)
        val W = 160
        val H = maxOf(120, (src.height * W / maxOf(1, src.width)).coerceIn(120, 260))
        val small = if (src.width == W && src.height == H) src else Bitmap.createScaledBitmap(src, W, H, true)
        try {
            val px = IntArray(W * H)
            small.getPixels(px, 0, W, 0, 0, W, H)

            // 종이 점수 = 밝기(Luminance) - 채도(Saturation)*0.65 (종이는 밝고 채도가 낮으며 책상/바닥은 어둡거나 채도가 높음)
            val score = IntArray(W * H)
            val hist = IntArray(256)
            for (i in px.indices) {
                val c = px[i]
                val r = (c shr 16) and 0xFF
                val g = (c shr 8) and 0xFF
                val b = c and 0xFF
                val lum = (r * 77 + g * 150 + b * 29) shr 8
                val sat = maxOf(r, maxOf(g, b)) - minOf(r, minOf(g, b))
                val s = (lum - (sat * 13) / 20).coerceIn(0, 255)
                score[i] = s
                hist[s]++
            }

            // Otsu 임계값 계산
            val total = W * H
            var sumAll = 0.0
            for (t in 0 until 256) sumAll += t.toDouble() * hist[t]
            var wb = 0.0
            var sb = 0.0
            var bestVar = -1.0
            var otsu = 140
            for (t in 0 until 256) {
                wb += hist[t]
                if (wb == 0.0) continue
                val wf = total - wb
                if (wf == 0.0) break
                sb += t.toDouble() * hist[t]
                val mb = sb / wb
                val mf = (sumAll - sb) / wf
                val v = wb * wf * (mb - mf) * (mb - mf)
                if (v > bestVar) {
                    bestVar = v
                    otsu = t
                }
            }
            val th = otsu.coerceIn(105, 205)

            // 중앙 영역에서 시작하는 연결된 종이 영역(Flood Fill) 추출
            val mask = BooleanArray(total)
            val queue = IntArray(total)
            var qHead = 0
            var qTail = 0

            val cx0 = (W * 0.32f).toInt()
            val cx1 = (W * 0.68f).toInt()
            val cy0 = (H * 0.32f).toInt()
            val cy1 = (H * 0.68f).toInt()
            for (y in cy0..cy1 step 2) {
                val row = y * W
                for (x in cx0..cx1 step 2) {
                    val idx = row + x
                    if (score[idx] >= th && !mask[idx]) {
                        mask[idx] = true
                        queue[qTail++] = idx
                    }
                }
            }

            while (qHead < qTail) {
                val cur = queue[qHead++]
                val cx = cur % W
                val cy = cur / W
                if (cx > 1 && !mask[cur - 1] && score[cur - 1] >= th) {
                    mask[cur - 1] = true; queue[qTail++] = cur - 1
                }
                if (cx < W - 2 && !mask[cur + 1] && score[cur + 1] >= th) {
                    mask[cur + 1] = true; queue[qTail++] = cur + 1
                }
                if (cy > 1 && !mask[cur - W] && score[cur - W] >= th) {
                    mask[cur - W] = true; queue[qTail++] = cur - W
                }
                if (cy < H - 2 && !mask[cur + W] && score[cur + W] >= th) {
                    mask[cur + W] = true; queue[qTail++] = cur + W
                }
            }

            // 종이 면적이 너무 작거나 화면 전체(97% 이상)이면 기본 틀 반환
            if (qTail < total * 0.10 || qTail > total * 0.97) {
                return defaultQuad
            }

            // 대각 투영(x+y, x-y)으로 4개 극점(TL, TR, BR, BL) 탐색
            var minSum = Int.MAX_VALUE; var tlX = W * 0.08f; var tlY = H * 0.08f
            var maxSum = Int.MIN_VALUE; var brX = W * 0.92f; var brY = H * 0.92f
            var maxDiff = Int.MIN_VALUE; var trX = W * 0.92f; var trY = H * 0.08f
            var minDiff = Int.MAX_VALUE; var blX = W * 0.08f; var blY = H * 0.92f

            for (i in 0 until qTail) {
                val idx = queue[i]
                val x = idx % W
                val y = idx / W
                val sum = x + y
                val diff = x - y
                if (sum < minSum) { minSum = sum; tlX = x.toFloat(); tlY = y.toFloat() }
                if (sum > maxSum) { maxSum = sum; brX = x.toFloat(); brY = y.toFloat() }
                if (diff > maxDiff) { maxDiff = diff; trX = x.toFloat(); trY = y.toFloat() }
                if (diff < minDiff) { minDiff = diff; blX = x.toFloat(); blY = y.toFloat() }
            }

            // 모서리가 접힌 경우를 보완하기 위해 상·하·좌·우 4변의 경계 점들에 직선을 피팅해 교점을 구함
            val xLeftSpan = maxOf(tlX, blX).toInt()
            val xRightSpan = minOf(trX, brX).toInt()
            if (xRightSpan - xLeftSpan > W / 4) {
                val x0 = xLeftSpan + (xRightSpan - xLeftSpan) / 6
                val x1 = xRightSpan - (xRightSpan - xLeftSpan) / 6
                val topPts = ArrayList<Pair<Float, Float>>()
                val botPts = ArrayList<Pair<Float, Float>>()
                for (x in x0..x1) {
                    var ty = -1
                    for (y in 0 until H) if (mask[y * W + x]) { ty = y; break }
                    var by = -1
                    for (y in H - 1 downTo 0) if (mask[y * W + x]) { by = y; break }
                    if (ty >= 0) topPts.add(x.toFloat() to ty.toFloat())
                    if (by >= 0) botPts.add(x.toFloat() to by.toFloat())
                }
                val yTopSpan = maxOf(tlY, trY).toInt()
                val yBotSpan = minOf(blY, brY).toInt()
                val leftPts = ArrayList<Pair<Float, Float>>()
                val rightPts = ArrayList<Pair<Float, Float>>()
                if (yBotSpan - yTopSpan > H / 4) {
                    val y0 = yTopSpan + (yBotSpan - yTopSpan) / 6
                    val y1 = yBotSpan - (yBotSpan - yTopSpan) / 6
                    for (y in y0..y1) {
                        val row = y * W
                        var lx = -1
                        for (x in 0 until W) if (mask[row + x]) { lx = x; break }
                        var rx = -1
                        for (x in W - 1 downTo 0) if (mask[row + x]) { rx = x; break }
                        if (lx >= 0) leftPts.add(y.toFloat() to lx.toFloat())
                        if (rx >= 0) rightPts.add(y.toFloat() to rx.toFloat())
                    }
                }
                if (topPts.size >= 8 && botPts.size >= 8 && leftPts.size >= 8 && rightPts.size >= 8) {
                    // y = m*x + b (top, bottom), x = m*y + b (left, right)
                    val (mt, bt) = fitLine(topPts)
                    val (mb, bb) = fitLine(botPts)
                    val (ml, bl) = fitLine(leftPts)
                    val (mr, br) = fitLine(rightPts)

                    fun intersect(mHoriz: Float, bHoriz: Float, mVert: Float, bVert: Float): Pair<Float, Float>? {
                        val denom = 1f - mHoriz * mVert
                        if (kotlin.math.abs(denom) < 1e-4f) return null
                        val y = (mHoriz * bVert + bHoriz) / denom
                        val x = mVert * y + bVert
                        return x to y
                    }
                    intersect(mt, bt, ml, bl)?.let { (x, y) -> tlX = x; tlY = y }
                    intersect(mt, bt, mr, br)?.let { (x, y) -> trX = x; trY = y }
                    intersect(mb, bb, mr, br)?.let { (x, y) -> brX = x; brY = y }
                    intersect(mb, bb, ml, bl)?.let { (x, y) -> blX = x; blY = y }
                }
            }

            return floatArrayOf(
                (tlX / W).coerceIn(0.01f, 0.99f), (tlY / H).coerceIn(0.01f, 0.99f),
                (trX / W).coerceIn(0.01f, 0.99f), (trY / H).coerceIn(0.01f, 0.99f),
                (brX / W).coerceIn(0.01f, 0.99f), (brY / H).coerceIn(0.01f, 0.99f),
                (blX / W).coerceIn(0.01f, 0.99f), (blY / H).coerceIn(0.01f, 0.99f)
            )
        } finally {
            if (small !== src) small.recycle()
        }
    }

    private fun fitLine(pts: List<Pair<Float, Float>>): Pair<Float, Float> {
        var sx = 0.0; var sy = 0.0; var sxx = 0.0; var sxy = 0.0
        val n = pts.size.toDouble()
        for ((x, y) in pts) {
            sx += x; sy += y; sxx += x * x; sxy += x * y
        }
        val denom = n * sxx - sx * sx
        if (kotlin.math.abs(denom) < 1e-5) return 0f to (sy / n).toFloat()
        val m = ((n * sxy - sx * sy) / denom).toFloat()
        val b = ((sy - m * sx) / n).toFloat()
        return m to b
    }
}

/**
 * CamScanner / vFlat 스타일 인앱 무음 문서 스캔 카메라 화면:
 * - 실시간 청록색(#00E5B8) 종이 크기 인식 틀 표시
 * - 카메라 셔터음 끄기(무음 촬영 기본) 및 vFlat 스타일 스캔 설정 시트(셔터 소리, 색상 보정, 손가락 지우기, 더 펴기)
 * - [단일 / 배치] 촬영 전환 및 이미지 가져오기 연동
 */
class DocumentCameraActivity : android.app.Activity(), android.view.TextureView.SurfaceTextureListener {
    private lateinit var textureView: android.view.TextureView
    private lateinit var overlayView: DocumentQuadOverlayView
    private lateinit var shutterSoundBtn: android.widget.TextView
    private lateinit var flashBtn: android.widget.TextView
    private lateinit var singleTabBtn: android.widget.TextView
    private lateinit var batchTabBtn: android.widget.TextView
    private lateinit var thumbBadgeView: android.widget.TextView
    private lateinit var thumbImageView: android.widget.ImageView
    private lateinit var thumbContainer: android.widget.FrameLayout
    private lateinit var confirmBatchBtn: android.widget.TextView

    private var cameraDevice: android.hardware.camera2.CameraDevice? = null
    private var captureSession: android.hardware.camera2.CameraCaptureSession? = null
    private var previewRequestBuilder: android.hardware.camera2.CaptureRequest.Builder? = null
    private var bgThread: android.os.HandlerThread? = null
    private var bgHandler: Handler? = null
    private val uiHandler = Handler(Looper.getMainLooper())

    private var batchMode = false
    private var shutterSound = false // 기본값: 셔터음 끄기 (무음)
    private var colorEnhance = true
    private var eraseFingers = true
    private var flattenQuad = true
    private var torchOn = false
    private var isCapturing = false
    private var isAnalyzing = false

    private val capturedPaths = ArrayList<String>()
    private val capturedQuads = ArrayList<String>()
    private var currentQuad = floatArrayOf(0.08f, 0.10f, 0.92f, 0.10f, 0.92f, 0.90f, 0.08f, 0.90f)
    private var previewSize = android.util.Size(1920, 1080)

    companion object {
        private const val REQ_CAM_PERM = 9102
        private val TEAL_COLOR = Color.parseColor("#00D9B5")
    }

    private fun dp(v: Float): Int = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or WindowManager.LayoutParams.FLAG_FULLSCREEN)

        batchMode = intent.getBooleanExtra("batchMode", false)
        shutterSound = intent.getBooleanExtra("shutterSound", false)
        colorEnhance = intent.getBooleanExtra("colorEnhance", true)
        eraseFingers = intent.getBooleanExtra("eraseFingers", true)
        flattenQuad = intent.getBooleanExtra("flattenQuad", true)

        buildCameraLayout()
    }

    private fun buildCameraLayout() {
        val root = android.widget.FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
        }

        // 1. 중앙 카메라 미리보기 영역 + 청록색 종이 인식 틀 오버레이
        val cameraFrame = android.widget.FrameLayout(this)
        textureView = android.view.TextureView(this).apply {
            surfaceTextureListener = this@DocumentCameraActivity
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
        root.addView(
            cameraFrame,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ).apply {
                topMargin = dp(56f)
                bottomMargin = dp(148f)
            }
        )

        // 2. 상단 컨트롤 바 (✕ 닫기 | 플래시 | 셔터음 무음 토글 | HD | ⋮ 설정)
        val topBar = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER_VERTICAL
            setBackgroundColor(Color.BLACK)
            setPadding(dp(12f), dp(8f), dp(12f), dp(8f))
        }

        val closeBtn = android.widget.TextView(this).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            textSize = 21f
            setPadding(dp(12f), dp(6f), dp(12f), dp(6f))
            setOnClickListener { finishWithResult(cancelled = capturedPaths.isEmpty()) }
        }
        topBar.addView(closeBtn)

        topBar.addView(
            View(this),
            android.widget.LinearLayout.LayoutParams(0, 1, 1f)
        )

        flashBtn = android.widget.TextView(this).apply {
            text = "⚡ 꺼짐"
            setTextColor(Color.WHITE)
            textSize = 13.5f
            setPadding(dp(10f), dp(6f), dp(10f), dp(6f))
            setOnClickListener { toggleTorch() }
        }
        topBar.addView(flashBtn)

        shutterSoundBtn = android.widget.TextView(this).apply {
            setPadding(dp(10f), dp(6f), dp(10f), dp(6f))
            textSize = 13.5f
            setOnClickListener {
                shutterSound = !shutterSound
                updateShutterSoundLabel()
            }
        }
        updateShutterSoundLabel()
        topBar.addView(shutterSoundBtn)

        val hdBadge = android.widget.TextView(this).apply {
            text = "HD"
            setTextColor(Color.BLACK)
            textSize = 11.5f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(6f), dp(2f), dp(6f), dp(2f))
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = dp(4f).toFloat()
            }
        }
        topBar.addView(
            hdBadge,
            android.widget.LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply { leftMargin = dp(8f); rightMargin = dp(8f) }
        )

        val moreBtn = android.widget.TextView(this).apply {
            text = "⋮"
            setTextColor(Color.WHITE)
            textSize = 22f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(12f), dp(4f), dp(10f), dp(4f))
            setOnClickListener { showVFlatSettingsSheet() }
        }
        topBar.addView(moreBtn)

        root.addView(
            topBar,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(56f),
                android.view.Gravity.TOP
            )
        )

        // 3. 카메라 화면 하단 위 [ 단일 | 배치 ] 전환 캡슐 (Screenshot 7 스타일)
        val modePill = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#9922262C"))
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

        root.addView(
            modePill,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                android.view.Gravity.BOTTOM or android.view.Gravity.CENTER_HORIZONTAL
            ).apply {
                bottomMargin = dp(160f)
            }
        )

        // 4. 하단 촬영 바 (좌: 촬영 썸네일/확인 | 중앙: 청록색 링 셔터 버튼 | 우: 이미지 가져오기/완료)
        val bottomPanel = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(Color.BLACK)
            gravity = android.view.Gravity.CENTER
            setPadding(dp(18f), dp(8f), dp(18f), dp(14f))
        }

        val modeLabel = android.widget.TextView(this).apply {
            text = "스캔"
            setTextColor(TEAL_COLOR)
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, dp(10f))
        }
        bottomPanel.addView(modeLabel)

        val actionRow = android.widget.RelativeLayout(this)

        // 좌측: 찍은 사진 미리보기 썸네일 + 장수 배지
        thumbContainer = android.widget.FrameLayout(this).apply {
            visibility = View.INVISIBLE
            setOnClickListener {
                if (capturedPaths.isNotEmpty()) finishWithResult(cancelled = false)
            }
        }
        thumbImageView = android.widget.ImageView(this).apply {
            scaleType = android.widget.ImageView.ScaleType.CENTER_CROP
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.DKGRAY)
                cornerRadius = dp(8f).toFloat()
                setStroke(dp(1.5f), Color.WHITE)
            }
        }
        thumbContainer.addView(
            thumbImageView,
            android.widget.FrameLayout.LayoutParams(dp(54f), dp(66f)).apply {
                topMargin = dp(6f)
                rightMargin = dp(6f)
            }
        )
        thumbBadgeView = android.widget.TextView(this).apply {
            text = "0"
            setTextColor(Color.BLACK)
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
        actionRow.addView(
            thumbContainer,
            android.widget.RelativeLayout.LayoutParams(dp(64f), dp(74f)).apply {
                addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT)
                addRule(android.widget.RelativeLayout.CENTER_VERTICAL)
            }
        )

        // 중앙: 청록색 링 + 흰색 원형 셔터 버튼 (Screenshot 7 스타일)
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
            }
        }
        shutterOuter.addView(
            shutterInner,
            android.widget.FrameLayout.LayoutParams(dp(58f), dp(58f), android.view.Gravity.CENTER)
        )
        actionRow.addView(
            shutterOuter,
            android.widget.RelativeLayout.LayoutParams(dp(74f), dp(74f)).apply {
                addRule(android.widget.RelativeLayout.CENTER_IN_PARENT)
            }
        )

        // 우측: 이미지 가져오기 / 배치 완료(확인) 버튼
        val rightBox = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
        }
        confirmBatchBtn = android.widget.TextView(this).apply {
            text = "이미지 가져오기"
            setTextColor(Color.WHITE)
            textSize = 12.5f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            gravity = android.view.Gravity.CENTER
            setPadding(dp(12f), dp(10f), dp(12f), dp(10f))
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#2A303A"))
                cornerRadius = dp(18f).toFloat()
            }
            setOnClickListener {
                if (capturedPaths.isNotEmpty()) {
                    finishWithResult(cancelled = false)
                } else {
                    finishWithResult(cancelled = false, pickGallery = true)
                }
            }
        }
        rightBox.addView(confirmBatchBtn)
        actionRow.addView(
            rightBox,
            android.widget.RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ).apply {
                addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT)
                addRule(android.widget.RelativeLayout.CENTER_VERTICAL)
            }
        )

        bottomPanel.addView(
            actionRow,
            android.widget.LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(84f)
            )
        )

        root.addView(
            bottomPanel,
            android.widget.FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dp(148f),
                android.view.Gravity.BOTTOM
            )
        )

        setContentView(root)
    }

    private fun updateShutterSoundLabel() {
        if (shutterSound) {
            shutterSoundBtn.text = "🔊 셔터음 켜짐"
            shutterSoundBtn.setTextColor(Color.WHITE)
        } else {
            shutterSoundBtn.text = "🔇 셔터음 꺼짐"
            shutterSoundBtn.setTextColor(TEAL_COLOR)
        }
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
        if (capturedPaths.isEmpty()) {
            thumbContainer.visibility = View.INVISIBLE
            confirmBatchBtn.text = "이미지 가져오기"
            confirmBatchBtn.setTextColor(Color.WHITE)
            confirmBatchBtn.background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#2A303A"))
                cornerRadius = dp(18f).toFloat()
            }
        } else {
            thumbContainer.visibility = View.VISIBLE
            thumbBadgeView.text = "${capturedPaths.size}"
            if (latestBmp != null) {
                thumbImageView.setImageBitmap(latestBmp)
            }
            confirmBatchBtn.text = "확인 (${capturedPaths.size}장) ✓"
            confirmBatchBtn.setTextColor(Color.BLACK)
            confirmBatchBtn.background = android.graphics.drawable.GradientDrawable().apply {
                setColor(TEAL_COLOR)
                cornerRadius = dp(18f).toFloat()
            }
        }
    }

    /** vFlat Scan 스타일 설정 팝업 시트 (Screenshot 1 반영: 셔터 소리, 색상 보정, 손가락 지우기, 더 펴기, 가져오기) */
    private fun showVFlatSettingsSheet() {
        val dialog = android.app.Dialog(this)
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE)
        val card = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(dp(22f), dp(20f), dp(22f), dp(18f))
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#E61C1E22"))
                cornerRadius = dp(22f).toFloat()
            }
        }

        // 상단 셔터 소리 빠른 토글 버튼
        val topRow = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, dp(14f))
        }
        val soundToggleBox = android.widget.TextView(this).apply {
            gravity = android.view.Gravity.CENTER
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(18f), dp(10f), dp(18f), dp(10f))
            fun refresh() {
                text = if (shutterSound) "🔊  셔터 소리 (켜짐)" else "🔇  셔터 소리 (무음)"
                setTextColor(if (shutterSound) Color.WHITE else TEAL_COLOR)
            }
            refresh()
            setOnClickListener {
                shutterSound = !shutterSound
                refresh()
                updateShutterSoundLabel()
            }
        }
        topRow.addView(soundToggleBox)
        card.addView(topRow)

        fun addDivider() {
            card.addView(
                View(this).apply { setBackgroundColor(Color.parseColor("#33FFFFFF")) },
                android.widget.LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(1f)).apply {
                    topMargin = dp(8f); bottomMargin = dp(8f)
                }
            )
        }

        fun addSwitchRow(title: String, desc: String, initial: Boolean, onChange: (Boolean) -> Unit) {
            addDivider()
            val row = android.widget.LinearLayout(this).apply {
                orientation = android.widget.LinearLayout.HORIZONTAL
                gravity = android.view.Gravity.CENTER_VERTICAL
                setPadding(0, dp(6f), 0, dp(6f))
            }
            val textCol = android.widget.LinearLayout(this).apply {
                orientation = android.widget.LinearLayout.VERTICAL
            }
            val tView = android.widget.TextView(this).apply {
                text = title
                setTextColor(Color.WHITE)
                textSize = 15.5f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
            }
            val dView = android.widget.TextView(this).apply {
                text = desc
                setTextColor(Color.parseColor("#9AA0A6"))
                textSize = 12.5f
                setPadding(0, dp(3f), 0, 0)
            }
            textCol.addView(tView)
            textCol.addView(dView)
            row.addView(textCol, android.widget.LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))

            val sw = android.widget.Switch(this).apply {
                isChecked = initial
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    thumbTintList = android.content.res.ColorStateList.valueOf(Color.WHITE)
                    trackTintList = android.content.res.ColorStateList.valueOf(
                        if (initial) TEAL_COLOR else Color.GRAY
                    )
                }
                setOnCheckedChangeListener { _, checked ->
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        trackTintList = android.content.res.ColorStateList.valueOf(
                            if (checked) TEAL_COLOR else Color.GRAY
                        )
                    }
                    onChange(checked)
                }
            }
            row.addView(sw)
            card.addView(row)
        }

        addSwitchRow(
            "색상 보정",
            "색상 보정 기능을 끄면 스캔한 페이지의 본래색을 유지합니다.",
            colorEnhance
        ) { colorEnhance = it }

        addSwitchRow(
            "손가락 지우기",
            "스캔 결과물에서 가장자리 손가락을 지웁니다.",
            eraseFingers
        ) { eraseFingers = it }

        addSwitchRow(
            "더 펴기",
            "종이 인식 틀을 기준으로 스캔 결과물이 더 반듯해지도록 보정합니다.",
            flattenQuad
        ) { flattenQuad = it }

        addDivider()

        val bottomBtns = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.HORIZONTAL
            gravity = android.view.Gravity.CENTER
            setPadding(0, dp(6f), 0, dp(2f))
        }
        val importBtn = android.widget.TextView(this).apply {
            text = "🖼  갤러리에서 가져오기"
            setTextColor(TEAL_COLOR)
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(16f), dp(8f), dp(16f), dp(8f))
            setOnClickListener {
                dialog.dismiss()
                finishWithResult(cancelled = false, pickGallery = true)
            }
        }
        val closeSheetBtn = android.widget.TextView(this).apply {
            text = "닫기"
            setTextColor(Color.WHITE)
            textSize = 14f
            setPadding(dp(20f), dp(8f), dp(20f), dp(8f))
            setOnClickListener { dialog.dismiss() }
        }
        bottomBtns.addView(importBtn)
        bottomBtns.addView(closeSheetBtn)
        card.addView(bottomBtns)

        dialog.setContentView(card)
        dialog.window?.apply {
            setBackgroundDrawable(android.graphics.drawable.ColorDrawable(Color.TRANSPARENT))
            setLayout((resources.displayMetrics.widthPixels * 0.90).toInt(), ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        dialog.show()
    }

    private fun toggleTorch() {
        torchOn = !torchOn
        flashBtn.text = if (torchOn) "⚡ 켜짐" else "⚡ 꺼짐"
        flashBtn.setTextColor(if (torchOn) Color.YELLOW else Color.WHITE)
        try {
            val builder = previewRequestBuilder ?: return
            builder.set(
                android.hardware.camera2.CaptureRequest.FLASH_MODE,
                if (torchOn) android.hardware.camera2.CaptureRequest.FLASH_MODE_TORCH
                else android.hardware.camera2.CaptureRequest.FLASH_MODE_OFF
            )
            captureSession?.setRepeatingRequest(builder.build(), null, bgHandler)
        } catch (_: Throwable) {}
    }

    /** 무음 촬영: TextureView의 고해상도 프레임을 즉시 캡처하여 셔터음이 전혀 나지 않음 */
    private fun captureFrameSilently() {
        if (isCapturing || !textureView.isAvailable) return
        isCapturing = true

        if (shutterSound) {
            try {
                val sound = android.media.MediaActionSound()
                sound.play(android.media.MediaActionSound.SHUTTER_CLICK)
            } catch (_: Throwable) {}
        }

        overlayView.triggerCaptureFlash()

        val rawBmp = textureView.bitmap
        if (rawBmp == null) {
            isCapturing = false
            return
        }
        val quadSnapshot = currentQuad.clone()

        bgHandler?.post {
            try {
                val scanDir = File(cacheDir, "scan_photos")
                if (!scanDir.exists()) scanDir.mkdirs()
                val outFile = File(scanDir, "raw_${System.currentTimeMillis()}.jpg")
                FileOutputStream(outFile).use { out ->
                    rawBmp.compress(Bitmap.CompressFormat.JPEG, 94, out)
                }
                val thumbBmp = Bitmap.createScaledBitmap(rawBmp, 120, 160, true)
                rawBmp.recycle()

                val qToSave = if (flattenQuad) quadSnapshot else floatArrayOf(0f, 0f, 1f, 0f, 1f, 1f, 0f, 1f)
                val qString = qToSave.joinToString(",") { String.format(java.util.Locale.US, "%.4f", it) }

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
            putExtra("shutterSound", shutterSound)
            putExtra("colorEnhance", colorEnhance)
            putExtra("eraseFingers", eraseFingers)
            putExtra("flattenQuad", flattenQuad)
        }
        setResult(RESULT_OK, data)
        finish()
    }

    override fun onResume() {
        super.onResume()
        startBackgroundThread()
        if (textureView.isAvailable) {
            checkPermAndOpenCamera()
        } else {
            textureView.surfaceTextureListener = this
        }
    }

    override fun onPause() {
        closeCamera()
        stopBackgroundThread()
        super.onPause()
    }

    private fun startBackgroundThread() {
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
                openCamera()
            } else {
                android.widget.Toast.makeText(this, "문서 스캔을 위해 카메라 권한이 필요합니다.", android.widget.Toast.LENGTH_SHORT).show()
                finishWithResult(cancelled = true)
            }
        }
    }

    @android.annotation.SuppressLint("MissingPermission")
    private fun openCamera() {
        try {
            val manager = getSystemService(Context.CAMERA_SERVICE) as android.hardware.camera2.CameraManager
            var camId: String? = null
            for (id in manager.cameraIdList) {
                val chars = manager.getCameraCharacteristics(id)
                val facing = chars.get(android.hardware.camera2.CameraCharacteristics.LENS_FACING)
                if (facing == android.hardware.camera2.CameraCharacteristics.LENS_FACING_BACK) {
                    camId = id
                    val map = chars.get(android.hardware.camera2.CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
                    val sizes = map?.getOutputSizes(android.graphics.SurfaceTexture::class.java)
                    if (!sizes.isNullOrEmpty()) {
                        // 1920x1440 또는 1920x1080 이상 고해상도 프리뷰 선택
                        previewSize = sizes
                            .filter { maxOf(it.width, it.height) in 1280..2560 }
                            .maxByOrNull { it.width * it.height } ?: sizes[0]
                    }
                    break
                }
            }
            if (camId == null && manager.cameraIdList.isNotEmpty()) {
                camId = manager.cameraIdList[0]
            }
            if (camId == null) return

            manager.openCamera(camId, object : android.hardware.camera2.CameraDevice.StateCallback() {
                override fun onOpened(camera: android.hardware.camera2.CameraDevice) {
                    cameraDevice = camera
                    createCameraPreviewSession()
                }
                override fun onDisconnected(camera: android.hardware.camera2.CameraDevice) {
                    camera.close()
                    cameraDevice = null
                }
                override fun onError(camera: android.hardware.camera2.CameraDevice, error: Int) {
                    camera.close()
                    cameraDevice = null
                }
            }, bgHandler)
        } catch (_: Throwable) {}
    }

    private fun createCameraPreviewSession() {
        try {
            val device = cameraDevice ?: return
            val texture = textureView.surfaceTexture ?: return
            texture.setDefaultBufferSize(previewSize.width, previewSize.height)
            val surface = android.view.Surface(texture)

            previewRequestBuilder = device.createCaptureRequest(android.hardware.camera2.CameraDevice.TEMPLATE_PREVIEW).apply {
                addTarget(surface)
                set(
                    android.hardware.camera2.CaptureRequest.CONTROL_AF_MODE,
                    android.hardware.camera2.CaptureRequest.CONTROL_AF_MODE_CONTINUOUS_PICTURE
                )
                set(
                    android.hardware.camera2.CaptureRequest.CONTROL_AE_MODE,
                    android.hardware.camera2.CaptureRequest.CONTROL_AE_MODE_ON
                )
            }

            @Suppress("DEPRECATION")
            device.createCaptureSession(
                listOf(surface),
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
        if (isAnalyzing || isCapturing) return
        val smallBmp = textureView.getBitmap(160, 213) ?: return
        isAnalyzing = true
        bgHandler?.post {
            try {
                val detected = DocumentQuadDetector.detectQuadFromBitmap(smallBmp)
                smallBmp.recycle()
                // 이전 프레임의 인식 틀과 부드럽게 보간(Lerp)하여 떨림 없이 종이 윤곽을 추적
                for (i in 0 until 8) {
                    currentQuad[i] = currentQuad[i] * 0.62f + detected[i] * 0.38f
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
 * 실시간 카메라 화면 위에 청록색(#00E5B8) 종이 크기 인식 틀 사각형(사변형)을 그리는 뷰 (Screenshot 7 반영)
 */
class DocumentQuadOverlayView(context: Context) : View(context) {
    private val quad = floatArrayOf(0.08f, 0.10f, 0.92f, 0.10f, 0.92f, 0.90f, 0.08f, 0.90f)
    private var flashAlpha = 0

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
        color = Color.parseColor("#2400E5B8")
    }
    private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 3.5f * resources.displayMetrics.density
        strokeJoin = Paint.Join.ROUND
        strokeCap = Paint.Cap.ROUND
        color = Color.parseColor("#00E5B8")
    }
    private val path = Path()

    fun updateQuad(newQuad: FloatArray) {
        for (i in 0 until 8) quad[i] = newQuad[i]
        invalidate()
    }

    fun triggerCaptureFlash() {
        flashAlpha = 180
        invalidate()
        postDelayed({
            flashAlpha = 0
            invalidate()
        }, 120L)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) return

        path.reset()
        path.moveTo(quad[0] * w, quad[1] * h)
        path.lineTo(quad[2] * w, quad[3] * h)
        path.lineTo(quad[4] * w, quad[5] * h)
        path.lineTo(quad[6] * w, quad[7] * h)
        path.close()

        canvas.drawPath(path, fillPaint)
        canvas.drawPath(path, strokePaint)

        if (flashAlpha > 0) {
            canvas.drawColor(Color.argb(flashAlpha, 0, 229, 184))
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
