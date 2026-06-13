'use client';

import type { CustomerSession } from '@aranyam/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SessionState = {
  session?: CustomerSession;
  setSession: (session: CustomerSession) => void;
  clear: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      setSession: (session) => set({ session }),
      clear: () => set({ session: undefined }),
    }),
    { name: 'aranyam-customer-session' },
  ),
);
