import { Brand } from './theme';

export function initialsOf(display: string): string {
  const parts = display.trim().split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function avatarColorFor(email: string): string {
  let h = 7;
  for (const c of email.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return Brand.avatars[h % Brand.avatars.length];
}

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const daysBetween = (now: Date, date: Date) => Math.round((day(now) - day(date)) / 86400000);
const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const p2 = (n: number) => String(n).padStart(2, '0');

export function dateGroup(date: Date, now: Date): string {
  const d = daysBetween(now, date);
  if (d <= 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d < 7) return 'Cette semaine';
  if (d < 31) return 'Ce mois-ci';
  return 'Plus ancien';
}

export function shortDate(date: Date, now: Date): string {
  const d = daysBetween(now, date);
  if (d <= 0) return `${p2(date.getHours())}:${p2(date.getMinutes())}`;
  if (d === 1) return 'Hier';
  if (d < 7) return DAYS[date.getDay()];
  const base = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`;
}

export const fullDate = (d: Date) => `${DAYS[d.getDay()].toLowerCase()} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()} à ${p2(d.getHours())}:${p2(d.getMinutes())}`;

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

export const isValidEmail = (s: string) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/.test(s.trim());
