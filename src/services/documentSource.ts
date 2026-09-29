export type PickedDocumentKind = "image" | "pdf" | "unsupported";

export interface PickedDocumentLike {
  mimeType?: string | null;
  name?: string | null;
}

const IMAGE_EXTENSION = /\.(png|jpe?g|heic|heif|webp|gif|bmp|tiff?)$/i;
const PDF_EXTENSION = /\.pdf$/i;

/**
 * Classifies a file handed back by expo-document-picker so the "Import from
 * Files" flow knows whether to run it through the existing image pipeline,
 * explain that PDF pages aren't scanned yet, or refuse it outright.
 *
 * Files reached through Files/iCloud (as opposed to the photo library) do not
 * reliably carry a useful `mimeType` -- content synced from another app can
 * report `application/octet-stream`, and some providers omit it entirely --
 * so the extension is the fallback, never the only signal, since a MIME type
 * the OS did supply is more trustworthy than a user-chosen filename.
 */
export const classifyPickedDocument = (
  doc: PickedDocumentLike,
): PickedDocumentKind => {
  const mime = (doc.mimeType ?? "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";

  const name = doc.name ?? "";
  if (IMAGE_EXTENSION.test(name)) return "image";
  if (PDF_EXTENSION.test(name)) return "pdf";

  return "unsupported";
};
