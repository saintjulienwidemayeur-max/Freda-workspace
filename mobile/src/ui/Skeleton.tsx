import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { usePalette } from '../core/theme';

/** Squelette de liste pendant le chargement (pulsation douce) : l'écran n'est jamais vide ni figé. */
export function MailListSkeleton({ count = 7 }: { count?: number }) {
  const p = usePalette();
  const a = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 1000, useNativeDriver: true }), Animated.timing(a, { toValue: 0.55, duration: 1000, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const base = p.dark ? '#16213F' : '#E6ECF7';
  const bar = (w: number | string, h: number) => <Animated.View style={{ width: w as any, height: h, borderRadius: 6, backgroundColor: base, opacity: a }} />;
  return (
    <View accessibilityLabel="Chargement du courrier" accessible>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 12 }}>
          <Animated.View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: base, opacity: a }} />
          <View style={{ flex: 1, marginLeft: 14, gap: 9 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{bar(130, 13)}{bar(36, 11)}</View>
            {bar(210 - (i % 3) * 30, 13)}
            {bar('100%', 11)}
          </View>
        </View>
      ))}
    </View>
  );
}
