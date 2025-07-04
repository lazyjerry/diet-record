import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { sign } from 'hono/jwt'
import bcrypt from 'bcryptjs'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/api/login', async (c) => {
  const { username, password, name } = await c.req.json()

  if (!username || !password) {
    return c.json({ message: '帳號與密碼必填' }, 400)
  }

  const db = c.env.DB

  // 查詢該帳號
  const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()

  // 若帳號存在 → 驗證密碼
  if (user) {
    const passMatch = await bcrypt.compare(password, user.password)
    if (!passMatch) return c.json({ message: '密碼錯誤' }, 401)

    const token = await sign({ id: user.id, name: user.name }, c.env.JWT_SECRET, { expiresIn: '7d' })
    return c.json({ token })
  }

  // 若帳號不存在 → 僅允許第一位註冊
  const count = await db.prepare('SELECT COUNT(*) as count FROM users').first()
  if (count.count === 0 && name) {
    const hash = await bcrypt.hash(password, 10)
    await db.prepare(
      'INSERT INTO users (username, password, name) VALUES (?, ?, ?)'
    ).bind(username, hash, name).run()

    const newUser = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first()
    const token = await sign({ id: newUser.id, name: newUser.name }, c.env.JWT_SECRET, { expiresIn: '7d' })
    return c.json({ token })
  }

  return c.json({ message: '帳號不存在或無法註冊' }, 401)
})