import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  EyeOff,
  Layers,
  Check,
  X,
} from 'lucide-react-native';
import { useRedactStore } from '../store/useRedactStore';
import { usePaywall } from '../hooks/usePaywall';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../config/legal';
import { useTheme } from '../theme/useTheme';
import { t } from '../i18n';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { ctaLabel, loading, errorMsg, handlePurchase, handleRestore } =
    usePaywall(onClose);

  const features = [
    {
      icon: <Zap size={20} color={theme.accent} />,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
    },
    {
      icon: <EyeOff size={20} color={theme.purple} />,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
    },
    {
      icon: <Layers size={20} color={theme.warning} />,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
    },
    {
      icon: <ShieldCheck size={20} color={theme.success} />,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopColor: theme.cardBorder,
          }}
          className="border-t rounded-t-3xl p-6 max-h-[90%] shadow-2xl"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: theme.primaryLight,
                  borderColor: theme.primaryBorder,
                }}
                className="border p-2 rounded-xl"
              >
                <Sparkles size={20} color={theme.primary} />
              </View>
              <Text style={{ color: theme.text }} className="text-xl font-extrabold ml-2.5">
                {t('paywallTitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ backgroundColor: theme.controlSurface }}
              className="p-2 rounded-full"
            >
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Anti-Subscription Banner */}
          <View
            style={{
              backgroundColor: theme.primaryLight,
              borderColor: theme.primaryBorder,
            }}
            className="border p-4 rounded-2xl mb-5"
          >
            <Text style={{ color: theme.primary }} className="text-xs font-bold uppercase tracking-wider mb-1">
              {t('antiSubTitle')}
            </Text>
            <Text style={{ color: theme.text }} className="text-sm font-semibold leading-snug">
              {t('antiSubHeadline')}
            </Text>
          </View>

          {/* Features List */}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-col gap-3.5 mb-5">
            {features.map((f, i) => (
              <View key={i} className="flex-row items-start mb-3.5">
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  }}
                  className="p-2 rounded-xl border mr-3 shadow-sm"
                >
                  {f.icon}
                </View>
                <View className="flex-1">
                  <Text style={{ color: theme.text }} className="text-sm font-bold">{f.title}</Text>
                  <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5 leading-relaxed">{f.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {errorMsg && (
            <Text style={{ color: theme.danger }} className="text-xs text-center mb-3 font-medium">{errorMsg}</Text>
          )}

          {/* Purchase Button */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
            className="p-4 rounded-2xl items-center flex-row justify-center min-h-[52px]"
          >
            {loading ? (
              <ActivityIndicator color={theme.onPrimary} />
            ) : (
              <>
                <Text style={{ color: theme.onPrimary }} className="font-extrabold text-base mr-2">
                  {ctaLabel}
                </Text>
                <Check size={18} color={theme.onPrimary} strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>

          {/* Restore & Policy Links */}
          <View className="flex-row items-center justify-center gap-6 mt-4">
            <TouchableOpacity
              onPress={handleRestore}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: theme.textSecondary }} className="text-xs underline font-medium">
                {t('restorePurchases')}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: theme.textMuted }} className="text-xs">•</Text>
            <Text style={{ color: theme.textMuted }} className="text-xs font-medium">
              {t('oneTimePayment')}
            </Text>
          </View>
        <View className="mt-3 flex-row items-center justify-center gap-5">
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
            accessibilityRole="link"
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text style={{ color: theme.textMuted }} className="text-xs underline">
              {t('termsOfUse')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text style={{ color: theme.textMuted }} className="text-xs underline">
              {t('privacyPolicy')}
            </Text>
          </TouchableOpacity>
        </View>

        </View>
      </View>
    </Modal>
  );
};
