import ExpoModulesCore
import Vision
import UIKit

/// On-device text recognition backed by Apple's Vision framework.
///
/// Vision is used rather than ML Kit because Google's ML Kit CocoaPods ship no
/// arm64 iOS-simulator slice and force `EXCLUDED_ARCHS[sdk=iphonesimulator*]`,
/// which makes the app unbuildable for the simulator on Apple Silicon. Vision
/// is first-party, adds no binary weight, and never leaves the device.
public class TextScannerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TextScanner")

    AsyncFunction("scanImage") { (uri: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          let result = try Self.scan(uri: uri)
          promise.resolve(result)
        } catch {
          promise.reject("ERR_TEXT_SCAN", error.localizedDescription)
        }
      }
    }
  }

  private enum ScanError: LocalizedError {
    case unreadableImage

    var errorDescription: String? {
      switch self {
      case .unreadableImage: return "The image could not be read for text recognition."
      }
    }
  }

  private static func scan(uri: String) throws -> [String: Any] {
    let url = URL(string: uri) ?? URL(fileURLWithPath: uri)

    guard let data = try? Data(contentsOf: url),
          let image = UIImage(data: data),
          let cgImage = image.cgImage else {
      throw ScanError.unreadableImage
    }

    let width = CGFloat(cgImage.width)
    let height = CGFloat(cgImage.height)

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    // Sensitive values are codes, not prose; language correction rewrites card
    // and IBAN digit groups into dictionary words and destroys the match.
    request.usesLanguageCorrection = false

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    let observations = request.results ?? []
    var lines: [[String: Any]] = []

    for observation in observations {
      guard let candidate = observation.topCandidates(1).first else { continue }
      let text = candidate.string
      if text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { continue }

      // Vision reports a normalised box with origin at the bottom-left; the
      // rest of the pipeline works in top-left pixel space.
      let lineBox = Self.pixelRect(observation.boundingBox, width: width, height: height)

      // Per-word boxes come from the recognised-text range API rather than
      // being interpolated, so a redaction can cover one field instead of the
      // whole line.
      //
      // The search start advances past each match. Without it, `range(of:)`
      // returns the first occurrence every time, so in "4242 4242 4242 4242"
      // all four groups resolve to the first group's box and the redaction
      // covers only the leading digits.
      var words: [[String: Any]] = []
      var searchStart = text.startIndex
      for word in text.split(separator: " ", omittingEmptySubsequences: true) {
        guard let range = text.range(of: String(word), range: searchStart..<text.endIndex) else {
          continue
        }
        searchStart = range.upperBound

        guard let wordBox = try? candidate.boundingBox(for: range) else { continue }
        let rect = Self.pixelRect(wordBox.boundingBox, width: width, height: height)
        words.append([
          "text": String(word),
          "x": rect.origin.x,
          "y": rect.origin.y,
          "width": rect.size.width,
          "height": rect.size.height,
        ])
      }

      lines.append([
        "text": text,
        "x": lineBox.origin.x,
        "y": lineBox.origin.y,
        "width": lineBox.size.width,
        "height": lineBox.size.height,
        "words": words,
      ])
    }

    return [
      "imageWidth": Int(width),
      "imageHeight": Int(height),
      "lines": lines,
    ]
  }

  /// Converts a normalised, bottom-left-origin Vision box to top-left pixels.
  private static func pixelRect(_ box: CGRect, width: CGFloat, height: CGFloat) -> CGRect {
    CGRect(
      x: box.minX * width,
      y: (1 - box.maxY) * height,
      width: box.width * width,
      height: box.height * height
    )
  }
}
