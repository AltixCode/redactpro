import AppKit

// A synthetic statement carrying one of each pattern RedactPro claims to find.
// Values are standard test data: 4242… is the Stripe test card (Luhn-valid),
// GB82 WEST… is the canonical IBAN example, 555-01xx is the reserved US range.
let lines: [(String, CGFloat, Bool)] = [
  ("NORTHBRIDGE BANK", 34, true),
  ("Monthly Statement — August 2026", 18, false),
  ("", 10, false),
  ("Account holder: Jordan Avery", 20, false),
  ("Email: jordan.avery@northbridge-test.com", 20, false),
  ("Phone: +1 (555) 012-4477", 20, false),
  ("", 10, false),
  ("Card number: 4242 4242 4242 4242", 22, false),
  ("IBAN: GB82 WEST 1234 5698 7654 32", 22, false),
  ("", 10, false),
  ("Closing balance: 4,182.60 GBP", 20, false),
  ("Statement reference: NB-2026-08-114", 16, false),
]

let width: CGFloat = 1000
let height: CGFloat = 1400
let image = NSImage(size: NSSize(width: width, height: height))
image.lockFocus()

NSColor.white.setFill()
NSRect(x: 0, y: 0, width: width, height: height).fill()

var y: CGFloat = height - 120
for (text, size, bold) in lines {
    if text.isEmpty { y -= size; continue }
    let font = bold ? NSFont.boldSystemFont(ofSize: size) : NSFont.systemFont(ofSize: size)
    let attrs: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: NSColor.black]
    text.draw(at: NSPoint(x: 80, y: y), withAttributes: attrs)
    y -= size + 26
}

image.unlockFocus()

guard let tiff = image.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let png = rep.representation(using: .png, properties: [:]) else {
    fatalError("could not encode fixture")
}
try! png.write(to: URL(fileURLWithPath: "/tmp/redact-fixture.png"))
print("wrote /tmp/redact-fixture.png")
