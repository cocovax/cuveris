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
  user?: AuthUser
  status: AuthStatus
  setToken: (token: string | null) => void
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const loadInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: loadInitialToken(),
  user: undefined,
  status: 'idle',

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(STORAGE_KEY, token)
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    }
    set({ token })
  },

  initialize: async () => {
    if (!appConfig.apiUrl) {
      set({
        token: 'mock-token',
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
      get().setToken(response.token)
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

  logout: () => {
    get().setToken(null)
    set({ user: undefined, status: 'unauthenticated' })
  },
}))

