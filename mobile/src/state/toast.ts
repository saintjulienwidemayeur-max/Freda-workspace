import { create } from 'zustand';

export interface Toast { id: number; text: string; action?: { label: string; run: () => void }; ms: number }
interface ToastState { toast: Toast | null; show(text: string, o?: { action?: Toast['action']; ms?: number }): void; hide(): void }
let n = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  toast: null,
  show(text, o = {}) {
    clearTimeout(timer);
    const t: Toast = { id: ++n, text, action: o.action, ms: o.ms ?? 4000 };
    set({ toast: t });
    timer = setTimeout(() => set((s) => (s.toast?.id === t.id ? { toast: null } : s)), t.ms);
  },
  hide() { clearTimeout(timer); set({ toast: null }); },
}));
