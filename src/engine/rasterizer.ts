import * as FileSystem from "expo-file-system/legacy";
// expo-media-library's root export deprecated saveToLibraryAsync in SDK 57 and
// now throws on use. The legacy entry keeps the function-style API working;
// migrating to the class-based API is a separate change.
import * as MediaLibrary from "expo-media-library/legacy";

/**
 * Moves a freshly composed capture into the app cache under a stable name.
 *
 * The redaction itself is burned into the raster by `useRedactionComposer`;
 * flattening to JPEG there also drops EXIF and GPS. This step only gives the
 * result a predictable path for sharing and saving.
 */
export const persistRedactedImage = async (
  composedUri: string,
): Promise<string> => {
  const baseCache =
    FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
  const exportPath = `${baseCache}redactpro_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: composedUri, to: exportPath });
  return exportPath;
};

export type SaveOutcome =
  | { ok: true }
  | { ok: false; reason: "permission"; status: string }
  | { ok: false; reason: "error"; message: string };

/**
 * Adds the flattened export to the camera roll.
 *
 * Asks for add-only access: the export never reads the library, and requesting
 * full read/write makes iOS present a far more alarming prompt for an app whose
 * entire premise is that it does not look at your data.
 *
 * Returns why it failed rather than a bare boolean. The previous version
 * swallowed every error into `false` and the caller rendered "Permission
 * Denied" for all of them, so a genuine save failure was indistinguishable
 * from a declined prompt and silently reported the wrong cause.
 */
export const saveToPhotos = async (uri: string): Promise<SaveOutcome> => {
  let status: string;
  try {
    ({ status } = await MediaLibrary.requestPermissionsAsync(true));
  } catch (e) {
    return { ok: false, reason: "error", message: `permission request: ${String(e)}` };
  }
  if (status !== "granted") return { ok: false, reason: "permission", status };
  try {
    await MediaLibrary.saveToLibraryAsync(uri);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "error", message: String(e) };
  }
};
