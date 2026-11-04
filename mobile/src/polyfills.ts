// À importer en premier : Buffer (react-native-tcp-socket) et TextDecoder multi-jeux de caractères (postal-mime, e-mails en latin-1…).
import { Buffer } from 'buffer';

const g = globalThis as any;
if (!g.Buffer) g.Buffer = Buffer;
try {
  new TextDecoder('iso-8859-1');
} catch {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const t = require('text-encoding');
  g.TextDecoder = t.TextDecoder;
  if (!g.TextEncoder) g.TextEncoder = t.TextEncoder;
}
