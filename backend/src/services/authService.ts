import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { type User } from '../domain/user'

export interface AuthTokenPayload {
  sub: string
  email: string
  role: User['role']
}

const demoUser: User = {
  id: 'demo-user',
  email: env.auth.demoUser.email,
  role: 'supervisor',
}

const isValidCredentials = (email: string, password: string) =>
  email === env.auth.demoUser.email && password === env.auth.demoUser.password

export const authService = {
  authenticate: (email: string, password: string): User | null => {
    if (!isValidCredentials(email, password)) return null
    return demoUser
  },
  issueToken: (user: User) => {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    }
    return jwt.sign(payload, env.auth.secret, { expiresIn: '4h' })
  },
  verifyToken: (token: string): AuthTokenPayload | null => {
    try {
      const decoded = jwt.verify(token, env.auth.secret) as AuthTokenPayload
      return decoded
    } catch (error) {
      console.warn('[Auth] Token invalide', error)
      return null
    }
  },
  getDemoUser: () => demoUser,
}

