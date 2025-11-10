import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { type User } from '../domain/user'

export interface AuthTokenPayload {
  sub: string
  email: string
  role: User['role']
}

const TOKEN_TTL_SECONDS = 4 * 60 * 60

const demoUser: User = {
  id: 'demo-user',
  email: env.auth.demoUser.email,
  role: 'supervisor',
}

const isValidCredentials = (email: string, password: string) =>
  email === env.auth.demoUser.email && password === env.auth.demoUser.password

const buildPayload = (user: User): AuthTokenPayload => ({
  sub: user.id,
  email: user.email,
  role: user.role,
})

export const authService = {
  tokenTtlSeconds: TOKEN_TTL_SECONDS,
  authenticate: (email: string, password: string): User | null => {
    if (!isValidCredentials(email, password)) return null
    return demoUser
  },
  issueToken: (user: User, expiresIn = TOKEN_TTL_SECONDS) => {
    const payload = buildPayload(user)
    return jwt.sign(payload, env.auth.secret, { expiresIn })
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
  userFromPayload: (payload: AuthTokenPayload): User => ({
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  }),
  getDemoUser: () => demoUser,
}

