import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Modal, Pressable, ScrollView, Switch, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, fonts, usePalette } from '../core/theme';
import { FolderKind, MailError } from '../data/models';
import { services } from '../services';
import { useAuth } from '../state/auth';
import { useLock } from '../state/lock';
import { useInbox } from '../state/mail';
import { useToast } from '../state/toast';
import { Avatar } from './Avatar';

const ICONS: Record<FolderKind, any> = { inbox: 'mail-outline', sent: 'paper-plane-outline', drafts: 'document-text-outline', archive: 'archive-outline', spam: 'warning-outline', trash: 'trash-outline', other: 'folder-outline' };
const err = (e: unknown) => useToast.getState().show(e instanceof MailError ? e.message : 'Une erreur est survenue. Réessayez.');

/** Tiroir : comptes (changer, ajouter, retirer), dossiers, photo de profil, verrouillage biométrique, déconnexion. */
export function FolderDrawer({ open, onClose }: { open: boolean; onClose(): void }) {
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const w = Math.min(340, width * 0.86);
  const auth = useAuth();
  const { folders, folderId } = useInbox();
  const lock = useLock();
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [lockOk, setLockOk] = useState(false);
  const [x] = useState(() => new Animated.Value(-w));
  const [shown, setShown] = useState(false);

  useEffect(() => { services.biometric.available().then(setLockOk); }, []);
  useEffect(() => {
    if (open) { setShown(true); Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }).start(); }
    else Animated.timing(x, { toValue: -w, duration: 180, useNativeDriver: true }).start(() => setShown(false));
  }, [open, x, w]);

  const demo = auth.isDemo;
  const go = (path: string) => { onClose(); router.push(path as any); };
  const name = auth.repo?.account.displayName ?? '';
  const canSwitch = !demo && auth.accounts.length > 0;

  return (
    <Modal visible={shown} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Pressable style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#00000073' }} onPress={onClose} accessibilityLabel="Fermer le menu" />
        <Animated.View style={{ width: w, flex: 1, transform: [{ translateX: x }], backgroundColor: p.surface }}>
          <LinearGradient colors={[...Brand.gradient]} locations={[...Brand.gradientStops]} style={{ paddingTop: insets.top + 14, paddingHorizontal: 18, paddingBottom: 14 }}>
            <Image source={require('../../assets/brand/logo/freda-workspace-logo-horizontal-reverse.png')} style={{ width: 150, height: 40 }} contentFit="contain" accessibilityLabel="Freda Workspace" />
            <Pressable disabled={!canSwitch} onPress={() => setAccountsOpen((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 6 }} accessibilityRole="button">
              <Avatar email={auth.address} name={name} size={44} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16.5, fontFamily: fonts.bold }}>{name}</Text>
                <Text numberOfLines={1} style={{ color: '#ffffffbf', fontSize: 13, fontFamily: fonts.regular }}>{auth.address}</Text>
              </View>
              {canSwitch && <Ionicons name={accountsOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#fff" accessibilityLabel="Changer de compte" />}
            </Pressable>
          </LinearGradient>
          <ScrollView>
            {accountsOpen && canSwitch && (
              <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: p.line }}>
                {auth.accounts.map((a) => (
                  <View key={a} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10 }} onPress={async () => { onClose(); try { await useAuth.getState().switchTo(a); } catch (e) { err(e); } }}>
                      <Avatar email={a} name={a.split('@')[0]} size={34} />
                      <Text numberOfLines={1} style={{ flex: 1, marginLeft: 12, color: p.text, fontFamily: a === auth.address ? fonts.bold : fonts.regular }}>{a}</Text>
                      {a === auth.address && <Ionicons name="checkmark-circle" size={20} color={p.primary} />}
                    </Pressable>
                    <Pressable hitSlop={8} style={{ padding: 12 }} accessibilityLabel={`Retirer ${a}`} onPress={() => Alert.alert('Retirer ce compte ?', `${a} sera retiré de ce téléphone. Vos messages restent sur le serveur.`, [{ text: 'Annuler', style: 'cancel' }, { text: 'Retirer', style: 'destructive', onPress: () => { onClose(); useAuth.getState().removeAccount(a).catch(err); } }])}>
                      <Ionicons name="close" size={20} color={p.sub} />
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={() => go('/add-account')} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 }}>
                  <Ionicons name="add-circle-outline" size={26} color={p.primary} />
                  <Text style={{ marginLeft: 12, color: p.primary, fontFamily: fonts.semibold }}>Ajouter un compte</Text>
                </Pressable>
              </View>
            )}
            <View style={{ paddingVertical: 8 }}>
              {folders.map((f) => {
                const sel = f.id === folderId;
                return (
                  <Pressable key={f.id} onPress={() => { onClose(); useInbox.getState().selectFolder(f.id); }} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, paddingHorizontal: 12, height: 50, borderRadius: 14, backgroundColor: sel ? p.unreadBg : 'transparent' }}>
                    <Ionicons name={ICONS[f.kind]} size={22} color={sel ? p.primary : p.sub} />
                    <Text numberOfLines={1} style={{ flex: 1, marginLeft: 14, color: sel ? p.primary : p.text, fontFamily: sel ? fonts.bold : fonts.medium, fontSize: 15 }}>{f.name}</Text>
                    {f.unread > 0 && f.kind !== 'trash' && <Text style={{ color: Brand.blue, fontFamily: fonts.bold }}>{f.unread}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <View style={{ height: 1, backgroundColor: p.line }} />
            {!demo && (
              <Pressable onPress={() => go('/profile')} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, height: 54 }} accessibilityRole="button">
                <Ionicons name="person-circle-outline" size={24} color={p.sub} />
                <Text style={{ marginLeft: 14, color: p.text, fontFamily: fonts.medium, fontSize: 15 }}>Photo de profil</Text>
              </Pressable>
            )}
            {!demo && lockOk && (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, minHeight: 60 }}>
                <Ionicons name="finger-print" size={24} color={p.sub} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: p.text, fontFamily: fonts.medium, fontSize: 15 }}>Verrouillage biométrique</Text>
                  <Text style={{ color: p.sub, fontSize: 12, fontFamily: fonts.regular }}>Empreinte, visage ou code du téléphone</Text>
                </View>
                <Switch value={lock.enabled} onValueChange={async (on) => { const e = on ? await useLock.getState().enable() : await useLock.getState().disable(); if (e) useToast.getState().show(e, { ms: 6000 }); }} accessibilityLabel="Verrouillage biométrique" />
              </View>
            )}
            <Pressable onPress={() => { onClose(); useAuth.getState().logout(); }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, height: 54 }} accessibilityRole="button">
              <Ionicons name="log-out-outline" size={24} color={p.sub} />
              <Text style={{ marginLeft: 14, color: p.text, fontFamily: fonts.medium, fontSize: 15 }}>{demo ? 'Quitter la démo' : 'Se déconnecter de ce compte'}</Text>
            </Pressable>
            <View style={{ height: insets.bottom + 8 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
