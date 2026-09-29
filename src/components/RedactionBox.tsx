import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Eye, ShieldAlert } from "lucide-react-native";
import { DetectedTextRegion } from "../vision/ocrScanner";
import { getRegionActionLabel } from "../store/useRedactStore";
import { useTheme } from "../theme/useTheme";
import { t } from "../i18n";

interface RedactionBoxProps {
  region: DetectedTextRegion;
  onToggle: (id: string) => void;
}

export const RedactionBox: React.FC<RedactionBoxProps> = ({
  region,
  onToggle,
}) => {
  const theme = useTheme();
  const { isRedacted, piiType, text } = region;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(region.id);
  };

  const getPiiBadge = () => {
    switch (piiType) {
      case "credit_card":
        return t("card");
      case "iban":
        return t("iban");
      case "email":
        return t("email");
      case "phone":
        return t("phone");
      default:
        return t("pii");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={{
        backgroundColor: isRedacted ? theme.primaryLight : theme.card,
        borderColor: isRedacted ? theme.primary : theme.cardBorder,
        opacity: isRedacted ? 1 : 0.75,
      }}
      className="p-3 rounded-xl border mb-2.5 flex-row items-center justify-between min-h-[52px]"
    >
      <View className="flex-row items-center flex-1 mr-3">
        {isRedacted ? (
          <View
            style={{ backgroundColor: theme.primaryLight }}
            className="p-2 rounded-lg mr-2.5"
          >
            <ShieldAlert size={16} color={theme.primary} />
          </View>
        ) : (
          <View
            style={{ backgroundColor: theme.controlSurface }}
            className="p-2 rounded-lg mr-2.5"
          >
            <Eye size={16} color={theme.textMuted} />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center">
            {piiType && (
              <View
                style={{ backgroundColor: theme.primaryLight }}
                className="px-1.5 py-0.5 rounded mr-2"
              >
                <Text
                  style={{ color: theme.primary }}
                  className="text-[10px] font-bold uppercase"
                >
                  {getPiiBadge()}
                </Text>
              </View>
            )}
            <Text
              style={{ color: theme.text }}
              className="font-mono text-xs font-semibold"
              numberOfLines={1}
            >
              {isRedacted ? "████████████" : text}
            </Text>
          </View>
          <Text
            style={{ color: theme.textSecondary }}
            className="text-[10px] mt-0.5 font-medium"
          >
            {isRedacted ? t("willBeBlackedOut") : t("preservedInExport")}
          </Text>
        </View>
      </View>

      <View
        style={{
          // Same toggle either way -- the label and color must describe what
          // a tap does NEXT, not the region's current state. Not yet
          // redacted: tapping redacts it (destructive, shown in red).
          // Already redacted: tapping reverts it (neutral "Keep").
          backgroundColor: isRedacted ? theme.controlSurface : theme.primary,
          borderColor: isRedacted ? theme.cardBorder : theme.primary,
        }}
        className="px-2.5 py-1 rounded-lg border"
      >
        <Text
          style={{ color: isRedacted ? theme.textSecondary : theme.onPrimary }}
          className="text-xs font-bold"
        >
          {t(getRegionActionLabel(isRedacted))}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
