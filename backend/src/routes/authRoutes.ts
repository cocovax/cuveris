import { Router } from 'express'
import { z } from 'zod'
import { authService } from '../services/authService'
import { authenticate } from '../middleware/authMiddleware'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authRoutes = Router()

authRoutes.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const user = authService.authenticate(parsed.data.email, parsed.data.password)
  if (!user) {
    return res.status(401).json({ error: 'Identifiants incorrects' })
  }
  const token = authService.issueToken(user)
  return res.json({
    data: {
      token,
      user,
      expiresIn: authService.tokenTtlSeconds,
    },
  })
})

authRoutes.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  return res.json({ data: req.user })
})

authRoutes.post('/refresh', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  const user = authService.userFromPayload(req.user)
  const token = authService.issueToken(user)
  return res.json({
    data: {
      token,
      expiresIn: authService.tokenTtlSeconds,
    },
  })
})

