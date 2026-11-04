import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, usePalette } from '../src/core/theme';
import { MailError } from '../src/data/models';
import { services } from '../src/services';
import { useAuth } from '../src/state/auth';
import { usePhotos } from '../src/state/photos';
import { useToast } from '../src/state/toast';
import { Avatar } from '../src/ui/Avatar';

/** Ma photo de profil : visible par les autres utilisateurs de Freda Mail, jamais publique. */
export default function Profile() {
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const acc = useAuth((a) => a.repo?.account);
  const has = usePhotos((s) => !!acc && !!s.versions[acc.address.toLowerCase()]);
  const [busy, setBusy] = useState(false);
  if (!acc) return null;

  const run = async (job: () => Promise<void>, ok: string) => {
    setBusy(true);
    let msg = ok;
    try { await job(); } catch (e) { msg = e instanceof MailError ? e.message : 'Une erreur est survenue. Réessayez.'; }
    setBusy(false);
    useToast.getState().show(msg);
  };
  const pick = (camera: boolean) => run(async () => {
    const blob = services.picker ? await services.picker.pick(camera) : await pickWithExpo(camera);
    if (!blob) throw new MailError('Aucune photo choisie.');
    await usePhotos.getState().setMine(blob);
  }, 'Photo mise à jour ✓');

  const btn = (label: string, icon: any, onPress: () => void, primary = false) => (
    <Pressable disabled={busy} onPress={onPress} accessibilityRole="button" style={{ height: 52, borderRadius: 16, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? p.primary : 'transparent', borderWidth: primary ? 0 : 1, borderColor: p.line, opacity: busy ? 0.6 : 1 }}>
      <Ionicons name={icon} size={20} color={primary ? '#fff' : p.primary} />
      <Text style={{ color: primary ? '#fff' : p.primary, fontFamily: fonts.bold, fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ paddingTop: insets.top + 4, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ padding: 10 }} accessibilityLabel="Retour" accessibilityRole="button"><Ionicons name="arrow-back" size={26} color={p.text} /></Pressable>
        <Text style={{ color: p.text, fontFamily: fonts.headBold, fontSize: 20, marginLeft: 6 }}>Photo de profil</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12, alignItems: 'stretch' }}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>{busy ? <ActivityIndicator size="large" color={p.primary} style={{ height: 140 }} /> : <Avatar email={acc.address} name={acc.displayName} size={140} />}</View>
        <Text style={{ textAlign: 'center', color: p.text, fontFamily: fonts.bold }}>{acc.address}</Text>
        <Text style={{ textAlign: 'center', color: p.sub, fontFamily: fonts.regular, lineHeight: 20, marginBottom: 14 }}>Votre photo est visible par les autres utilisateurs de Freda Mail quand ils reçoivent un message de vous. Elle n'est jamais publique.</Text>
        {btn('Choisir une photo', 'images-outline', () => pick(false), true)}
        {btn('Prendre une photo', 'camera-outline', () => pick(true))}
        {has && btn('Supprimer la photo', 'trash-outline', () => run(() => usePhotos.getState().removeMine(), 'Photo supprimée.'))}
      </ScrollView>
    </View>
  );
}

/** Galerie / appareil photo, puis réduction à 384 px en JPEG (le serveur refuse plus de 150 Ko). */
async function pickWithExpo(camera: boolean): Promise<Blob | null> {
  const IP = require('expo-image-picker');
  const IM = require('expo-image-manipulator');
  const perm = camera ? await IP.requestCameraPermissionsAsync() : await IP.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new MailError(camera ? "Autorisez l'appareil photo dans les réglages du téléphone." : 'Autorisez l\'accès aux photos dans les réglages du téléphone.');
  const r = camera ? await IP.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 1 }) : await IP.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
  if (r.canceled || !r.assets?.[0]) return null;
  for (const [size, q] of [[384, 0.8], [320, 0.6], [256, 0.5]] as const) {
    const out = await IM.manipulateAsync(r.assets[0].uri, [{ resize: { width: size, height: size } }], { compress: q, format: IM.SaveFormat.JPEG });
    const blob = await (await fetch(out.uri)).blob();
    if (blob.size <= 140 * 1024) return blob;
  }
  throw new MailError('Cette photo est trop lourde. Choisissez-en une autre.');
}
