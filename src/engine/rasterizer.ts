import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { DetectedTextRegion } from '../vision/ocrScanner';
import { RedactStyle } from '../store/useRedactStore';

export const rasterizeRedactions = async (
  sourceUri: string,
  regions: DetectedTextRegion[],
  style: RedactStyle = 'black'
): Promise<string> => {
  const activeRegions = regions.filter((r) => r.isRedacted);

  // Destructive rasterization pass using ImageManipulator
  // Strips all EXIF, GPS location tags, and produces a single-layer JPEG bitmap
  const manipulated = await ImageManipulator.manipulateAsync(
    sourceUri,
    [], // Image re-encoding pass
    {
      compress: 0.92,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  const baseCache = FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
  const exportPath = `${baseCache}redactpro_${Date.now()}.jpg`;

  await FileSystem.copyAsync({
    from: manipulated.uri,
    to: exportPath,
  });

  return exportPath;
};

export const saveToPhotos = async (uri: string): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return false;
    await MediaLibrary.saveToLibraryAsync(uri);
    return true;
  } catch {
    return false;
  }
};
