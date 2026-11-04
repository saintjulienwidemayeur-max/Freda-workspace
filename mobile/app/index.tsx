import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dateGroup } from '../src/core/format';
import { Brand, fonts, usePalette } from '../src/core/theme';
import { MailError, MailMessage } from '../src/data/models';
import { services } from '../src/services';
import { useAuth } from '../src/state/auth';
import { kindOf, MailFilter, useInbox, visible } from '../src/state/mail';
import { useToast } from '../src/state/toast';
import { FolderDrawer } from '../src/ui/Drawer';
import { MessageRow } from '../src/ui/MessageRow';
import { MailListSkeleton } from '../src/ui/Skeleton';

const FILTERS: [MailFilter, string][] = [['all', 'Tous'], ['unread', 'Non lus'], ['attachments', 'Pièces jointes'], ['starred', 'Favoris']];
type Item = { type: 'header'; key: string; label: string } | { type: 'msg'; key: string; m: MailMessage };

export default function Home() {
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = useInbox();
  const demo = useAuth((a) => a.isDemo);
  const [drawer, setDrawer] = useState(false);
  const [searching, setSearching] = useState(false);
  const [text, setText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const now = services.clock();
  const kind = kindOf(s);
  const folder = s.folders.find((f) => f.id === s.folderId);
  const list = visible(s);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    let last = '';
    for (const m of list) {
      const g = dateGroup(m.date, now);
      if (g !== last) { out.push({ type: 'header', key: 'h-' + g, label: g }); last = g; }
      out.push({ type: 'msg', key: m.folderId + m.id, m });
    }
    return out;
  }, [list, now]);

  const undoable = useCallback(async (m: MailMessage, del: boolean) => {
    try {
      const undo = await useInbox.getState().moveAway(m, { delete: del });
      useToast.getState().show(del ? (undo ? 'Message supprimé' : 'Supprimé définitivement') : 'Message archivé', undo ? { action: { label: 'Annuler', run: () => undo().catch(() => undefined) } } : {});
    } catch (e) { useToast.getState().show(e instanceof MailError ? e.message : "L'action a échoué. Réessayez."); }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 8, paddingBottom: 6, backgroundColor: p.surface }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
          <Pressable onPress={() => setDrawer(true)} hitSlop={8} style={{ padding: 10 }} accessibilityLabel="Dossiers" accessibilityRole="button"><Ionicons name="menu" size={26} color={p.text} /></Pressable>
          {searching ? (
            <TextInput autoFocus value={text} onChangeText={setText} placeholder="Rechercher dans ce dossier" placeholderTextColor={p.sub} returnKeyType="search" onSubmitEditing={() => s.setQuery(text.trim())} style={{ flex: 1, height: 42, borderRadius: 14, paddingHorizontal: 14, backgroundColor: p.field, color: p.text, fontFamily: fonts.regular }} />
          ) : (
            <View style={{ flex: 1, paddingLeft: 4 }}>
              <Text numberOfLines={1} style={{ color: p.text, fontSize: 20, fontFamily: fonts.headBold }}>{folder?.name ?? 'Boîte de réception'}</Text>
              {s.messages.some((m) => !m.isRead) && <Text style={{ color: p.sub, fontSize: 12, fontFamily: fonts.regular }}>{s.messages.filter((m) => !m.isRead).length} non lu(s)</Text>}
            </View>
          )}
          <Pressable onPress={() => { if (searching) { setText(''); if (s.query) s.setQuery(''); } setSearching(!searching); }} hitSlop={8} style={{ padding: 10 }} accessibilityLabel={searching ? 'Fermer la recherche' : 'Rechercher'} accessibilityRole="button"><Ionicons name={searching ? 'close' : 'search'} size={24} color={p.text} /></Pressable>
        </View>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={FILTERS} keyExtractor={(f) => f[0]} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 8, gap: 8 }}
          renderItem={({ item: [id, label] }) => (
            <Pressable onPress={() => s.setFilter(id)} accessibilityRole="button" accessibilityState={{ selected: s.filter === id }} style={{ paddingHorizontal: 14, height: 34, borderRadius: 17, justifyContent: 'center', borderWidth: 1, borderColor: s.filter === id ? p.primary : p.line, backgroundColor: s.filter === id ? p.unreadBg : 'transparent' }}>
              <Text style={{ color: s.filter === id ? p.primary : p.text, fontFamily: fonts.semibold, fontSize: 13 }}>{label}</Text>
            </Pressable>
          )} />
      </View>
      {demo && <Text style={{ textAlign: 'center', paddingVertical: 5, backgroundColor: Brand.amber, color: Brand.ink, fontFamily: fonts.semibold, fontSize: 12 }}>Mode démonstration : ces messages sont fictifs</Text>}
      {s.error && !s.loading && (
        <Pressable onPress={() => s.reload()} style={{ padding: 14, backgroundColor: '#FEF2F2' }}><Text style={{ color: Brand.danger, fontFamily: fonts.medium }}>{s.error} Appuyez pour réessayer.</Text></Pressable>
      )}
      {s.loading ? <MailListSkeleton /> : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.key}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await s.reload(); setRefreshing(false); }} tintColor={p.primary} />}
          onEndReached={() => s.loadMore()}
          onEndReachedThreshold={0.6}
          contentContainerStyle={{ paddingBottom: 110, flexGrow: 1 }}
          ListEmptyComponent={!s.error ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 }}><Ionicons name={s.query ? 'search' : 'checkmark-done-circle-outline'} size={56} color={p.sub} /><Text style={{ color: p.text, fontFamily: fonts.headBold, fontSize: 18 }}>{s.query ? 'Aucun résultat' : s.filter !== 'all' ? 'Rien dans ce filtre' : 'Tout est à jour'}</Text><Text style={{ color: p.sub, textAlign: 'center', fontFamily: fonts.regular }}>{s.query ? 'Essayez un autre mot.' : 'Aucun message ici pour le moment.'}</Text></View> : undefined}
          renderItem={({ item }) => item.type === 'header' ? (
            <Text style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6, color: p.sub, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>{item.label}</Text>
          ) : (
            <MessageRow m={item.m} now={now} sentView={kind === 'sent' || kind === 'drafts'}
              onOpen={() => router.push({ pathname: '/message/[folder]/[id]', params: { folder: encodeURIComponent(item.m.folderId), id: item.m.id } })}
              onArchive={() => undoable(item.m, false)} onDelete={() => undoable(item.m, true)}
              onToggleStar={() => s.toggleStar(item.m)} onToggleRead={() => s.toggleRead(item.m)} />
          )}
        />
      )}
      <Pressable onPress={() => router.push('/compose')} accessibilityRole="button" accessibilityLabel="Écrire un message" style={{ position: 'absolute', right: 18, bottom: insets.bottom + 18, flexDirection: 'row', alignItems: 'center', height: 56, paddingHorizontal: 20, borderRadius: 18, backgroundColor: Brand.blue, elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
        <Ionicons name="create-outline" size={22} color="#fff" />
        <Text style={{ color: '#fff', fontFamily: fonts.bold, marginLeft: 8, fontSize: 15 }}>Écrire</Text>
      </Pressable>
      <FolderDrawer open={drawer} onClose={() => setDrawer(false)} />
    </View>
  );
}
