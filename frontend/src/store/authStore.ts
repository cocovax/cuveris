import { create } from 'zustand'
import { authService } from '../services/auth'
import { appConfig } from '../config/app'

const STORAGE_KEY = 'cuverie-auth-token'

interface AuthUser {
  id: string
  email: string
  role: 'operator' | 'supervisor'
}

type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated' | 'loading'

interface AuthState {
  token: string | null
  tokenExpiresAt?: number
  user?: AuthUser
  status: AuthStatus
  setToken: (token: string | null, expiresIn?: number) => void
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  refresh: () => Promise<boolean>
  logout: () => void
}

const loadInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

const decodeTokenExpiry = (token: string): number | undefined => {
  try {
    const [, payload] = token.split('.')
    if (!payload) return undefined
    const decoded = JSON.parse(atob(payload)) as { exp?: number }
    return decoded.exp ? decoded.exp * 1000 : undefined
  } catch {
    return undefined
  }
}

let refreshTimeout: ReturnType<typeof setTimeout> | undefined

const clearRefreshTimer = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
    refreshTimeout = undefined
  }
}

const scheduleRefresh = (expiresInSeconds: number) => {
  if (!appConfig.apiUrl) return
  clearRefreshTimer()
  const bufferSeconds = 60
  const delaySeconds = Math.max(expiresInSeconds - bufferSeconds, 30)
  refreshTimeout = setTimeout(async () => {
    const success = await useAuthStore.getState().refresh()
    if (!success) {
      console.warn('[Auth] Rafraîchissement de token échoué, déconnexion.')
    }
  }, delaySeconds * 1000)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: loadInitialToken(),
  tokenExpiresAt: undefined,
  user: undefined,
  status: 'idle',

  setToken: (token, expiresIn) => {
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(STORAGE_KEY, token)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
    if (!token) {
      clearRefreshTimer()
      set({ token: null, tokenExpiresAt: undefined })
      return
    }
    let tokenExpiresAt: number | undefined
    if (expiresIn) {
      scheduleRefresh(expiresIn)
      tokenExpiresAt = Date.now() + expiresIn * 1000
    } else {
      const expiry = decodeTokenExpiry(token)
      if (expiry) {
        tokenExpiresAt = expiry
        const remainingSeconds = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
        if (remainingSeconds > 0) {
          scheduleRefresh(remainingSeconds)
        }
      }
    }
    set({ token, tokenExpiresAt })
  },

  initialize: async () => {
    if (!appConfig.apiUrl) {
      set({
        token: 'mock-token',
        tokenExpiresAt: Date.now() + 4 * 60 * 60 * 1000,
        user: {
          id: 'mock-user',
          email: 'demo@cuverie.local',
          role: 'supervisor',
        },
        status: 'authenticated',
      })
      return
    }

    const token = get().token
    if (!token) {
      set({ status: 'unauthenticated' })
      return
    }
    set({ status: 'loading' })
    try {
      const profile = await authService.me()
      set({
        user: {
          id: 'profile',
          email: profile.email,
          role: profile.role,
        },
        status: 'authenticated',
      })
      const currentToken = get().token
      if (currentToken) {
        const expiry = decodeTokenExpiry(currentToken)
        if (expiry) {
          const remainingSeconds = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
          if (remainingSeconds > 0) {
            scheduleRefresh(remainingSeconds)
            set({ tokenExpiresAt: expiry })
          }
        } else {
          scheduleRefresh(4 * 60 * 60)
          set({ tokenExpiresAt: Date.now() + 4 * 60 * 60 * 1000 })
        }
      }
    } catch (error) {
      console.warn('[Auth] Impossible de récupérer le profil', error)
      get().setToken(null)
      set({ status: 'unauthenticated' })
    }
  },

  login: async (email, password) => {
    set({ status: 'loading' })
    try {
      const response = await authService.login(email, password)
      get().setToken(response.token, response.expiresIn)
      set({
        user: {
          id: response.user.id,
          email: response.user.email,
          role: response.user.role,
        },
        status: 'authenticated',
      })
      return true
    } catch (error) {
      console.error('[Auth] Echec de connexion', error)
      set({ status: 'unauthenticated' })
      return false
    }
  },

  refresh: async () => {
    if (!appConfig.apiUrl) return true
    try {
      const response = await authService.refresh()
      get().setToken(response.token, response.expiresIn)
      return true
    } catch (error) {
      console.error('[Auth] Echec de rafraîchissement', error)
      get().logout()
      return false
    }
  },

  logout: () => {
    clearRefreshTimer()
    get().setToken(null)
    set({ user: undefined, status: 'unauthenticated' })
  },
}))

