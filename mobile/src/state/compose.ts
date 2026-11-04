import { create } from 'zustand';
import { displayOf, MailAddress, MailMessage } from '../data/models';
import { fullDate } from '../core/format';

export interface ComposeSeed { to: MailAddress[]; cc: MailAddress[]; subject: string; body: string; inReplyTo?: string }

interface ComposeState { seed: ComposeSeed | null; open(seed: ComposeSeed | null): void }
/** Brouillon transmis à l'écran d'écriture (les objets ne passent pas par les paramètres d'URL). */
export const useCompose = create<ComposeState>((set) => ({ seed: null, open: (seed) => set({ seed }) }));

const quote = (m: MailMessage) => `\n\nLe ${fullDate(m.date)}, ${displayOf(m.from)} <${m.from.email}> a écrit :\n${m.bodyText.split('\n').map((l) => '> ' + l).join('\n')}`;
const re = (s: string) => (/^(re|réf?)\s*:/i.test(s) ? s : `Re: ${s}`);

export function replySeed(m: MailMessage, me: string, all: boolean): ComposeSeed {
  const others = [...m.to, ...m.cc].filter((a) => a.email.toLowerCase() !== me.toLowerCase() && a.email.toLowerCase() !== m.from.email.toLowerCase());
  return { to: [m.from], cc: all ? others : [], subject: re(m.subject), body: quote(m) };
}
export function forwardSeed(m: MailMessage): ComposeSeed {
  const head = `\n\n---------- Message transféré ----------\nDe : ${displayOf(m.from)} <${m.from.email}>\nDate : ${fullDate(m.date)}\nObjet : ${m.subject}\n\n`;
  return { to: [], cc: [], subject: /^(tr|fwd?)\s*:/i.test(m.subject) ? m.subject : `Tr: ${m.subject}`, body: head + m.bodyText };
}
