import TextScanner, { type ScannedLine } from "../../modules/text-scanner";
import { detectPiiInText, DetectedEntity, PiiType } from "./entityDetector";

export interface BoundingBox {
  /** Image pixel coordinates, origin top-left. */
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

export interface ScanOutcome {
  regions: DetectedTextRegion[];
  /** Dimensions of the image the recogniser actually analysed, after EXIF rotation. */
  imageWidth: number;
  imageHeight: number;
  /** Lines seen but not matched, so the UI can offer them for manual redaction. */
  unmatchedLines: DetectedTextRegion[];
}

/** Grows a box to contain another; used to union the word boxes covering one match. */
const union = (a: BoundingBox, b: BoundingBox): BoundingBox => {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
};

const lineBox = (line: ScannedLine): BoundingBox => ({
  x: line.x,
  y: line.y,
  width: line.width,
  height: line.height,
});

/**
 * Locates the word boxes covering `[start, end)` of a line's text.
 *
 * Recognition reports a box per line and per word, but not per character, so an
 * exact pixel span is not available. Walking the words and keeping those that
 * overlap the match gives a box tight enough to avoid blacking out a whole line
 * for one field, while still fully covering the value.
 */
const boxForRange = (
  line: ScannedLine,
  start: number,
  end: number,
): BoundingBox => {
  let cursor = 0;
  let result: BoundingBox | null = null;

  for (const word of line.words) {
    // Re-locate each word in the line text so separator widths are accounted for.
    const found = line.text.indexOf(word.text, cursor);
    const wordStart = found === -1 ? cursor : found;
    const wordEnd = wordStart + word.text.length;
    cursor = wordEnd;

    if (wordStart < end && start < wordEnd) {
      const box: BoundingBox = {
        x: word.x,
        y: word.y,
        width: word.width,
        height: word.height,
      };
      result = result ? union(result, box) : box;
    }
  }

  // No usable word boxes: cover the whole line, which over-redacts rather than
  // leaving the value exposed.
  return result ?? lineBox(line);
};

/** Pads a box so anti-aliased glyph edges cannot survive outside the fill. */
const inflate = (
  box: BoundingBox,
  imageWidth: number,
  imageHeight: number,
): BoundingBox => {
  const pad = Math.max(2, Math.round(box.height * 0.12));
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  return {
    x,
    y,
    width: Math.min(imageWidth - x, box.width + pad * 2),
    height: Math.min(imageHeight - y, box.height + pad * 2),
  };
};

/**
 * Runs on-device text recognition over the image and returns a box for every
 * value matching a sensitive-data pattern, plus every line that did not match.
 *
 * Recognition is performed by the platform's local engine — Vision on iOS,
 * ML Kit's bundled Latin model on Android. No part of the image is uploaded.
 */
export const scanImageForPii = async (
  imageUri: string,
): Promise<ScanOutcome> => {
  const scan = await TextScanner.scanImage(imageUri);

  const regions: DetectedTextRegion[] = [];
  const unmatchedLines: DetectedTextRegion[] = [];
  let index = 0;

  for (const line of scan.lines) {
    const entities: DetectedEntity[] = detectPiiInText(line.text);

    if (entities.length === 0) {
      if (line.text.trim()) {
        unmatchedLines.push({
          id: `line_${index++}`,
          text: line.text,
          box: lineBox(line),
          isRedacted: false,
        });
      }
      continue;
    }

    for (const entity of entities) {
      const box = boxForRange(line, entity.start, entity.end);
      if (box.width <= 0 || box.height <= 0) continue;

      regions.push({
        id: `ocr_${index++}`,
        text: entity.text,
        box: inflate(box, scan.imageWidth, scan.imageHeight),
        piiType: entity.type,
        isRedacted: true,
      });
    }
  }

  return {
    regions,
    unmatchedLines,
    imageWidth: scan.imageWidth,
    imageHeight: scan.imageHeight,
  };
};
