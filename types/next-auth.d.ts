import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      unitId: string | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    unitId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    unitId: string | null
  }
}
