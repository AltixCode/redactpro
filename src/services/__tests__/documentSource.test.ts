import { classifyPickedDocument } from "../documentSource";

describe("classifyPickedDocument", () => {
  it("classifies an image by MIME type", () => {
    expect(
      classifyPickedDocument({ mimeType: "image/jpeg", name: "scan.jpg" }),
    ).toBe("image");
    expect(
      classifyPickedDocument({ mimeType: "image/png", name: "receipt.png" }),
    ).toBe("image");
  });

  it("classifies a PDF by MIME type", () => {
    expect(
      classifyPickedDocument({
        mimeType: "application/pdf",
        name: "statement.pdf",
      }),
    ).toBe("pdf");
  });

  it("falls back to the file extension when the picker reports no MIME type", () => {
    // iCloud/Files can hand back an asset with an empty or generic mimeType
    // (e.g. "application/octet-stream") for files synced from other apps.
    expect(
      classifyPickedDocument({ mimeType: null, name: "IMG_0012.HEIC" }),
    ).toBe("image");
    expect(
      classifyPickedDocument({
        mimeType: "application/octet-stream",
        name: "tax-form.pdf",
      }),
    ).toBe("pdf");
  });

  it("is case-insensitive on both MIME type and extension", () => {
    expect(
      classifyPickedDocument({ mimeType: "IMAGE/JPEG", name: "Scan.JPG" }),
    ).toBe("image");
    expect(
      classifyPickedDocument({ mimeType: null, name: "Statement.PDF" }),
    ).toBe("pdf");
  });

  it("reports anything else as unsupported rather than guessing", () => {
    expect(
      classifyPickedDocument({ mimeType: "text/plain", name: "notes.txt" }),
    ).toBe("unsupported");
    expect(
      classifyPickedDocument({ mimeType: undefined, name: undefined }),
    ).toBe("unsupported");
  });
});
