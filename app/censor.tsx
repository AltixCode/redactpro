import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  Lock,
} from 'lucide-react-native';
import { useRedactStore, RedactStyle } from '../src/store/useRedactStore';
import { RedactionBox } from '../src/components/RedactionBox';
import { PaywallModal } from '../src/components/PaywallModal';

export default function CensorScreen() {
  const router = useRouter();
  const {
    imageUri,
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
    { id: 'black', label: 'Solid Black' },
    { id: 'pixelate', label: 'Pixelate Mosaic', isProOnly: true },
    { id: 'white', label: 'Inverted White', isProOnly: true },
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
    <View className="flex-1 bg-slate-950 px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Document Thumbnail Preview */}
        <View className="w-full h-48 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden my-4 relative justify-center items-center">
          <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="contain" />
          <View className="absolute top-2 right-2 bg-black/75 px-2.5 py-1 rounded-full border border-slate-700">
            <Text className="text-white text-[10px] font-mono">
              {activeCount} active redactions
            </Text>
          </View>
        </View>

        {/* 1-Tap Auto Redact Pro Banner */}
        <TouchableOpacity
          onPress={handleAutoRedact}
          activeOpacity={0.8}
          className="bg-gradient-to-r from-rose-950 to-slate-900 border border-rose-900/60 p-4 rounded-2xl mb-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="bg-rose-500/20 p-2 rounded-xl mr-2.5">
              <Sparkles size={18} color="#FB7185" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">Auto-Redact All Detected PII</Text>
              <Text className="text-rose-200/70 text-xs mt-0.5">
                Automatically black out all payment cards, IBANs & phones
              </Text>
            </View>
          </View>

          {!isPro ? (
            <View className="bg-amber-500/20 px-2 py-1 rounded-lg flex-row items-center">
              <Lock size={12} color="#F59E0B" />
              <Text className="text-amber-400 text-[10px] font-bold ml-1">PRO</Text>
            </View>
          ) : (
            <View className="bg-rose-600 px-3 py-1 rounded-lg">
              <Text className="text-white text-xs font-bold">Apply</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Censor Aesthetic Selector */}
        <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl mb-5">
          <View className="flex-row items-center mb-3">
            <Sliders size={16} color="#FB7185" />
            <Text className="text-white font-bold text-sm ml-2">Redaction Aesthetic</Text>
          </View>
          <View className="flex-row space-x-2">
            {styles.map((s) => {
              const isSelected = redactStyle === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => handleSelectStyle(s.id, s.isProOnly)}
                  className={`flex-1 p-2.5 rounded-xl border items-center mr-1 ${
                    isSelected ? 'bg-rose-950/40 border-rose-500' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <Text className={`text-xs font-bold ${isSelected ? 'text-rose-400' : 'text-slate-400'}`}>
                    {s.label}
                  </Text>
                  {s.isProOnly && !isPro && (
                    <View className="mt-1 flex-row items-center">
                      <Lock size={10} color="#F59E0B" />
                      <Text className="text-amber-400 text-[8px] font-bold ml-0.5">PRO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Detected PII Entity Regions List */}
        <View className="mb-6">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Detected Sensitive Entities ({regions.length})
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
          className="bg-rose-600 active:bg-rose-500 p-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-rose-500/20"
        >
          <ShieldAlert size={20} color="#FFFFFF" />
          <Text className="text-white font-bold text-base ml-2 mr-2">
            Burn & Flatten {activeCount} Redactions
          </Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
