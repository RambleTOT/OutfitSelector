import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'offline' | 'neutral'

export interface ToastData {
  id: number
  text: string
  tone: ToastTone
  icon?: string
  action?: string
  onAction?: () => void
}

interface UiState {
  toast: ToastData | null
  showToast: (t: Omit<ToastData, 'id'>) => void
  hideToast: () => void
}

let seq = 0

/** Несохраняемое состояние интерфейса */
export const useUi = create<UiState>((set) => ({
  toast: null,
  showToast: (t) => set({ toast: { ...t, id: ++seq } }),
  hideToast: () => set({ toast: null }),
}))

export const toast = (text: string, tone: ToastTone = 'success', extra?: Partial<ToastData>) =>
  useUi.getState().showToast({ text, tone, ...extra })
