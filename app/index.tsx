import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  ShieldAlert,
  Sparkles,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import { useRedactStore } from '../src/store/useRedactStore';
import { scanImageForPii } from '../src/vision/ocrScanner';

export default function HomeScreen() {
  const router = useRouter();
  const { setImage, setRegions, setIsScanning } = useRedactStore();
  const [loading, setLoading] = useState(false);

  const processImage = async (uri: string, width: number, height: number) => {
    try {
      setLoading(true);
      setIsScanning(true);
      setImage(uri, width, height);

      // Perform local OCR text scanning
      const detected = await scanImageForPii(uri, width, height);
      setRegions(detected);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/censor');
    } catch (err: any) {
      Alert.alert('Processing Error', err?.message || 'Failed to scan image for PII.');
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  const handlePickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processImage(asset.uri, asset.width || 1080, asset.height || 1920);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library.');
    }
  };

  const handleCaptureCamera = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to capture documents.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processImage(asset.uri, asset.width || 1080, asset.height || 1920);
      }
    } catch {
      Alert.alert('Error', 'Could not launch camera.');
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-950 px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header Hero */}
        <View className="mt-4 mb-6">
          <View className="inline-flex self-start bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full mb-3 flex-row items-center">
            <Sparkles size={12} color="#FB7185" />
            <Text className="text-rose-400 text-xs font-semibold ml-1.5">
              Destructive On-Device Censor
            </Text>
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-tight">
            Permanent PII Blackout
          </Text>
          <Text className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Never use transparent highlighters. RedactPro permanently destroys pixels containing
            credit cards, bank accounts, emails, and faces.
          </Text>
        </View>

        {/* Action Import Cards */}
        {loading ? (
          <View className="border border-slate-800 bg-slate-900 rounded-3xl p-10 items-center justify-center my-3">
            <ActivityIndicator size="large" color="#FB7185" className="mb-4" />
            <Text className="text-white font-bold text-base">Running On-Device Vision OCR</Text>
            <Text className="text-slate-400 text-xs text-center mt-1 max-w-xs">
              Locating payment cards, IBANs, and sensitive coordinates in memory...
            </Text>
          </View>
        ) : (
          <View className="space-y-3 mb-6">
            <TouchableOpacity
              onPress={handlePickImage}
              activeOpacity={0.85}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="bg-rose-500/15 p-3.5 rounded-2xl mr-3.5">
                  <ImageIcon size={26} color="#FB7185" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">Import Screenshot or Photo</Text>
                  <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    Select banking app screenshots, contracts, receipts, or IDs
                  </Text>
                </View>
              </View>
              <ArrowRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCaptureCamera}
              activeOpacity={0.85}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-3">
                <View className="bg-blue-500/15 p-3.5 rounded-2xl mr-3.5">
                  <Camera size={26} color="#60A5FA" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">Scan Physical Document</Text>
                  <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    Snap IDs, passports, or medical records directly
                  </Text>
                </View>
              </View>
              <ArrowRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* Security & Architectural Guarantees */}
        <View className="mt-4 space-y-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Architectural Guarantees
          </Text>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start mb-3">
            <View className="bg-rose-500/10 p-2 rounded-xl mr-3">
              <Zap size={18} color="#FB7185" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">True Pixel Destruction</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Replaces underlying pixels with opaque hex values and re-encodes to a single-layer
                bitmap. Redactions cannot be reversed with image brightness tricks.
              </Text>
            </View>
          </View>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start mb-3">
            <View className="bg-emerald-500/10 p-2 rounded-xl mr-3">
              <ShieldCheck size={18} color="#34D399" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">100% Offline OCR</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Optical character recognition runs entirely on local device hardware. Your private
                files never touch any external server.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
