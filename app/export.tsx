import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import {
  ShieldCheck,
  Share2,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { useRedactStore } from '../src/store/useRedactStore';
import { rasterizeRedactions, saveToPhotos } from '../src/engine/rasterizer';
import { PrivacyBadge } from '../src/components/PrivacyBadge';
import { t } from '../src/i18n';

export default function ExportScreen() {
  const router = useRouter();
  const { imageUri, regions, redactStyle, exportedUri, setExportedUri, reset } = useRedactStore();

  const [loading, setLoading] = useState(true);
  const [savedToRoll, setSavedToRoll] = useState(false);

  useEffect(() => {
    if (!imageUri) {
      router.replace('/');
      return;
    }

    const runRasterization = async () => {
      try {
        setLoading(true);
        const resultPath = await rasterizeRedactions(imageUri, regions, redactStyle);
        setExportedUri(resultPath);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err: any) {
        Alert.alert(t('exportError'), err?.message || t('exportErrorDesc'));
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
        Alert.alert(t('savedSuccess'), t('savedSuccessDesc'));
      } else {
        Alert.alert(t('permissionDenied'), t('permissionDeniedDesc'));
      }
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-slate-950 px-5 py-4 justify-center items-center">
      {loading ? (
        <View className="items-center">
          <ActivityIndicator size="large" color="#FB7185" className="mb-4" />
          <Text className="text-white font-bold text-base">{t('destroyingPixels')}</Text>
          <Text className="text-slate-400 text-xs text-center mt-1 max-w-xs">
            {t('destroyingPixelsDesc')}
          </Text>
        </View>
      ) : (
        <View className="w-full items-center">
          {/* Output Preview */}
          <View className="w-full h-64 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mb-4 relative justify-center items-center">
            {exportedUri ? (
              <Image source={{ uri: exportedUri }} className="w-full h-full" resizeMode="contain" />
            ) : null}
            <View className="absolute bottom-2 right-2 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-full flex-row items-center">
              <ShieldCheck size={12} color="#34D399" />
              <Text className="text-emerald-400 text-[10px] font-bold ml-1">{t('flattenedBitmap')}</Text>
            </View>
          </View>

          {/* Privacy Verification Badge */}
          <View className="w-full mb-6">
            <PrivacyBadge />
          </View>

          {/* Action Buttons */}
          <View className="w-full space-y-3 mb-6">
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              className="w-full bg-rose-600 active:bg-rose-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-rose-500/20 mb-3"
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-2">{t('shareRedacted')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSaveToLibrary}
              disabled={savedToRoll}
              className={`w-full py-3.5 rounded-2xl flex-row items-center justify-center border ${
                savedToRoll
                  ? 'bg-slate-900 border-slate-800 opacity-60'
                  : 'bg-slate-900 border-slate-700'
              }`}
            >
              <Download size={18} color={savedToRoll ? '#34D399' : '#FFFFFF'} />
              <Text
                className={`font-semibold text-sm ml-2 ${
                  savedToRoll ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {savedToRoll ? t('savedToPhotos') : t('saveToRoll')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleDone}
            className="flex-row items-center py-2"
          >
            <RotateCcw size={14} color="#94A3B8" />
            <Text className="text-slate-400 text-xs font-semibold ml-1.5">
              {t('redactAnother')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
