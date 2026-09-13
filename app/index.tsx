import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import {
  Sparkles,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { useRedactStore } from "../src/store/useRedactStore";
import { scanImageForPii } from "../src/vision/ocrScanner";
import { useTheme } from "../src/theme/useTheme";
import { t } from "../src/i18n";
import { ForwardArrow } from '../src/components/DirectionalIcons';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setImage, setRegions, setIsScanning } = useRedactStore();
  const [loading, setLoading] = useState(false);

  const processImage = async (uri: string) => {
    try {
      setLoading(true);
      setIsScanning(true);

      // Re-encode before anything reads coordinates from the image. A photo
      // carrying an EXIF orientation tag is stored rotated, and the picker,
      // the text recogniser and the exporter do not agree on whether that tag
      // has been applied — which lands every redaction box on the wrong axis.
      // Baking the rotation in leaves one unambiguous pixel grid for all three.
      const normalized = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      // The recogniser reports the dimensions it actually analysed; trusting
      // those over the picker's keeps boxes and image on one coordinate system.
      const scan = await scanImageForPii(normalized.uri);
      setImage(normalized.uri, scan.imageWidth, scan.imageHeight);
      setRegions([...scan.regions, ...scan.unmatchedLines]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/censor");
    } catch (err: any) {
      Alert.alert(
        t("processingError"),
        err?.message || t("processingErrorDesc"),
      );
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  const handlePickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processImage(asset.uri);
      }
    } catch {
      Alert.alert(t("error"), t("couldNotOpenPhoto"));
    }
  };

  const handleCaptureCamera = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t("cameraPermission"), t("cameraPermissionDesc"));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processImage(asset.uri);
      }
    } catch {
      Alert.alert(t("error"), t("couldNotLaunchCamera"));
    }
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: theme.background }}
      className="px-5"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header Hero */}
        <View className="mt-4 mb-6">
          <View
            style={{
              backgroundColor: theme.primaryLight,
              borderColor: theme.primaryBorder,
            }}
            className="self-start border px-3 py-1 rounded-full mb-3 flex-row items-center"
          >
            <Sparkles size={13} color={theme.primary} />
            <Text
              style={{ color: theme.primary }}
              className="text-xs font-semibold ml-1.5"
            >
              {t("heroBadge")}
            </Text>
          </View>
          <Text
            style={{ color: theme.text }}
            className="text-3xl font-extrabold tracking-tight"
          >
            {t("heroTitle")}
          </Text>
          <Text
            style={{ color: theme.textSecondary }}
            className="text-sm mt-1.5 leading-relaxed"
          >
            {t("heroSubtitle")}
          </Text>
        </View>

        {/* Action Import Cards */}
        {loading ? (
          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            className="border rounded-3xl p-10 items-center justify-center my-3 shadow-sm"
          >
            <ActivityIndicator
              size="large"
              color={theme.primary}
              className="mb-4"
            />
            <Text style={{ color: theme.text }} className="font-bold text-base">
              {t("runningOcr")}
            </Text>
            <Text
              style={{ color: theme.textSecondary }}
              className="text-xs text-center mt-1 max-w-xs"
            >
              {t("runningOcrDesc")}
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-3 mb-6">
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
              className="border rounded-3xl p-6 flex-row items-center justify-between mb-3 shadow-sm"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  style={{ backgroundColor: theme.primaryLight }}
                  className="p-3.5 rounded-2xl mr-3.5"
                >
                  <ImageIcon size={26} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ color: theme.text }}
                    className="font-bold text-base"
                  >
                    {t("importCardTitle")}
                  </Text>
                  <Text
                    style={{ color: theme.textSecondary }}
                    className="text-xs mt-0.5 leading-relaxed"
                  >
                    {t("importCardDesc")}
                  </Text>
                </View>
              </View>
              <ForwardArrow size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCaptureCamera}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              }}
              className="border rounded-3xl p-6 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View
                  style={{ backgroundColor: theme.accentLight }}
                  className="p-3.5 rounded-2xl mr-3.5"
                >
                  <Camera size={26} color={theme.accent} />
                </View>
                <View className="flex-1">
                  <Text
                    style={{ color: theme.text }}
                    className="font-bold text-base"
                  >
                    {t("scanCameraTitle")}
                  </Text>
                  <Text
                    style={{ color: theme.textSecondary }}
                    className="text-xs mt-0.5 leading-relaxed"
                  >
                    {t("scanCameraDesc")}
                  </Text>
                </View>
              </View>
              <ForwardArrow size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Security & Architectural Guarantees */}
        <View className="mt-4 flex-col gap-3">
          <Text
            style={{ color: theme.textMuted }}
            className="text-xs font-bold uppercase tracking-wider mb-2"
          >
            {t("archGuarantees")}
          </Text>

          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            className="border p-4 rounded-2xl flex-row items-start mb-3 shadow-sm"
          >
            <View
              style={{ backgroundColor: theme.primaryLight }}
              className="p-2 rounded-xl mr-3"
            >
              <Zap size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text style={{ color: theme.text }} className="font-bold text-sm">
                {t("pixelDestruction")}
              </Text>
              <Text
                style={{ color: theme.textSecondary }}
                className="text-xs mt-0.5 leading-relaxed"
              >
                {t("pixelDestructionDesc")}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            }}
            className="border p-4 rounded-2xl flex-row items-start shadow-sm"
          >
            <View
              style={{ backgroundColor: theme.successLight }}
              className="p-2 rounded-xl mr-3"
            >
              <ShieldCheck size={18} color={theme.success} />
            </View>
            <View className="flex-1">
              <Text style={{ color: theme.text }} className="font-bold text-sm">
                {t("offlineOcr")}
              </Text>
              <Text
                style={{ color: theme.textSecondary }}
                className="text-xs mt-0.5 leading-relaxed"
              >
                {t("offlineOcrDesc")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
