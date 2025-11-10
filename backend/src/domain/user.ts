export type UserRole = 'operator' | 'supervisor'

export interface User {
  id: string
  email: string
  role: UserRole
}

