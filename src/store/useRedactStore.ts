import { create } from 'zustand';
import { DetectedTextRegion, BoundingBox } from '../vision/ocrScanner';

export type RedactStyle = 'black' | 'pixelate' | 'white';

interface RedactState {
  imageUri: string | null;
  imageWidth: number;
  imageHeight: number;
  regions: DetectedTextRegion[];
  redactStyle: RedactStyle;
  isPro: boolean;
  exportedUri: string | null;
  isScanning: boolean;

  // Actions
  setImage: (uri: string | null, width?: number, height?: number) => void;
  setRegions: (regions: DetectedTextRegion[]) => void;
  toggleRedaction: (id: string) => void;
  addManualBox: (box: BoundingBox) => void;
  removeBox: (id: string) => void;
  setRedactStyle: (style: RedactStyle) => void;
  setIsPro: (isPro: boolean) => void;
  setExportedUri: (uri: string | null) => void;
  setIsScanning: (isScanning: boolean) => void;
  autoRedactAll: () => void;
  reset: () => void;
}

export const useRedactStore = create<RedactState>((set) => ({
  imageUri: null,
  imageWidth: 1080,
  imageHeight: 1920,
  regions: [],
  redactStyle: 'black',
  isPro: false,
  exportedUri: null,
  isScanning: false,

  setImage: (imageUri, width = 1080, height = 1920) =>
    set({ imageUri, imageWidth: width, imageHeight: height, regions: [], exportedUri: null }),
  setRegions: (regions) => set({ regions }),
  toggleRedaction: (id) =>
    set((state) => ({
      regions: state.regions.map((r) =>
        r.id === id ? { ...r, isRedacted: !r.isRedacted } : r
      ),
    })),
  addManualBox: (box) =>
    set((state) => ({
      regions: [
        ...state.regions,
        {
          id: `manual_${Date.now()}`,
          text: 'Manual Redaction',
          box,
          isRedacted: true,
        },
      ],
    })),
  removeBox: (id) =>
    set((state) => ({
      regions: state.regions.filter((r) => r.id !== id),
    })),
  setRedactStyle: (redactStyle) => set({ redactStyle }),
  setIsPro: (isPro) => set({ isPro }),
  setExportedUri: (exportedUri) => set({ exportedUri }),
  setIsScanning: (isScanning) => set({ isScanning }),
  autoRedactAll: () =>
    set((state) => ({
      regions: state.regions.map((r) => ({ ...r, isRedacted: true })),
    })),
  reset: () =>
    set({
      imageUri: null,
      regions: [],
      exportedUri: null,
      isScanning: false,
    }),
}));
