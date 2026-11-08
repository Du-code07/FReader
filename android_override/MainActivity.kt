package com.freader.my_ebook_reader

import android.content.Context
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
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
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.Charset
import java.nio.charset.CodingErrorAction
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

    // Keep one owner of immersive state. One UI can report hidden insets while
    // still drawing a transient status bar, so recovery must not depend on that
    // visibility report. Never consume touch events or IME insets.
    private var isActivityResumed = false
    private var lastImmersiveRequest = 0L
    private val immersiveRetry = Runnable {
        if (isActivityResumed && window.decorView.hasWindowFocus()) {
            hideSystemStatusBar(alsoHideNavBar = true)
        }
    }
    private var controllableInsetsListener:
        WindowInsetsController.OnControllableInsetsChangedListener? = null
    private val statusBarWatchdogRunnable = object : Runnable {
        override fun run() {
            if (!isActivityResumed) return
            if (window.decorView.hasWindowFocus()) {
                hideSystemStatusBar(alsoHideNavBar = true)
            }
            mainHandler.postDelayed(this, 2000L)
        }
    }

    private fun requestImmersiveRecovery() {
        if (!isActivityResumed || !window.decorView.hasWindowFocus()) return
        hideSystemStatusBar(alsoHideNavBar = true)
        mainHandler.removeCallbacks(immersiveRetry)
        // Android can ignore hide requests for 1s after closing the keyboard.
        mainHandler.postDelayed(immersiveRetry, 1200L)
    }

    @Suppress("DEPRECATION")
    private fun hideSystemStatusBar(alsoHideNavBar: Boolean = false) {
        if (isFinishing || isDestroyed) return
        val decor = window.decorView
        // Let search/rename/memo dialogs keep normal keyboard interaction.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R &&
            decor.rootWindowInsets?.isVisible(WindowInsets.Type.ime()) == true) return

        window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val lp = window.attributes
            val cutout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
            else WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            if (lp.layoutInDisplayCutoutMode != cutout) {
                lp.layoutInDisplayCutoutMode = cutout
                window.attributes = lp
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Use Android's controller directly: Flutter SystemUiMode is ignored
            // for targetSdk 36. Edge-to-edge alone does not hide the status bar.
            window.setDecorFitsSystemWindows(false)
            window.insetsController?.let { controller ->
                controller.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                if (alsoHideNavBar) controller.hide(WindowInsets.Type.navigationBars())
                controller.hide(WindowInsets.Type.statusBars())
            }
        } else {
            decor.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            )
        }
        lastImmersiveRequest = SystemClock.uptimeMillis()
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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val listener = WindowInsetsController.OnControllableInsetsChangedListener { _, types ->
                if ((types and WindowInsets.Type.statusBars()) != 0) {
                    window.decorView.post { requestImmersiveRecovery() }
                }
            }
            controllableInsetsListener = listener
            window.insetsController?.addOnControllableInsetsChangedListener(listener)
        }
        window.decorView.setOnApplyWindowInsetsListener { v, insets ->
            val visible = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                insets.isVisible(WindowInsets.Type.statusBars())
            } else {
                @Suppress("DEPRECATION")
                insets.systemWindowInsetTop > 0
            }
            if (visible && isActivityResumed &&
                SystemClock.uptimeMillis() - lastImmersiveRequest > 100L) {
                // Coalesce callbacks; do not schedule one task per animation frame.
                mainHandler.removeCallbacks(immersiveRetry)
                mainHandler.postDelayed(immersiveRetry, 1200L)
            }
            v.onApplyWindowInsets(insets)
        }
    }

    override fun onFlutterUiDisplayed() {
        super.onFlutterUiDisplayed()
        window.decorView.post { requestImmersiveRecovery() }
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
                    if (enabled) {
                        registerShakeSensorListener()
                    }
                    updateMediaSessionState(enabled)
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
            if (call.method == "renderPdfFirstPageThumbnail") {
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
                    } catch (e: Exception) {
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
                            val entries = zip.entries()
                            var bestEntry: ZipEntry? = null
                            var bestName = ""
                            while (entries.hasMoreElements()) {
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
                    } catch (e: Exception) {
                        runOnUiThread { result.success(null) }
                    }
                }
            } else if (call.method == "decodeTextBytes") {
                val rawBytes = call.argument<ByteArray>("bytes")
                if (rawBytes == null || rawBytes.isEmpty()) {
                    result.success("")
                    return@setMethodCallHandler
                }
                try {
                    val decoded = decodeKoreanTextBytesSmart(rawBytes)
                    result.success(decoded)
                } catch (e: Exception) {
                    result.success(String(rawBytes, Charsets.UTF_8))
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
                    } catch (e: Exception) {
                        runOnUiThread { result.error("PDF_ERR", e.message, null) }
                    }
                }.start()
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
                    } catch (e: Exception) {
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
        mainHandler.removeCallbacks(statusBarWatchdogRunnable)
        mainHandler.postDelayed(statusBarWatchdogRunnable, 750L)
        registerShakeSensorListener()
        if (isVolumeInterceptEnabled) {
            updateMediaSessionState(true)
        }
    }

    override fun onPause() {
        isActivityResumed = false
        mainHandler.removeCallbacks(statusBarWatchdogRunnable)
        mainHandler.removeCallbacks(immersiveRetry)
        try {
            sensorManager?.unregisterListener(this)
        } catch (_: Exception) {}
        super.onPause()
    }

    override fun onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            controllableInsetsListener?.let {
                window.insetsController?.removeOnControllableInsetsChangedListener(it)
            }
        }
        controllableInsetsListener = null
        isActivityResumed = false
        mainHandler.removeCallbacks(statusBarWatchdogRunnable)
        mainHandler.removeCallbacks(immersiveRetry)
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
        if (isVolumeInterceptEnabled) checkStylusButtonEvent(ev)
        val handled = super.dispatchTouchEvent(ev)
        if (ev != null && ev.actionMasked == MotionEvent.ACTION_UP) {
            // Apply AFTER Flutter/WebView processes the tap; keep its normal action.
            // Do this even if One UI claims the status bar is already hidden.
            window.decorView.post { requestImmersiveRecovery() }
        }
        return handled
    }

    private fun decodeKoreanTextBytesSmart(bytes: ByteArray): String {
        if (bytes.size >= 3 &&
            (bytes[0].toInt() and 0xFF) == 0xEF &&
            (bytes[1].toInt() and 0xFF) == 0xBB &&
            (bytes[2].toInt() and 0xFF) == 0xBF
        ) {
            return String(bytes, 3, bytes.size - 3, Charsets.UTF_8)
        }
        if (bytes.size >= 2 &&
            (bytes[0].toInt() and 0xFF) == 0xFF &&
            (bytes[1].toInt() and 0xFF) == 0xFE
        ) {
            return String(bytes, 2, bytes.size - 2, Charsets.UTF_16LE)
        }
        if (bytes.size >= 2 &&
            (bytes[0].toInt() and 0xFF) == 0xFE &&
            (bytes[1].toInt() and 0xFF) == 0xFF
        ) {
            return String(bytes, 2, bytes.size - 2, Charsets.UTF_16BE)
        }

        try {
            val utf8Decoder = Charsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
            return utf8Decoder.decode(ByteBuffer.wrap(bytes)).toString()
        } catch (_: CharacterCodingException) {}

        for (csName in listOf("MS949", "CP949", "EUC-KR", "x-windows-949")) {
            try {
                if (Charset.isSupported(csName)) {
                    return String(bytes, Charset.forName(csName))
                }
            } catch (_: Exception) {}
        }

        return String(bytes, Charsets.UTF_8)
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
}
