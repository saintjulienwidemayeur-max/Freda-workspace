import * as Haptics from 'expo-haptics';
import { memo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { shortDate } from '../core/format';
import { Brand, fonts, usePalette } from '../core/theme';
import { displayOf, MailMessage } from '../data/models';
import { Avatar } from './Avatar';

interface Props { m: MailMessage; now: Date; sentView: boolean; onOpen(): void; onArchive(): void; onDelete(): void; onToggleStar(): void; onToggleRead(): void }

/** Une ligne de la liste : avatar, expéditeur, objet, extrait. Balayer à droite = archiver, à gauche = supprimer. */
export const MessageRow = memo(function MessageRow({ m, now, sentView, onOpen, onArchive, onDelete, onToggleStar, onToggleRead }: Props) {
  const p = usePalette();
  const ref = useRef<SwipeableMethods>(null);
  const who = sentView && m.to.length ? m.to.map(displayOf).join(', ') : displayOf(m.from);
  const whoEmail = sentView && m.to.length ? m.to[0].email : m.from.email;
  const action = (color: string, icon: any, label: string, align: 'flex-start' | 'flex-end') => (
    <View style={{ flex: 1, backgroundColor: color, justifyContent: 'center', alignItems: align, paddingHorizontal: 26 }}>
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={() => action(Brand.green, 'archive-outline', 'Archiver', 'flex-start')}
      renderRightActions={() => action(Brand.danger, 'trash-outline', 'Supprimer', 'flex-end')}
      onSwipeableOpen={(dir) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); ref.current?.close(); if (dir === 'right') onArchive(); else onDelete(); }}
    >
      <Pressable onPress={onOpen} onLongPress={() => { Haptics.selectionAsync(); onToggleRead(); }} accessibilityRole="button" accessibilityLabel={`${m.isRead ? '' : 'Non lu. '}${who}. ${m.subject}`}
        style={{ flexDirection: 'row', paddingHorizontal: 18, paddingVertical: 12, backgroundColor: m.isRead ? p.surface : p.unreadBg }}>
        <Avatar email={whoEmail} name={who} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!m.isRead && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.primary, marginRight: 6 }} />}
            <Text numberOfLines={1} style={{ flex: 1, color: p.text, fontSize: 15.5, fontFamily: m.isRead ? fonts.medium : fonts.bold }}>{who}</Text>
            <Text style={{ color: m.isRead ? p.sub : p.primary, fontSize: 12, fontFamily: m.isRead ? fonts.regular : fonts.semibold }}>{shortDate(m.date, now)}</Text>
          </View>
          <Text numberOfLines={1} style={{ color: p.text, fontSize: 14, marginTop: 2, fontFamily: m.isRead ? fonts.regular : fonts.semibold }}>{m.subject}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text numberOfLines={2} style={{ flex: 1, color: p.sub, fontSize: 13, lineHeight: 18, fontFamily: fonts.regular }}>{m.snippet}</Text>
            {m.attachments.length > 0 && <Ionicons name="attach" size={16} color={p.sub} style={{ marginLeft: 6 }} />}
            <Pressable onPress={onToggleStar} hitSlop={10} accessibilityLabel={m.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris'} style={{ marginLeft: 6 }}>
              <Ionicons name={m.isStarred ? 'star' : 'star-outline'} size={18} color={m.isStarred ? Brand.amber : p.sub} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
});
