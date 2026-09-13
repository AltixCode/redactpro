package expo.modules.textscanner

import android.graphics.BitmapFactory
import android.graphics.Rect
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * On-device text recognition backed by ML Kit's bundled Latin recogniser.
 *
 * The bundled variant is used rather than the Play-Services-delivered one so
 * the first scan works with no network and no model download, which is what the
 * app's privacy claim requires.
 */
class TextScannerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TextScanner")

    AsyncFunction("scanImage") { uri: String, promise: Promise ->
      try {
        scan(uri, promise)
      } catch (error: Exception) {
        promise.reject("ERR_TEXT_SCAN", error.message ?: "Text recognition failed.", error)
      }
    }
  }

  private fun scan(uri: String, promise: Promise) {
    val context = appContext.reactContext
      ?: return promise.reject("ERR_TEXT_SCAN", "No React context available.", null)

    val parsed = Uri.parse(uri)
    val image = InputImage.fromFilePath(context, parsed)

    // InputImage applies the EXIF rotation, so the recogniser's boxes are in
    // upright space; the reported dimensions must match that, not the raw file.
    val rotated = image.rotationDegrees == 90 || image.rotationDegrees == 270
    val width = if (rotated) image.height else image.width
    val height = if (rotated) image.width else image.height

    TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      .process(image)
      .addOnSuccessListener { result ->
        val lines = mutableListOf<Map<String, Any>>()

        for (block in result.textBlocks) {
          for (line in block.lines) {
            val lineBox = line.boundingBox ?: continue
            if (line.text.isBlank()) continue

            val words = line.elements.mapNotNull { element ->
              element.boundingBox?.let { box -> boxMap(element.text, box) }
            }

            lines.add(
              mapOf(
                "text" to line.text,
                "x" to lineBox.left,
                "y" to lineBox.top,
                "width" to lineBox.width(),
                "height" to lineBox.height(),
                "words" to words,
              )
            )
          }
        }

        promise.resolve(
          mapOf(
            "imageWidth" to width,
            "imageHeight" to height,
            "lines" to lines,
          )
        )
      }
      .addOnFailureListener { error ->
        promise.reject("ERR_TEXT_SCAN", error.message ?: "Text recognition failed.", error)
      }
  }

  private fun boxMap(text: String, box: Rect): Map<String, Any> = mapOf(
    "text" to text,
    "x" to box.left,
    "y" to box.top,
    "width" to box.width(),
    "height" to box.height(),
  )
}
