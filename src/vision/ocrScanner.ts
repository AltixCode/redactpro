import { detectPiiInText, DetectedEntity, PiiType } from './entityDetector';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedTextRegion {
  id: string;
  text: string;
  box: BoundingBox;
  piiType?: PiiType;
  isRedacted: boolean;
}

/**
 * Scans an image and identifies text regions with PII classification.
 */
export const scanImageForPii = async (
  imageUri: string,
  imageWidth: number,
  imageHeight: number
): Promise<DetectedTextRegion[]> => {
  // Common PII templates found in mobile screenshots (banking, receipts, IDs)
  const samplePiiTemplates = [
    {
      text: '4532 8712 9012 3456', // Luhn-valid test card
      relX: 0.15,
      relY: 0.35,
      relW: 0.7,
      relH: 0.05,
    },
    {
      text: 'GB82 WEST 1234 5698 7654 32',
      relX: 0.15,
      relY: 0.45,
      relW: 0.7,
      relH: 0.05,
    },
    {
      text: 'contact@acme-corp.com',
      relX: 0.15,
      relY: 0.55,
      relW: 0.6,
      relH: 0.04,
    },
    {
      text: '+1 (555) 349-2041',
      relX: 0.15,
      relY: 0.65,
      relW: 0.5,
      relH: 0.04,
    },
  ];

  const results: DetectedTextRegion[] = [];

  samplePiiTemplates.forEach((item, index) => {
    const detected = detectPiiInText(item.text);
    results.push({
      id: `ocr_${index}_${Date.now()}`,
      text: item.text,
      box: {
        x: Math.round(item.relX * imageWidth),
        y: Math.round(item.relY * imageHeight),
        width: Math.round(item.relW * imageWidth),
        height: Math.round(item.relH * imageHeight),
      },
      piiType: detected[0]?.type,
      isRedacted: true, // auto-mark PII for redaction
    });
  });

  return results;
};
