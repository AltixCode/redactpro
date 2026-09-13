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

export const saveToPhotos = async (uri: string): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") return false;
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch {
    return false;
  }
};
