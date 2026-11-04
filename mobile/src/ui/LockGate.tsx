import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand, fonts } from '../core/theme';
import { useAuth } from '../state/auth';
import { useLock } from '../state/lock';

/** Recouvre l'application tant qu'elle est verrouillée. Aucun contenu de la boîte n'est affiché ni accessible dessous. */
export function LockGate({ children }: { children: React.ReactNode }) {
  const lock = useLock();
  const signedIn = useAuth((s) => s.status === 'signedIn');
  const prompted = useRef(false);
  const covered = signedIn && (!lock.loaded || lock.locked) && (lock.enabled || !lock.loaded);

  useEffect(() => { useLock.getState().load(); }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' || s === 'inactive') useLock.getState().onBackground();
      if (s === 'active') useLock.getState().onForeground();
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!covered) { prompted.current = false; return; }
    if (lock.loaded && !prompted.current) { prompted.current = true; useLock.getState().unlock(); } // invite automatique
  }, [covered, lock.loaded]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {covered && (
        <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
          <LinearGradient colors={[...Brand.gradient]} locations={[...Brand.gradientStops]} style={StyleSheet.absoluteFill} />
          <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Image source={require('../../assets/brand/logo/freda-workspace-symbol-reverse.png')} style={{ width: 92, height: 92 }} contentFit="contain" />
            <Text style={{ color: '#fff', fontSize: 24, fontFamily: fonts.headXBold, marginTop: 26, textAlign: 'center' }}>Freda Mail est verrouillé</Text>
            <Text style={{ color: '#ffffffbf', marginTop: 10, fontFamily: fonts.regular }}>Vos messages sont protégés.</Text>
            {lock.loaded && (
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); useLock.getState().unlock(); }} accessibilityRole="button" style={{ marginTop: 30, backgroundColor: '#fff', minWidth: 230, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: Brand.deep, fontFamily: fonts.bold, fontSize: 16 }}>Déverrouiller</Text>
              </Pressable>
            )}
            {lock.message && <Text style={{ color: Brand.amber, fontFamily: fonts.semibold, marginTop: 16, textAlign: 'center' }}>{lock.message}</Text>}
            {lock.loaded && (
              <Pressable onPress={() => useAuth.getState().logout()} accessibilityRole="button" style={{ marginTop: 18, padding: 10 }}>
                <Text style={{ color: '#ffffffcc', fontFamily: fonts.medium }}>Se déconnecter de ce compte</Text>
              </Pressable>
            )}
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}
