/**
 * Analyse des réponses IMAP (RFC 3501) : découpage en réponses complètes (littéraux `{n}` inclus) puis en jetons.
 * Jeton : null (NIL) | string (atome ou chaîne entre guillemets) | Uint8Array (littéral) | Tok[] (liste entre parenthèses).
 */
export type Tok = null | string | Uint8Array | Tok[];

const CR = 13, LF = 10;

/** Accumule les octets reçus et rend les réponses complètes (une ligne, plus ses littéraux). */
export class ResponseReader {
  private buf: Uint8Array = new Uint8Array(0);
  feed(chunk: Uint8Array): Uint8Array[] {
    const merged = new Uint8Array(this.buf.length + chunk.length);
    merged.set(this.buf, 0); merged.set(chunk, this.buf.length);
    this.buf = merged;
    const out: Uint8Array[] = [];
    let start = 0, scan = 0;
    for (;;) {
      let i = scan;
      while (i + 1 < this.buf.length && !(this.buf[i] === CR && this.buf[i + 1] === LF)) i++;
      if (i + 1 >= this.buf.length) break; // ligne incomplète
      // la ligne se termine-t-elle par un littéral {n} ?
      let j = i - 1, digits = '';
      if (this.buf[j] === 0x2b /* + */) j--;
      if (this.buf[j] === 0x7d /* } */) {
        j--;
        while (j >= start && this.buf[j] >= 0x30 && this.buf[j] <= 0x39) { digits = String.fromCharCode(this.buf[j]) + digits; j--; }
        if (digits && this.buf[j] === 0x7b /* { */) {
          const n = Number(digits);
          if (i + 2 + n > this.buf.length) break; // littéral incomplet : attendre la suite
          scan = i + 2 + n; // la réponse continue après le littéral
          continue;
        }
      }
      out.push(this.buf.slice(start, i)); // sans le CRLF final
      start = scan = i + 2;
    }
    this.buf = this.buf.slice(start);
    return out;
  }
}

const dec = (b: Uint8Array) => new TextDecoder('utf-8').decode(b);
export const text = (t: Tok): string => (typeof t === 'string' ? t : t instanceof Uint8Array ? dec(t) : '');

/** Découpe une réponse complète en jetons. */
export function parseTokens(raw: Uint8Array): Tok[] {
  let p = 0;
  const isSpace = (c: number) => c === 0x20 || c === 9;
  function readList(): Tok[] {
    const items: Tok[] = [];
    for (;;) {
      while (p < raw.length && isSpace(raw[p])) p++;
      if (p >= raw.length) return items; // tolérant : liste non fermée
      if (raw[p] === 0x29 /* ) */) { p++; return items; }
      items.push(readValue());
    }
  }
  function readValue(): Tok {
    const c = raw[p];
    if (c === 0x28 /* ( */) { p++; return readList(); }
    if (c === 0x22 /* " */) {
      p++; const bytes: number[] = [];
      while (p < raw.length && raw[p] !== 0x22) { if (raw[p] === 0x5c) p++; bytes.push(raw[p]); p++; }
      p++; return dec(Uint8Array.from(bytes));
    }
    if (c === 0x7b /* { */) {
      let q = p + 1, n = '';
      while (raw[q] !== 0x7d) { n += String.fromCharCode(raw[q]); q++; }
      const len = Number(n);
      const start = q + 3; // } CR LF
      p = start + len;
      return raw.slice(start, start + len);
    }
    // atome (avec sections BODY[...] contenant espaces et parenthèses, puis <partiel>)
    const s = p;
    while (p < raw.length) {
      const ch = raw[p];
      if (ch === 0x5b /* [ */) { while (p < raw.length && raw[p] !== 0x5d) p++; p++; continue; }
      if (isSpace(ch) || ch === 0x28 || ch === 0x29) break;
      p++;
    }
    const atom = dec(raw.slice(s, p));
    return atom.toUpperCase() === 'NIL' ? null : atom;
  }
  const out: Tok[] = [];
  while (p < raw.length) {
    while (p < raw.length && isSpace(raw[p])) p++;
    if (p >= raw.length) break;
    out.push(readValue());
  }
  return out;
}

/** Liste clé/valeur d'un FETCH : (UID 5 FLAGS (\Seen) BODY[TEXT] {..}) → Map clé majuscule normalisée (sans .PEEK). */
export function fetchItems(list: Tok): Map<string, Tok> {
  const m = new Map<string, Tok>();
  if (!Array.isArray(list)) return m;
  for (let i = 0; i + 1 < list.length; i += 2) {
    const k = text(list[i]).toUpperCase().replace('.PEEK', '').replace(/<\d+>$/, '');
    m.set(k, list[i + 1]);
  }
  return m;
}

/** Cherche récursivement une chaîne (insensible à la casse) dans un arbre de jetons (détection des pièces jointes). */
export function containsString(t: Tok, needle: string): boolean {
  if (typeof t === 'string') return t.toLowerCase() === needle.toLowerCase();
  if (Array.isArray(t)) return t.some((x) => containsString(x, needle));
  return false;
}

/* ---------- Noms de dossiers : UTF-7 modifié (RFC 3501 §5.1.3) ---------- */
export function decodeMutf7(s: string): string {
  return s.replace(/&([^-]*)-/g, (_m, b64: string) => {
    if (b64 === '') return '&';
    const bin = atob(b64.replace(/,/g, '/'));
    let out = '';
    for (let i = 0; i + 1 < bin.length; i += 2) out += String.fromCharCode((bin.charCodeAt(i) << 8) | bin.charCodeAt(i + 1));
    return out;
  });
}
export function encodeMutf7(s: string): string {
  let out = '', chunk = '';
  const flush = () => {
    if (!chunk) return;
    let bin = '';
    for (const c of chunk) bin += String.fromCharCode(c.charCodeAt(0) >> 8, c.charCodeAt(0) & 255);
    out += '&' + btoa(bin).replace(/=+$/, '').replace(/\//g, ',') + '-';
    chunk = '';
  };
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) { flush(); out += ch === '&' ? '&-' : ch; } else chunk += ch;
  }
  flush();
  return out;
}
