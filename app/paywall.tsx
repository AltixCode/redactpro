import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Zap,
  EyeOff,
  Layers,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react-native';
import { useRedactStore } from '../src/store/useRedactStore';
import { usePaywall } from '../src/hooks/usePaywall';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../src/config/legal';
import { useTheme } from '../src/theme/useTheme';
import { t } from '../src/i18n';

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { ctaLabel, loading, errorMsg, handlePurchase, handleRestore } =
    usePaywall(() => router.back());

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
    <View style={{ flex: 1, backgroundColor: theme.background }} className="px-6 py-4">
      {/* Top Header */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <View
            style={{
              backgroundColor: theme.primaryLight,
              borderColor: theme.primaryBorder,
            }}
            className="border p-2 rounded-xl mr-2.5"
          >
            <Sparkles size={20} color={theme.primary} />
          </View>
          <Text style={{ color: theme.text }} className="text-xl font-extrabold">{t('paywallTitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ backgroundColor: theme.controlSurface }}
          className="p-2 rounded-full"
        >
          <X size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Anti-Subscription Card */}
        <View
          style={{
            backgroundColor: theme.primaryLight,
            borderColor: theme.primaryBorder,
          }}
          className="border p-5 rounded-2xl mb-6 shadow-sm"
        >
          <Text style={{ color: theme.primary }} className="text-xs font-bold uppercase tracking-wider mb-1">
            {t('antiSubTitle')}
          </Text>
          <Text style={{ color: theme.text }} className="text-base font-bold leading-snug">
            {t('antiSubHeadline')}
          </Text>
          <Text style={{ color: theme.textSecondary }} className="text-xs mt-2 leading-relaxed">
            {t('antiSubDesc')}
          </Text>
        </View>

        {/* Features List */}
        <View className="space-y-4 mb-6">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-start mb-4">
              <View
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                }}
                className="p-2.5 rounded-xl border mr-3.5 shadow-sm"
              >
                {f.icon}
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-bold">{f.title}</Text>
                <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5 leading-relaxed">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {errorMsg && (
          <Text style={{ color: theme.danger }} className="text-xs text-center mb-3 font-medium">{errorMsg}</Text>
        )}
      </ScrollView>

      {/* Bottom CTA Area */}
      <View className="pt-2 pb-6">
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

        <View className="flex-row items-center justify-center space-x-6 mt-4">
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
  );
}
