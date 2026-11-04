import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidEmail } from '../src/core/format';
import { Brand, fonts, usePalette } from '../src/core/theme';
import { displayOf, MailAddress } from '../src/data/models';
import { useAuth } from '../src/state/auth';
import { useCompose } from '../src/state/compose';
import { scheduleSend } from '../src/state/mail';
import { useToast } from '../src/state/toast';
import { Avatar } from '../src/ui/Avatar';

type Input = React.ComponentRef<typeof TextInput>;

/** Adresse saisie : « prenom@x.com » ou « Nom <prenom@x.com> ». */
function parseAddress(s: string): MailAddress | null {
  const m = /^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/.exec(s);
  const email = (m ? m[2] : s).trim();
  return isValidEmail(email) ? { email, name: m?.[1]?.trim() || undefined } : null;
}

function Recipients({ label, value, onChange, contacts, autoFocus, padRight = 16 }: { label: string; value: MailAddress[]; onChange(v: MailAddress[]): void; contacts: MailAddress[]; autoFocus?: boolean; padRight?: number }) {
  const p = usePalette();
  const [text, setText] = useState('');
  const [bad, setBad] = useState(false);
  const commit = (raw = text) => {
    const parts = raw.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    const ok: MailAddress[] = []; let failed = false;
    for (const part of parts) { const a = parseAddress(part); if (a) ok.push(a); else failed = true; }
    if (ok.length) onChange([...value, ...ok.filter((a) => !value.some((v) => v.email.toLowerCase() === a.email.toLowerCase()))]);
    setText(failed ? parts.filter((x) => !parseAddress(x)).join(', ') : ''); setBad(failed);
  };
  const q = text.trim().toLowerCase();
  const sugg = q.length >= 1 ? contacts.filter((c) => !value.some((v) => v.email === c.email) && `${displayOf(c)} ${c.email}`.toLowerCase().includes(q)).slice(0, 5) : [];
  return (
    <View style={{ borderBottomWidth: 1, borderColor: p.line }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingLeft: 16, paddingRight: padRight, paddingVertical: 8, gap: 6 }}>
        <Text style={{ color: p.sub, fontFamily: fonts.medium, width: 34 }}>{label}</Text>
        {value.map((a) => (
          <Pressable key={a.email} onPress={() => onChange(value.filter((v) => v !== a))} accessibilityLabel={`Retirer ${a.email}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: p.unreadBg, borderRadius: 16, paddingLeft: 10, paddingRight: 6, height: 32, gap: 4 }}>
            <Text style={{ color: p.text, fontFamily: fonts.medium, fontSize: 13.5, maxWidth: 190 }} numberOfLines={1}>{displayOf(a)}</Text>
            <Ionicons name="close-circle" size={16} color={p.sub} />
          </Pressable>
        ))}
        <TextInput autoFocus={autoFocus} value={text} onChangeText={(t) => { setBad(false); if (/[,;\s]$/.test(t) && t.trim()) commit(t); else setText(t); }} onBlur={() => commit()} onSubmitEditing={() => commit()} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder={value.length ? '' : 'adresse@exemple.com'} placeholderTextColor={p.sub} accessibilityLabel={label === 'À' ? 'Destinataires' : label} style={{ flexGrow: 1, minWidth: 120, height: 36, color: p.text, fontFamily: fonts.regular, fontSize: 15 }} />
      </View>
      {bad && <Text style={{ color: Brand.danger, fontSize: 12, paddingHorizontal: 16, paddingBottom: 6, fontFamily: fonts.medium }}>Adresse invalide.</Text>}
      {sugg.map((c) => (
        <Pressable key={c.email} onPress={() => { onChange([...value, c]); setText(''); }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: p.surface }}>
          <Avatar email={c.email} name={displayOf(c)} size={28} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text numberOfLines={1} style={{ color: p.text, fontFamily: fonts.semibold, fontSize: 14 }}>{displayOf(c)}</Text>
            <Text numberOfLines={1} style={{ color: p.sub, fontSize: 12, fontFamily: fonts.regular }}>{c.email}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function Compose() {
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repo = useAuth((a) => a.repo);
  const seed = useRef(useCompose.getState().seed).current;
  const [to, setTo] = useState<MailAddress[]>(seed?.to ?? []);
  const [cc, setCc] = useState<MailAddress[]>(seed?.cc ?? []);
  const [showCc, setShowCc] = useState((seed?.cc.length ?? 0) > 0);
  const [subject, setSubject] = useState(seed?.subject ?? '');
  const [body, setBody] = useState(seed?.body ?? '');
  const [contacts, setContacts] = useState<MailAddress[]>([]);
  const bodyRef = useRef<Input>(null);
  const dirty = to.length > 0 || subject.trim() !== '' || (body.trim() !== '' && body !== (seed?.body ?? ''));

  useEffect(() => { repo?.contacts().then(setContacts).catch(() => undefined); }, [repo]);
  useEffect(() => () => { useCompose.getState().open(null); }, []);

  const close = () => {
    if (!dirty) return router.back();
    Alert.alert('Abandonner ce message ?', 'Ce que vous avez écrit sera perdu.', [{ text: 'Continuer', style: 'cancel' }, { text: 'Abandonner', style: 'destructive', onPress: () => router.back() }]);
  };
  const send = () => {
    if (!to.length) return useToast.getState().show('Ajoutez au moins un destinataire.');
    if (!subject.trim() && !body.trim()) return useToast.getState().show('Le message est vide.');
    const msg = { to, cc, subject: subject.trim(), body, inReplyTo: seed?.inReplyTo };
    router.back();
    scheduleSend(msg, (m) => { useCompose.getState().open({ to: m.to, cc: m.cc ?? [], subject: m.subject, body: m.body, inReplyTo: m.inReplyTo }); router.push('/compose'); });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: p.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + 4, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, borderBottomWidth: 1, borderColor: p.line }}>
        <Pressable onPress={close} hitSlop={8} style={{ padding: 10 }} accessibilityLabel="Fermer" accessibilityRole="button"><Ionicons name="close" size={26} color={p.text} /></Pressable>
        <Text style={{ flex: 1, color: p.text, fontFamily: fonts.headBold, fontSize: 18, marginLeft: 6 }}>Nouveau message</Text>
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Envoyer" style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Brand.blue, height: 40, borderRadius: 14, paddingHorizontal: 16, marginRight: 8, gap: 6 }}>
          <Ionicons name="send" size={16} color="#fff" /><Text style={{ color: '#fff', fontFamily: fonts.bold }}>Envoyer</Text>
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: p.line, gap: 10 }}>
          <Avatar email={repo?.account.address ?? ''} name={repo?.account.displayName ?? ''} size={30} />
          <Text numberOfLines={1} style={{ flex: 1, color: p.sub, fontFamily: fonts.regular, fontSize: 13.5 }}>De : {repo?.account.address}</Text>
        </View>
        <View>
          <Recipients label="À" value={to} onChange={setTo} contacts={contacts} autoFocus={!seed?.to.length} padRight={showCc ? 16 : 52} />
          {!showCc && <Pressable onPress={() => setShowCc(true)} style={{ position: 'absolute', right: 16, top: 12 }} accessibilityRole="button"><Text style={{ color: p.primary, fontFamily: fonts.semibold, fontSize: 13 }}>Cc</Text></Pressable>}
        </View>
        {showCc && <Recipients label="Cc" value={cc} onChange={setCc} contacts={contacts} />}
        <TextInput value={subject} onChangeText={setSubject} placeholder="Objet" placeholderTextColor={p.sub} returnKeyType="next" onSubmitEditing={() => bodyRef.current?.focus()} style={{ paddingHorizontal: 16, height: 50, color: p.text, fontFamily: fonts.semibold, fontSize: 16, borderBottomWidth: 1, borderColor: p.line }} accessibilityLabel="Objet" />
        <TextInput ref={bodyRef} value={body} onChangeText={setBody} multiline placeholder="Écrivez votre message…" placeholderTextColor={p.sub} textAlignVertical="top" style={{ minHeight: 280, paddingHorizontal: 16, paddingTop: 14, color: p.text, fontFamily: fonts.regular, fontSize: 16, lineHeight: 23 }} accessibilityLabel="Message" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
