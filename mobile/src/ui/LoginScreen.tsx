import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidEmail } from '../core/format';
import { Brand, fonts } from '../core/theme';
import { MailError } from '../data/models';
import { useAuth } from '../state/auth';
import { useLock } from '../state/lock';

export function LoginScreen({ addMode = false }: { addMode?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pwRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  async function submit() {
    if (busy) return;
    if (!isValidEmail(email)) return setError('Entrez votre adresse complète, par exemple prenom@votredomaine.com.');
    if (!pw) return setError('Entrez votre mot de passe.');
    setError(null); setBusy(true);
    try {
      await (addMode ? useAuth.getState().addAccount(email, pw) : useAuth.getState().login(email, pw));
      useLock.getState().markUnlocked();
      router.replace('/');
    } catch (e) {
      setError(e instanceof MailError ? e.message : 'Connexion impossible pour le moment. Réessayez.');
    } finally { setBusy(false); }
  }

  const field = { height: 54, borderRadius: 14, overflow: 'hidden' as const, backgroundColor: '#F4F7FD', paddingHorizontal: 14, flexDirection: 'row' as const, alignItems: 'center' as const };
  return (
    <View style={{ flex: 1, backgroundColor: Brand.midnight }}>
      <LinearGradient colors={[...Brand.gradient]} locations={[...Brand.gradientStops]} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }}>
          <Image source={require('../../assets/brand/logo/freda-workspace-logo-horizontal-reverse.png')} style={{ width: 176, height: 64, alignSelf: 'center' }} contentFit="contain" accessibilityLabel="Freda Workspace" />
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 21, lineHeight: 26, fontFamily: fonts.headXBold, marginTop: 26, letterSpacing: -0.4 }}>{addMode ? 'Ajouter un compte' : 'Votre email professionnel,\nsimple et rapide.'}</Text>
          <Text style={{ color: '#ffffffb8', textAlign: 'center', fontSize: 13, lineHeight: 18, marginTop: 10, fontFamily: fonts.regular }}>Connectez-vous avec l'adresse et le mot de passe créés dans votre espace Freda.</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 28, padding: 20, marginTop: 28, gap: 14 }}>
            <View style={field}>
              <Ionicons name="at" size={22} color="#4B5568" />
              <TextInput value={email} onChangeText={setEmail} placeholder="Adresse email" placeholderTextColor="#7B8497" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="email" returnKeyType="next" onSubmitEditing={() => pwRef.current?.focus()} style={{ flex: 1, minWidth: 0, marginLeft: 10, fontSize: 16, color: Brand.ink, fontFamily: fonts.regular }} accessibilityLabel="Adresse email" />
            </View>
            <View style={field}>
              <Ionicons name="lock-closed" size={22} color="#4B5568" />
              <TextInput ref={pwRef} value={pw} onChangeText={setPw} placeholder="Mot de passe" placeholderTextColor="#7B8497" secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} textContentType="password" autoComplete="current-password" returnKeyType="go" onSubmitEditing={submit} style={{ flex: 1, minWidth: 0, marginLeft: 10, marginRight: 8, fontSize: 16, color: Brand.ink, fontFamily: fonts.regular }} accessibilityLabel="Mot de passe" />
              <Pressable onPress={() => setShow(!show)} hitSlop={10} accessibilityLabel={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}><Ionicons name={show ? 'eye-off' : 'eye'} size={22} color="#4B5568" /></Pressable>
            </View>
            {error && <Text accessibilityLiveRegion="polite" style={{ color: Brand.danger, fontFamily: fonts.medium, fontSize: 13.5 }}>{error}</Text>}
            <Pressable onPress={submit} disabled={busy} accessibilityRole="button" style={{ height: 54, borderRadius: 16, backgroundColor: Brand.blue, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.8 : 1 }}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 16 }}>Se connecter</Text>}
            </Pressable>
            {!addMode && (
              <Pressable onPress={() => { useLock.getState().markUnlocked(); useAuth.getState().startDemo(); router.replace('/'); }} disabled={busy} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ color: Brand.blue, fontFamily: fonts.semibold, fontSize: 15 }}>Essayer la démo</Text>
              </Pressable>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, paddingHorizontal: 6, gap: 10 }}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#ffffffb8" />
            <Text style={{ flex: 1, color: '#ffffffb8', fontSize: 12.5, fontFamily: fonts.regular }}>Connexion chiffrée · vos identifiants restent sur votre téléphone</Text>
          </View>
        </ScrollView>
        {addMode && (
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} accessibilityRole="button" accessibilityLabel="Retour" style={{ position: 'absolute', top: insets.top + 8, left: 10, padding: 10 }}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
