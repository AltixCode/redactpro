import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react-native';
import { DetectedTextRegion } from '../vision/ocrScanner';

interface RedactionBoxProps {
  region: DetectedTextRegion;
  onToggle: (id: string) => void;
}

export const RedactionBox: React.FC<RedactionBoxProps> = ({ region, onToggle }) => {
  const { box, isRedacted, piiType, text } = region;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(region.id);
  };

  const getPiiBadge = () => {
    switch (piiType) {
      case 'credit_card':
        return 'Card';
      case 'iban':
        return 'IBAN';
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone';
      default:
        return 'PII';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      className={`p-3 rounded-xl border mb-2.5 flex-row items-center justify-between ${
        isRedacted
          ? 'bg-slate-900 border-rose-500/50'
          : 'bg-slate-950 border-slate-800 opacity-60'
      }`}
    >
      <View className="flex-row items-center flex-1 mr-3">
        {isRedacted ? (
          <View className="bg-rose-500/20 p-2 rounded-lg mr-2.5">
            <ShieldAlert size={16} color="#F43F5E" />
          </View>
        ) : (
          <View className="bg-slate-800 p-2 rounded-lg mr-2.5">
            <Eye size={16} color="#94A3B8" />
          </View>
        )}

        <View className="flex-1">
          <View className="flex-row items-center">
            {piiType && (
              <View className="bg-rose-500/30 px-1.5 py-0.5 rounded mr-2">
                <Text className="text-rose-300 text-[10px] font-bold uppercase">
                  {getPiiBadge()}
                </Text>
              </View>
            )}
            <Text className="text-white font-mono text-xs" numberOfLines={1}>
              {isRedacted ? '████████████' : text}
            </Text>
          </View>
          <Text className="text-slate-500 text-[10px] mt-0.5">
            {isRedacted ? 'Will be permanently blacked out' : 'Preserved in export'}
          </Text>
        </View>
      </View>

      <View
        className={`px-2.5 py-1 rounded-lg border ${
          isRedacted ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-slate-700'
        }`}
      >
        <Text className="text-white text-xs font-bold">
          {isRedacted ? 'Redacted' : 'Keep'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
