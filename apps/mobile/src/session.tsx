import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { DemoClient } from './client';
const Context = createContext<DemoClient | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new DemoClient(Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/pick-api` : (process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4100').replace(/\/$/, '')));
  useEffect(() => {
    const timer = setInterval(() => {if(AppState.currentState==='active'&&(Platform.OS!=='web'||document.visibilityState==='visible'))client.tick();}, 1000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void client.refresh(); });
    const refresh = () => { void client.refresh(); };
    if (Platform.OS === 'web') { window.addEventListener('online', refresh); window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh); }
    return () => { clearInterval(timer); subscription.remove(); if (Platform.OS === 'web') { window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); } };
  }, [client]);
  return <Context.Provider value={client}>{children}</Context.Provider>;
}
export function useDemo() {
  const client = useContext(Context); if (!client) throw new Error('Session provider missing.');
  const state = useSyncExternalStore(client.subscribe, client.getState, client.getState);
  return { client, ...state };
}
