import 'express'
import { type AuthTokenPayload } from '../services/authService'

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthTokenPayload
  }
}

