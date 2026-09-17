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
// The imperative `router`, not `useRouter()`. This screen's only navigation
// happens after `await`ing the picker, an image re-encode and an OCR pass, and
// by then the context the hook captured at render can be gone -- iOS tears the
// presenting view down around a PHPicker. The hook's router reads navigation
// context on use and throws "Couldn't find a navigation context" from a getKey
// getter; the imperative router holds no context and is the API expo-router
// provides for navigating from outside a render.
import { router } from "expo-router";
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
import { useTabletColumn } from "../src/theme/useTabletColumn";
import { t } from "../src/i18n";
import { ForwardArrow } from '../src/components/DirectionalIcons';
import { AdBanner } from '../src/components/AdBanner';
import { useAdsStore } from '../src/store/adsStore';
import { showPrivacyOptionsForm } from '../src/services/ads';

export default function HomeScreen() {
  // Google requires a persistent entry back into the consent form wherever UMP reports that
  // privacy options are available, which in practice means the EEA and the regulated US
  // states. It is absent everywhere else rather than shown as a dead control.
  const offerPrivacyOptions = useAdsStore((state) => state.consent.offerPrivacyOptions);
  const theme = useTheme();
  const tabletColumn = useTabletColumn();
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
        contentContainerStyle={{ paddingBottom: 32 , ...tabletColumn,
          // A fixed block, not a list that grows, so it is centred when there
          // is slack. On a 13" iPad these screens sat at the top with a third
          // or more of the display empty beneath them. Deliberately not applied
          // to packpixel or gridhabit, whose home screens hold a list the user
          // adds to -- centring a growing list leaves it floating with dead
          // space above and below.
          flexGrow: 1,
          justifyContent: 'center',
        }}
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
        {/* Styles here, not classNames.
 
            Importing a photo crashed the app with "Couldn't find a navigation
            context". Isolated by the capture session over six cuts: it is not
            the navigation, not the state updates and not the native OCR
            (which still runs in the passing cut) -- it is `setLoading(true)`
            swapping THIS branch in. A NativeWind-wrapped component mounting
            during that re-render reads the navigation getter outside its
            provider; react-native-css-interop is the `api.js` frame in the
            stack.
 
            It is not that NativeWind is broken here -- 37 classNames elsewhere
            in this file are fine. It is a wrapped component MOUNTING inside the
            branch the loading flag swaps in. Replacing the branch with a bare
            View also fixed it, and moving only the ActivityIndicator's
            className did not: any of the wrapped elements will do it.
 
            Same visual result, same elements, same strings. */}
        {loading ? (
          <View
            style={{
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
              borderWidth: 1,
              borderRadius: 24,
              padding: 40,
              alignItems: "center",
              justifyContent: "center",
              marginVertical: 12,
            }}
          >
            <ActivityIndicator
              size="large"
              color={theme.primary}
              style={{ marginBottom: 16 }}
            />
            <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16 }}>
              {t("runningOcr")}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 12,
                textAlign: "center",
                marginTop: 4,
                maxWidth: 320,
              }}
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
        {offerPrivacyOptions ? (
          <TouchableOpacity
            onPress={() => {
              void showPrivacyOptionsForm();
            }}
            accessibilityRole="button"
            className="mt-2 py-3 items-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-xs font-semibold underline" style={{ color: theme.textSecondary }}>
              {t('adPrivacySettings')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {/* Anchored below the scroll area rather than inside it: a banner that scrolls with the
          content can sit under a finger reaching for the button above it. */}
      <AdBanner />
    </SafeAreaView>
  );
}
