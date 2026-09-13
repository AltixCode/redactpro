import React, { useCallback, useRef, useState } from "react";
import { Image, PixelRatio, Platform, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { DetectedTextRegion } from "../vision/ocrScanner";
import type { RedactStyle } from "../store/useRedactStore";

/**
 * Beyond this the off-screen raster risks exceeding the GPU texture limit and
 * failing the capture outright. Larger sources are exported scaled down rather
 * than not at all; the redaction still covers the same content.
 */
const MAX_EXPORT_EDGE = 4000;

export interface RedactionRequest {
  uri: string;
  imageWidth: number;
  imageHeight: number;
  regions: DetectedTextRegion[];
  style: RedactStyle;
}

interface ComposerState extends RedactionRequest {
  token: number;
  outputWidth: number;
  outputHeight: number;
  scale: number;
}

const FILL_COLOR: Record<RedactStyle, string> = {
  black: "#000000",
  white: "#FFFFFF",
  // Approximates a mosaic with opaque tiles; the point is that the original
  // pixels are gone, not that the covering is decorative.
  pixelate: "#3F3F46",
};

/**
 * Burns redactions into the image.
 *
 * The previous implementation accepted `regions` and discarded them, running an
 * empty manipulation pass and returning a re-encoded copy of the original — so
 * every "redacted" export still contained the concealed content in full. Boxes
 * are drawn here into the raster itself, and the result is flattened to JPEG,
 * which also discards EXIF and GPS.
 */
export function useRedactionComposer() {
  const shotRef = useRef<View>(null);
  const resolveRef = useRef<((uri: string) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);
  const tokenRef = useRef(0);
  const [state, setState] = useState<ComposerState | null>(null);

  const density = PixelRatio.get();

  const compose = useCallback(
    (request: RedactionRequest): Promise<string> =>
      new Promise<string>((resolve, reject) => {
        const longestEdge = Math.max(request.imageWidth, request.imageHeight);
        const scale =
          longestEdge > MAX_EXPORT_EDGE ? MAX_EXPORT_EDGE / longestEdge : 1;

        resolveRef.current = resolve;
        rejectRef.current = reject;
        tokenRef.current += 1;

        setState({
          ...request,
          token: tokenRef.current,
          scale,
          outputWidth: Math.round(request.imageWidth * scale),
          outputHeight: Math.round(request.imageHeight * scale),
        });
      }),
    [],
  );

  const handleImageLoad = useCallback(async () => {
    const resolve = resolveRef.current;
    const reject = rejectRef.current;
    if (!state || !resolve || !reject) return;

    resolveRef.current = null;
    rejectRef.current = null;

    try {
      await new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)),
      );

      const uri = await captureRef(shotRef, {
        // captureRef's width/height are in points and get multiplied by the
        // screen density to produce the raster, so passing pixel values yields
        // an image `density` times too large: a 2000px export came out 6000px.
        // Passing points lands the output on exactly the requested pixels.
        width: state.outputWidth / density,
        height: state.outputHeight / density,
        format: "jpg",
        quality: 0.92,
        result: "tmpfile",
        useRenderInContext: Platform.OS === "ios",
      });
      resolve(uri);
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setState(null);
    }
  }, [state]);

  const handleImageError = useCallback(() => {
    const reject = rejectRef.current;
    resolveRef.current = null;
    rejectRef.current = null;
    setState(null);
    reject?.(new Error("Could not decode the source image for export."));
  }, []);

  // Points, not pixels: the raster lands on outputWidth/Height after the
  // screen density is applied.
  const boxWidth = state ? state.outputWidth / density : 0;
  const boxHeight = state ? state.outputHeight / density : 0;

  const ComposerPortal = state ? (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: -100000, left: 0 }}
      collapsable={false}
    >
      <View
        ref={shotRef}
        collapsable={false}
        style={{
          width: boxWidth,
          height: boxHeight,
          backgroundColor: "#000000",
          overflow: "hidden",
        }}
      >
        <Image
          key={state.token}
          source={{ uri: state.uri }}
          style={{ width: boxWidth, height: boxHeight }}
          resizeMode="stretch"
          fadeDuration={0}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        {state.regions
          .filter((region) => region.isRedacted)
          .map((region) => (
            <View
              key={region.id}
              style={{
                position: "absolute",
                left: (region.box.x * state.scale) / density,
                top: (region.box.y * state.scale) / density,
                width: (region.box.width * state.scale) / density,
                height: (region.box.height * state.scale) / density,
                backgroundColor: FILL_COLOR[state.style],
              }}
            />
          ))}
      </View>
    </View>
  ) : null;

  return { ComposerPortal, compose };
}
