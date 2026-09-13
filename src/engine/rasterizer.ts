import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";

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
