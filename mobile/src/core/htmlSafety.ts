/**
 * Nettoyage du HTML d'un e-mail avant affichage (vie privée et sécurité) :
 * supprime scripts, iframes, formulaires, objets, meta/base/link, gestionnaires on…= et URLs javascript: ;
 * bloque par défaut les images distantes (pixels espions) — elles sont comptées pour proposer « Afficher les images ».
 */
export interface SafeHtml { html: string; blockedImages: number }

const DANGEROUS_BLOCKS = /<(script|style|iframe|object|embed|form|svg|math)\b[\s\S]*?(<\/\1\s*>|$)/gi;
const DANGEROUS_VOID = /<(meta|base|link|input|button|textarea|select)\b[^>]*>/gi;
const EVENT_ATTR = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /(href|src|xlink:href)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi;
const IMG_TAG = /<img\b[^>]*>/gi;
const SRC_ATTR = /\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i;

export function sanitizeEmailHtml(input: string, allowRemoteImages = false): SafeHtml {
  let s = input.replace(DANGEROUS_BLOCKS, '').replace(DANGEROUS_VOID, '').replace(EVENT_ATTR, '').replace(JS_URL, (_m, a) => `${a}="#"`);
  let blocked = 0;
  s = s.replace(IMG_TAG, (tag) => {
    const m = SRC_ATTR.exec(tag);
    const url = (m?.[2] ?? m?.[3] ?? m?.[4] ?? '').trim();
    const remote = /^(https?:)?\/\//i.test(url);
    if (/^(data|cid):/i.test(url)) return '';
    if (remote && !allowRemoteImages) { blocked++; return ''; }
    return remote ? tag : '';
  });
  return { html: s, blockedImages: blocked };
}

const ENTITIES: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

export function htmlToText(html: string): string {
  let s = html.replace(DANGEROUS_BLOCKS, ' ');
  s = s.replace(/<\/p>|<\/h[1-6]>/gi, '\n\n').replace(/<br\s*\/?>|<\/div>|<\/li>/gi, '\n').replace(/<[^>]+>/g, '');
  s = s.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m);
  return s.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
