import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { t } from '../i18n';

export const PrivacyBadge: React.FC = () => {
  return (
    <View className="bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-xl flex-row items-center">
      <ShieldCheck size={16} color="#34D399" />
      <View className="ml-2 flex-1">
        <Text className="text-emerald-400 text-xs font-bold">{t('gdprSafeDestruction')}</Text>
        <Text className="text-emerald-300/70 text-[10px]">
          {t('gdprSafeDesc')}
        </Text>
      </View>
    </View>
  );
};
