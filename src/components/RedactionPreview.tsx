import React, { useState } from "react";
import { Image, LayoutChangeEvent, View } from "react-native";
import type { DetectedTextRegion } from "../vision/ocrScanner";
import type { RedactStyle } from "../store/useRedactStore";

const FILL_COLOR: Record<RedactStyle, string> = {
  black: "#000000",
  white: "#FFFFFF",
  pixelate: "#3F3F46",
};

interface RedactionPreviewProps {
  uri: string;
  imageWidth: number;
  imageHeight: number;
  regions: DetectedTextRegion[];
  style: RedactStyle;
}

/**
 * Shows the image with its redactions drawn over it.
 *
 * Without this the only feedback is a list of matched strings, which gives the
 * user no way to check that a box actually covers the value it claims to — the
 * one thing worth verifying before sharing a redacted document.
 *
 * Boxes are positioned against the letterboxed rect that `resizeMode="contain"`
 * produces, not the container, so they track the image rather than the frame.
 */
export const RedactionPreview: React.FC<RedactionPreviewProps> = ({
  uri,
  imageWidth,
  imageHeight,
  regions,
  style,
}) => {
  const [frame, setFrame] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrame({ width, height });
  };

  const ready =
    frame.width > 0 && frame.height > 0 && imageWidth > 0 && imageHeight > 0;
  const scale = ready
    ? Math.min(frame.width / imageWidth, frame.height / imageHeight)
    : 0;
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;
  const offsetX = (frame.width - renderedWidth) / 2;
  const offsetY = (frame.height - renderedHeight) / 2;

  return (
    <View className="h-full w-full" onLayout={onLayout}>
      <Image source={{ uri }} className="h-full w-full" resizeMode="contain" />
      {ready
        ? regions
            .filter((region) => region.isRedacted)
            .map((region) => (
              <View
                key={region.id}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  position: "absolute",
                  left: offsetX + region.box.x * scale,
                  top: offsetY + region.box.y * scale,
                  width: region.box.width * scale,
                  height: region.box.height * scale,
                  backgroundColor: FILL_COLOR[style],
                }}
              />
            ))
        : null}
    </View>
  );
};
