/** Connexion TCP/TLS minimale : remplaçable (react-native-tcp-socket sur téléphone, `net` dans les tests). */
export interface Transport {
  write(data: Uint8Array): void;
  close(): void;
}
export interface TransportHandlers { onData(chunk: Uint8Array): void; onClose(error?: Error): void }
export type Connector = (host: string, port: number, secure: boolean, handlers: TransportHandlers) => Promise<Transport>;

/** Connecteur de production (module natif : nécessite le build EAS, pas Expo Go). */
export const tcpConnector: Connector = (host, port, secure, h) =>
  new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TcpSocket = require('react-native-tcp-socket').default;
    let settled = false;
    const opts = { host, port, tls: secure, tlsCheckValidity: true } as const;
    const sock = secure
      ? TcpSocket.connectTLS(opts, () => { settled = true; resolve(wrap(sock)); })
      : TcpSocket.createConnection(opts, () => { settled = true; resolve(wrap(sock)); });
    const wrap = (s: any): Transport => ({
      write: (d) => s.write(d),
      close: () => { try { s.destroy(); } catch { /* déjà fermé */ } },
    });
    sock.on('data', (d: any) => h.onData(d instanceof Uint8Array ? d : Uint8Array.from(d)));
    sock.on('error', (e: Error) => { if (!settled) { settled = true; reject(e); } else h.onClose(e); });
    sock.on('close', () => { if (!settled) { settled = true; reject(new Error('closed')); } else h.onClose(); });
    setTimeout(() => { if (!settled) { settled = true; try { sock.destroy(); } catch { /* */ } reject(new Error('timeout')); } }, 20000);
  });
