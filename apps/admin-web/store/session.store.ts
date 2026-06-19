'use client';
import type { AdminSession } from '@aranyam/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
type State = {
  session?: AdminSession;
  setSession: (session: AdminSession) => void;
  clear: () => void;
};
export const useAdminSessionStore = create<State>()(
  persist(
    (set) => ({
      setSession: (session) => set({ session }),
      clear: () => set({ session: undefined }),
    }),
    { name: 'aranyam-admin-session' },
  ),
);
