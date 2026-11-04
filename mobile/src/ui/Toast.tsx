import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, usePalette } from '../core/theme';
import { useToast } from '../state/toast';

/** Barre d'information en bas de l'écran (envoi annulable, erreurs, confirmations). */
export function ToastHost() {
  const t = useToast((s) => s.toast);
  const p = usePalette();
  const insets = useSafeAreaInsets();
  if (!t) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
      <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: p.dark ? '#E8EEFF' : '#0B1533', borderRadius: 14, paddingVertical: 12, paddingLeft: 16, paddingRight: 8, elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
        <Text style={{ flex: 1, color: p.dark ? '#0B1533' : '#fff', fontFamily: fonts.medium, fontSize: 14 }}>{t.text}</Text>
        {t.action && (
          <Pressable onPress={() => { t.action!.run(); useToast.getState().hide(); }} hitSlop={8} style={{ paddingHorizontal: 12, paddingVertical: 6 }} accessibilityRole="button">
            <Text style={{ color: p.dark ? '#2B64E4' : '#4A95F5', fontFamily: fonts.bold, fontSize: 14 }}>{t.action.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
