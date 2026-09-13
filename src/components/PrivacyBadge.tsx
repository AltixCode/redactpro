import React from 'react';
import { View, Text } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { t } from '../i18n';

export const PrivacyBadge: React.FC = () => {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.successLight,
        borderColor: theme.success,
      }}
      className="border px-3.5 py-2.5 rounded-xl flex-row items-center shadow-sm"
    >
      <ShieldCheck size={18} color={theme.success} />
      <View className="ml-2.5 flex-1">
        <Text style={{ color: theme.success }} className="text-xs font-bold">{t('gdprSafeDestruction')}</Text>
        <Text style={{ color: theme.textSecondary }} className="text-[11px] mt-0.5">
          {t('gdprSafeDesc')}
        </Text>
      </View>
    </View>
  );
};
