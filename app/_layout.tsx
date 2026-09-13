import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text } from 'react-native';
import { Crown } from 'lucide-react-native';
import { initPurchases, checkIsPro } from '../src/services/purchases';
import { useRedactStore } from '../src/store/useRedactStore';
import { useTheme } from '../src/theme/useTheme';
import { t } from '../src/i18n';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const { isPro, setIsPro } = useRedactStore();
  const theme = useTheme();

  useEffect(() => {
    initPurchases();
    checkIsPro().then((pro) => setIsPro(pro));
  }, []);

  return (
    <>
      <StatusBar style={theme.statusBarStyle} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.headerBackground },
          headerTintColor: theme.headerTintColor,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.background },
          headerRight: () =>
            !isPro ? (
              <TouchableOpacity
                onPress={() => router.push('/paywall')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  backgroundColor: theme.warningLight,
                  borderColor: theme.warning,
                }}
                className="border px-3 py-1.5 rounded-full flex-row items-center"
              >
                <Crown size={14} color={theme.warning} />
                <Text style={{ color: theme.warning }} className="text-xs font-bold ml-1.5">
                  {t('proBadge')}
                </Text>
              </TouchableOpacity>
            ) : null,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: t('appName'),
            headerTitleAlign: 'left',
          }}
        />
        <Stack.Screen
          name="censor"
          options={{
            title: t('censorTitle'),
            headerBackTitle: t('back'),
          }}
        />
        <Stack.Screen
          name="export"
          options={{
            title: t('exportTitle'),
            headerBackTitle: t('back'),
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            title: t('paywallTitle'),
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
