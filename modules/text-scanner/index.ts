import { requireNativeModule } from 'expo-modules-core';

export interface ScannedWord {
  text: string;
  /** Image pixel coordinates, origin top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScannedLine {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  words: ScannedWord[];
}

export interface TextScanResult {
  /** Pixel dimensions of the image actually analysed, after EXIF orientation. */
  imageWidth: number;
  imageHeight: number;
  lines: ScannedLine[];
}

interface TextScannerModule {
  scanImage(uri: string): Promise<TextScanResult>;
}

/**
 * On-device text recognition.
 *
 * iOS uses the Vision framework and Android uses ML Kit's bundled Latin
 * recogniser. Both run entirely on device with no network access. Google's
 * ML Kit CocoaPods ship no arm64 iOS-simulator slice and force
 * EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64, which makes an app that links
 * them unbuildable for the simulator on Apple Silicon — hence Vision on iOS.
 */
export default requireNativeModule<TextScannerModule>('TextScanner');
