import { appConfig } from '../config/app'
import { httpClient } from './httpClient'

interface LoginResponse {
  data: {
    token: string
    user: {
      id: string
      email: string
      role: 'operator' | 'supervisor'
    }
  }
}

interface MeResponse {
  data: {
    email: string
    role: 'operator' | 'supervisor'
  }
}

export const authService = {
  login: async (email: string, password: string) => {
    if (!appConfig.apiUrl) {
      return {
        token: 'mock-token',
        user: {
          id: 'mock-user',
          email,
          role: 'supervisor' as const,
        },
      }
    }
    const response = await httpClient.post<LoginResponse>('/api/auth/login', { email, password })
    return response.data.data
  },
  me: async () => {
    if (!appConfig.apiUrl) {
      return {
        email: 'demo@cuverie.local',
        role: 'supervisor' as const,
      }
    }
    const response = await httpClient.get<MeResponse>('/api/auth/me')
    return response.data.data
  },
}

