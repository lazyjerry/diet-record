import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export const auth = new Hono<{ Bindings: Bindings }>()

// JWT 建立函式（使用 HS256 + 7d 有效期）
async function createJwt(payload: object, secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret)
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

auth.post('/api/login', async (c) => {
  const { username, password, name } = await c.req.json()
  if (!username || !password) {
    return c.json({ message: '帳號與密碼必填' }, 400)
  }

  const db = c.env.DB
  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()

  // ✅ 已存在帳號 → 驗證密碼
  if (user) {
    const match = await bcrypt.compare(password, user.password)
    if (!match) return c.json({ message: '密碼錯誤' }, 401)

    const token = await createJwt({ id: user.id, name: user.name }, c.env.JWT_SECRET)
    return c.json({ token })
  }

  // ✅ 首位註冊用戶（僅限一次）
  const count = await db.prepare('SELECT COUNT(*) as count FROM users').first()
  if (count.count === 0 && name) {
    const hash = await bcrypt.hash(password, 10)
    await db.prepare(
      'INSERT INTO users (username, password, name) VALUES (?, ?, ?)'
    ).bind(username, hash, name).run()

    const newUser = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
    const token = await createJwt({ id: newUser.id, name: newUser.name }, c.env.JWT_SECRET)
    return c.json({ token })
  }

  return c.json({ message: '帳號不存在或無法註冊' }, 401)
})