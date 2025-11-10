import { type Request, type Response, type NextFunction } from 'express'
import { authService } from '../services/authService'

const extractToken = (header?: string) => {
  if (!header) return undefined
  const [type, token] = header.split(' ')
  if (type?.toLowerCase() !== 'bearer' || !token) return undefined
  return token
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req.headers.authorization)
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }
  const payload = authService.verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Token invalide' })
  }
  req.user = payload
  return next()
}

