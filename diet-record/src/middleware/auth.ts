import { MiddlewareHandler } from 'hono'
import { jwtVerify } from 'jose'

type Bindings = {
  JWT_SECRET: string
}

export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ message: '未提供授權 token' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const key = new TextEncoder().encode(c.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, key)
    c.set('user', payload)
    await next()
  } catch (e) {
    return c.json({ message: '無效或過期的 token' }, 401)
  }
}