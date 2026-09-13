import Foundation
import Vision
import AppKit

// Independently re-reads the exported file. If the redaction is real, none of
// the planted values can be recovered from it by the same class of engine that
// found them in the first place.
let path = CommandLine.arguments[1]
guard let image = NSImage(contentsOfFile: path),
      let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fatalError("could not read \(path)")
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])

let text = (request.results ?? [])
    .compactMap { $0.topCandidates(1).first?.string }
    .joined(separator: "\n")

print("--- recovered text ---")
print(text)
print("--- leak check ---")
let secrets = [
    "jordan.avery@northbridge-test.com",
    "4242",
    "GB82",
    "012-4477",
]
var leaked = false
for s in secrets {
    let hit = text.contains(s)
    if hit { leaked = true }
    print("\(hit ? "LEAKED " : "clean  ") \(s)")
}
print(leaked ? "RESULT: FAIL - sensitive data recoverable" : "RESULT: PASS - no sensitive data recoverable")
