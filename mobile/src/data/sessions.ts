/** Comptes enregistrés sur l'appareil (Keychain iOS / Keystore Android via expo-secure-store). */
export interface StoredAccount { address: string; password: string }

export interface SessionStore {
  accounts(): Promise<StoredAccount[]>;
  active(): Promise<string | null>;
  save(address: string, password: string): Promise<void>; // ajoute ou met à jour, et devient actif
  setActive(address: string): Promise<void>;
  remove(address: string): Promise<void>;
  clear(): Promise<void>;
}

const norm = (a: string) => a.trim().toLowerCase();

export class MemorySessionStore implements SessionStore {
  private list: StoredAccount[] = [];
  private act: string | null = null;
  async accounts() { return [...this.list]; }
  async active() { return this.act; }
  async save(address: string, password: string) {
    const a = norm(address);
    this.list = [...this.list.filter((x) => x.address !== a), { address: a, password }];
    this.act = a;
  }
  async setActive(address: string) { if (this.list.some((x) => x.address === norm(address))) this.act = norm(address); }
  async remove(address: string) {
    const a = norm(address);
    this.list = this.list.filter((x) => x.address !== a);
    if (this.act === a) this.act = this.list[0]?.address ?? null;
  }
  async clear() { this.list = []; this.act = null; }
}

export class SecureSessionStore implements SessionStore {
  private mem = new MemorySessionStore();
  private loaded = false;
  private get SecureStore(): typeof import('expo-secure-store') { return require('expo-secure-store'); }

  private async load() {
    if (this.loaded) return;
    this.loaded = true;
    const S = this.SecureStore;
    try {
      const raw = await S.getItemAsync('freda.accounts');
      if (raw) {
        for (const e of JSON.parse(raw) as { a: string; p: string }[]) await this.mem.save(e.a, e.p);
        const act = await S.getItemAsync('freda.active');
        if (act) await this.mem.setActive(act);
      }
    } catch { /* trousseau illisible : on repart de zéro */ }
  }
  private async persist() {
    const S = this.SecureStore;
    const list = await this.mem.accounts();
    if (!list.length) { await S.deleteItemAsync('freda.accounts'); await S.deleteItemAsync('freda.active'); return; }
    await S.setItemAsync('freda.accounts', JSON.stringify(list.map((x) => ({ a: x.address, p: x.password }))));
    const act = await this.mem.active();
    if (act) await S.setItemAsync('freda.active', act);
  }
  async accounts() { await this.load(); return this.mem.accounts(); }
  async active() { await this.load(); return this.mem.active(); }
  async save(a: string, p: string) { await this.load(); await this.mem.save(a, p); await this.persist(); }
  async setActive(a: string) { await this.load(); await this.mem.setActive(a); await this.persist(); }
  async remove(a: string) { await this.load(); await this.mem.remove(a); await this.persist(); }
  async clear() { await this.load(); await this.mem.clear(); await this.persist(); }
}
