import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Sliders,
  Lock,
} from 'lucide-react-native';
import { useRedactStore, RedactStyle } from '../src/store/useRedactStore';
import { RedactionBox } from '../src/components/RedactionBox';
import { PaywallModal } from '../src/components/PaywallModal';
import { useTheme } from '../src/theme/useTheme';
import { RedactionPreview } from '../src/components/RedactionPreview';
import { t } from '../src/i18n';

export default function CensorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const {
    imageUri,
    imageWidth,
    imageHeight,
    regions,
    redactStyle,
    isPro,
    toggleRedaction,
    autoRedactAll,
    setRedactStyle,
  } = useRedactStore();

  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!imageUri) {
    router.replace('/');
    return null;
  }

  const styles: Array<{ id: RedactStyle; label: string; isProOnly?: boolean }> = [
    { id: 'black', label: t('solidBlack') },
    { id: 'pixelate', label: t('pixelateMosaic'), isProOnly: true },
    { id: 'white', label: t('invertedWhite'), isProOnly: true },
  ];

  const handleSelectStyle = (s: RedactStyle, isProOnly?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isProOnly && !isPro) {
      setPaywallVisible(true);
      return;
    }
    setRedactStyle(s);
  };

  const handleAutoRedact = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPro) {
      setPaywallVisible(true);
      return;
    }
    autoRedactAll();
  };

  const handleProceed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/export');
  };

  const activeCount = regions.filter((r) => r.isRedacted).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Document Thumbnail Preview */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          className="w-full h-48 border rounded-2xl overflow-hidden my-4 relative justify-center items-center shadow-sm"
        >
          <RedactionPreview
            uri={imageUri}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            regions={regions}
            style={redactStyle}
          />
          <View className="absolute top-2 right-2 bg-black/75 px-2.5 py-1 rounded-full border border-slate-700">
            <Text className="text-white text-[10px] font-mono">
              {t('activeRedactions', { count: activeCount })}
            </Text>
          </View>
        </View>

        {/* 1-Tap Auto Redact Pro Banner */}
        <TouchableOpacity
          onPress={handleAutoRedact}
          activeOpacity={0.8}
          style={{
            backgroundColor: theme.primaryLight,
            borderColor: theme.primaryBorder,
          }}
          className="border p-4 rounded-2xl mb-4 flex-row items-center justify-between shadow-sm"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View style={{ backgroundColor: theme.primaryLight }} className="p-2 rounded-xl mr-2.5">
              <Sparkles size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text style={{ color: theme.text }} className="font-bold text-sm">{t('autoRedactTitle')}</Text>
              <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5">
                {t('autoRedactDesc')}
              </Text>
            </View>
          </View>

          {!isPro ? (
            <View style={{ backgroundColor: theme.warningLight }} className="px-2.5 py-1 rounded-lg flex-row items-center border border-amber-500/30">
              <Lock size={12} color={theme.warning} />
              <Text style={{ color: theme.warning }} className="text-[10px] font-bold ml-1">{t('proBadge')}</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: theme.primary }} className="px-3 py-1.5 rounded-lg">
              <Text style={{ color: theme.onPrimary }} className="text-xs font-bold">{t('apply')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Censor Aesthetic Selector */}
        <View
          style={{
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }}
          className="border p-4 rounded-2xl mb-5 shadow-sm"
        >
          <View className="flex-row items-center mb-3">
            <Sliders size={16} color={theme.primary} />
            <Text style={{ color: theme.text }} className="font-bold text-sm ml-2">{t('censorAesthetic')}</Text>
          </View>
          <View className="flex-row space-x-2">
            {styles.map((s) => {
              const isSelected = redactStyle === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => handleSelectStyle(s.id, s.isProOnly)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={{
                    backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  }}
                  className="flex-1 p-2.5 rounded-xl border items-center mr-1"
                >
                  <Text
                    style={{ color: isSelected ? theme.primary : theme.textSecondary }}
                    className="text-xs font-bold"
                  >
                    {s.label}
                  </Text>
                  {s.isProOnly && !isPro && (
                    <View className="mt-1 flex-row items-center">
                      <Lock size={10} color={theme.warning} />
                      <Text style={{ color: theme.warning }} className="text-[8px] font-bold ml-0.5">{t('proBadge')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Detected PII Entity Regions List */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-3">
            {t('detectedEntities', { count: regions.length })}
          </Text>

          {regions.map((region) => (
            <RedactionBox
              key={region.id}
              region={region}
              onToggle={toggleRedaction}
            />
          ))}
        </View>

        {/* Proceed Action Button */}
        <TouchableOpacity
          onPress={handleProceed}
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
          className="p-4 rounded-2xl flex-row items-center justify-center min-h-[52px]"
        >
          <ShieldAlert size={20} color={theme.onPrimary} />
          <Text style={{ color: theme.onPrimary }} className="font-bold text-base ml-2 mr-2">
            {t('burnAndFlatten', { count: activeCount })}
          </Text>
          <ArrowRight size={18} color={theme.onPrimary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
