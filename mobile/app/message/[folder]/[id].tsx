import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { fileSize, fullDate } from '../../../src/core/format';
import { sanitizeEmailHtml } from '../../../src/core/htmlSafety';
import { Brand, fonts, usePalette } from '../../../src/core/theme';
import { displayOf, MailAddress, MailError, MailMessage } from '../../../src/data/models';
import { useAuth } from '../../../src/state/auth';
import { forwardSeed, replySeed, useCompose } from '../../../src/state/compose';
import { openMessage, useInbox } from '../../../src/state/mail';
import { useToast } from '../../../src/state/toast';
import { Avatar } from '../../../src/ui/Avatar';

const nonce = () => Math.random().toString(36).slice(2);

function HtmlBody({ html }: { html: string }) {
  const [allow, setAllow] = useState(false);
  const [h, setH] = useState(200);
  const safe = useMemo(() => sanitizeEmailHtml(html, allow), [html, allow]);
  const n = useMemo(nonce, []);
  const doc = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline'; script-src 'nonce-${n}'"><style>html,body{margin:0;padding:0;background:#fff;color:#0B1533;font:15px/1.55 -apple-system,Roboto,Helvetica,Arial,sans-serif;word-wrap:break-word;overflow-wrap:anywhere}#c{padding:14px}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}a{color:#2B64E4}</style></head><body><div id="c">${safe.html}</div><script nonce="${n}">function s(){window.ReactNativeWebView.postMessage(String(document.getElementById('c').scrollHeight))}window.onload=s;setTimeout(s,300);setTimeout(s,1200)</script></body></html>`;
  return (
    <View>
      {safe.blockedImages > 0 && (
        <Pressable onPress={() => setAllow(true)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 10, borderRadius: 12, backgroundColor: '#FFF7E0' }}>
          <Ionicons name="shield-checkmark" size={20} color="#8A6100" />
          <Text style={{ flex: 1, color: '#5C4100', fontFamily: fonts.medium, fontSize: 13 }}>{safe.blockedImages} image(s) distante(s) bloquée(s) pour votre vie privée. <Text style={{ fontFamily: fonts.bold }}>Afficher</Text></Text>
        </Pressable>
      )}
      <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: '#fff', height: h }}>
        <WebView originWhitelist={['*']} source={{ html: doc }} scrollEnabled={false} javaScriptEnabled onMessage={(e) => { const v = Number(e.nativeEvent.data); if (v > 0) setH(Math.min(v + 4, 20000)); }}
          onShouldStartLoadWithRequest={(r) => { if (r.url === 'about:blank' || r.url.startsWith('data:') || r.url.startsWith('about:')) return true; if (/^(https?:|mailto:|tel:)/i.test(r.url)) Linking.openURL(r.url).catch(() => undefined); return false; }}
          setSupportMultipleWindows={false} allowFileAccess={false} style={{ backgroundColor: '#fff' }} />
      </View>
    </View>
  );
}

const names = (l: MailAddress[]) => l.map((a) => `${displayOf(a)} <${a.email}>`).join(', ');

export default function MessageScreen() {
  const { folder, id } = useLocalSearchParams<{ folder: string; id: string }>();
  const folderId = decodeURIComponent(String(folder));
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useAuth((a) => a.address);
  const [m, setM] = useState<MailMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState(false);
  const listed = useInbox((s) => s.messages.find((x) => x.id === id && x.folderId === folderId));

  useEffect(() => {
    let live = true;
    openMessage(folderId, String(id)).then((x) => live && setM(x)).catch((e) => live && setError(e instanceof MailError ? e.message : 'Impossible de charger ce message.'));
    return () => { live = false; };
  }, [folderId, id]);

  const act = async (del: boolean) => {
    if (!m) return;
    router.back();
    try {
      const undo = await useInbox.getState().moveAway(m, { delete: del });
      useToast.getState().show(del ? (undo ? 'Message supprimé' : 'Supprimé définitivement') : 'Message archivé', undo ? { action: { label: 'Annuler', run: () => undo().catch(() => undefined) } } : {});
    } catch (e) { useToast.getState().show(e instanceof MailError ? e.message : "L'action a échoué."); }
  };
  const compose = (seed: ReturnType<typeof replySeed>) => { useCompose.getState().open(seed); router.push('/compose'); };
  const starred = listed?.isStarred ?? m?.isStarred ?? false;
  const iconBtn = (name: any, label: string, onPress: () => void, color = p.text) => <Pressable onPress={onPress} hitSlop={8} style={{ padding: 10 }} accessibilityLabel={label} accessibilityRole="button"><Ionicons name={name} size={24} color={color} /></Pressable>;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ paddingTop: insets.top + 4, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, backgroundColor: p.surface, borderBottomWidth: 1, borderColor: p.line }}>
        {iconBtn('arrow-back', 'Retour', () => router.back())}
        <View style={{ flex: 1 }} />
        {m && iconBtn(starred ? 'star' : 'star-outline', starred ? 'Retirer des favoris' : 'Ajouter aux favoris', () => { if (listed) useInbox.getState().toggleStar(listed); else useInbox.getState().toggleStar(m); setM({ ...m, isStarred: !starred }); }, starred ? Brand.amber : p.text)}
        {m && iconBtn('mail-unread-outline', 'Marquer comme non lu', async () => { await useInbox.getState().toggleRead({ ...m, isRead: true }); router.back(); })}
        {m && iconBtn('archive-outline', 'Archiver', () => act(false))}
        {m && iconBtn('trash-outline', 'Supprimer', () => act(true))}
      </View>
      {!m && !error && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={p.primary} size="large" /></View>}
      {error && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}><Text style={{ color: Brand.danger, textAlign: 'center', fontFamily: fonts.medium }}>{error}</Text></View>}
      {m && (
        <>
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }}>
            <Text selectable style={{ color: p.text, fontSize: 22, lineHeight: 28, fontFamily: fonts.headXBold }}>{m.subject}</Text>
            <Pressable onPress={() => setDetails(!details)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }} accessibilityRole="button" accessibilityLabel="Afficher les détails de l'expéditeur">
              <Avatar email={m.from.email} name={displayOf(m.from)} size={46} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text numberOfLines={1} style={{ color: p.text, fontFamily: fonts.bold, fontSize: 15.5 }}>{displayOf(m.from)}</Text>
                <Text numberOfLines={1} style={{ color: p.sub, fontSize: 13, fontFamily: fonts.regular }}>à {m.to.length ? m.to.map(displayOf).join(', ') : 'moi'}{m.cc.length ? ` (+${m.cc.length} en copie)` : ''}</Text>
              </View>
              <Ionicons name={details ? 'chevron-up' : 'chevron-down'} size={20} color={p.sub} />
            </Pressable>
            {details && (
              <View style={{ marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: p.field, gap: 4 }}>
                <Text selectable style={{ color: p.text, fontSize: 13, fontFamily: fonts.regular }}>De : {m.from.email}</Text>
                <Text selectable style={{ color: p.text, fontSize: 13, fontFamily: fonts.regular }}>À : {names(m.to) || me}</Text>
                {m.cc.length > 0 && <Text selectable style={{ color: p.text, fontSize: 13, fontFamily: fonts.regular }}>Cc : {names(m.cc)}</Text>}
                <Text style={{ color: p.sub, fontSize: 13, fontFamily: fonts.regular }}>{fullDate(m.date)}</Text>
              </View>
            )}
            <View style={{ height: 1, backgroundColor: p.line, marginVertical: 16 }} />
            {m.bodyHtml ? <HtmlBody html={m.bodyHtml} /> : <Text selectable style={{ color: p.text, fontSize: 15.5, lineHeight: 23, fontFamily: fonts.regular }}>{m.bodyText}</Text>}
            {m.attachments.length > 0 && (
              <View style={{ marginTop: 22, gap: 8 }}>
                <Text style={{ color: p.sub, fontFamily: fonts.bold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>{m.attachments.length} pièce(s) jointe(s)</Text>
                {m.attachments.map((a, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface }}>
                    <Ionicons name={a.mime.startsWith('image/') ? 'image-outline' : 'document-attach-outline'} size={26} color={p.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text numberOfLines={1} style={{ color: p.text, fontFamily: fonts.semibold }}>{a.name}</Text>
                      <Text style={{ color: p.sub, fontSize: 12, fontFamily: fonts.regular }}>{fileSize(a.size)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 14, paddingBottom: insets.bottom + 14, backgroundColor: p.surface, borderTopWidth: 1, borderColor: p.line }}>
            {([['Répondre', 'arrow-undo-outline', () => compose({ ...replySeed(m, me, false), inReplyTo: undefined })], ['Répondre à tous', 'arrow-undo-circle-outline', () => compose(replySeed(m, me, true))], ['Transférer', 'arrow-redo-outline', () => compose(forwardSeed(m))]] as const).map(([label, icon, run]) => (
              <Pressable key={label} onPress={run} accessibilityRole="button" style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: p.line, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                <Ionicons name={icon} size={19} color={p.primary} />
                <Text numberOfLines={1} style={{ color: p.primary, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}
