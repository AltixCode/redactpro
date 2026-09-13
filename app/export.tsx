import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import { ShieldCheck, Share2, Download, RotateCcw } from "lucide-react-native";
import { useRedactStore } from "../src/store/useRedactStore";
import { persistRedactedImage, saveToPhotos } from "../src/engine/rasterizer";
import { useRedactionComposer } from "../src/engine/redactionComposer";
import { PrivacyBadge } from "../src/components/PrivacyBadge";
import { useTheme } from "../src/theme/useTheme";
import { t } from "../src/i18n";

export default function ExportScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    imageUri,
    imageWidth,
    imageHeight,
    regions,
    redactStyle,
    exportedUri,
    setExportedUri,
    reset,
  } = useRedactStore();

  const { ComposerPortal, compose } = useRedactionComposer();
  const composeRef = useRef(compose);
  composeRef.current = compose;

  const [loading, setLoading] = useState(true);
  const [savedToRoll, setSavedToRoll] = useState(false);

  useEffect(() => {
    if (!imageUri) {
      router.replace("/");
      return;
    }

    const runRasterization = async () => {
      try {
        setLoading(true);
        const composedUri = await composeRef.current({
          uri: imageUri,
          imageWidth,
          imageHeight,
          regions,
          style: redactStyle,
        });
        const resultPath = await persistRedactedImage(composedUri);
        setExportedUri(resultPath);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        Alert.alert(
          t("exportError"),
          (err as { message?: string })?.message || t("exportErrorDesc"),
        );
      } finally {
        setLoading(false);
      }
    };

    runRasterization();
  }, []);

  const handleShare = async () => {
    if (exportedUri) {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportedUri);
      }
    }
  };

  const handleSaveToLibrary = async () => {
    if (exportedUri) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const success = await saveToPhotos(exportedUri);
      if (success) {
        setSavedToRoll(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t("savedSuccess"), t("savedSuccessDesc"));
      } else {
        Alert.alert(t("permissionDenied"), t("permissionDeniedDesc"));
      }
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.replace("/");
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.background }}
      className="px-5 py-4 justify-center items-center"
    >
      {ComposerPortal}
      {loading ? (
        <View className="items-center">
          <ActivityIndicator
            size="large"
            color={theme.primary}
            className="mb-4"
          />
          <Text style={{ color: theme.text }} className="font-bold text-base">
            {t("destroyingPixels")}
          </Text>
          <Text
            style={{ color: theme.textSecondary }}
            className="text-xs text-center mt-1 max-w-xs"
          >
            {t("destroyingPixelsDesc")}
          </Text>
        </View>
      ) : (
        <View className="w-full items-center">
          {/* Output Preview */}
          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            className="w-full h-64 border rounded-3xl overflow-hidden mb-4 relative justify-center items-center shadow-sm"
          >
            {exportedUri ? (
              <Image
                source={{ uri: exportedUri }}
                className="w-full h-full"
                resizeMode="contain"
              />
            ) : null}
            <View className="absolute bottom-2 right-2 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-full flex-row items-center">
              <ShieldCheck size={12} color={theme.success} />
              <Text
                style={{ color: theme.success }}
                className="text-[10px] font-bold ml-1"
              >
                {t("flattenedBitmap")}
              </Text>
            </View>
          </View>

          {/* Privacy Verification Badge */}
          <View className="w-full mb-6">
            <PrivacyBadge />
          </View>

          {/* Action Buttons */}
          <View className="w-full flex-col gap-3 mb-6">
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              className="w-full py-4 rounded-2xl flex-row items-center justify-center mb-3 min-h-[50px]"
            >
              <Share2 size={18} color={theme.onPrimary} />
              <Text
                style={{ color: theme.onPrimary }}
                className="font-bold text-base ml-2"
              >
                {t("shareRedacted")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveToLibrary}
              disabled={savedToRoll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
                opacity: savedToRoll ? 0.7 : 1,
              }}
              className="w-full py-3.5 rounded-2xl flex-row items-center justify-center border min-h-[48px]"
            >
              <Download
                size={18}
                color={savedToRoll ? theme.success : theme.text}
              />
              <Text
                style={{ color: savedToRoll ? theme.success : theme.text }}
                className="font-semibold text-sm ml-2"
              >
                {savedToRoll ? t("savedToPhotos") : t("saveToRoll")}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleDone}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="flex-row items-center py-3 min-h-[44px]"
          >
            <RotateCcw size={14} color={theme.textMuted} />
            <Text
              style={{ color: theme.textSecondary }}
              className="text-xs font-semibold ml-1.5"
            >
              {t("redactAnother")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
