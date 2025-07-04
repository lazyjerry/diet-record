import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export const logs = new Hono<{ Bindings: Bindings }>()

// ✅ 查詢歷史紀錄（支援日期區間、關鍵字、分頁，預設近三天）
logs.get('/api/logs', authMiddleware, async (c) => {
  const user = c.get('user')
  const { start, end, keyword, page = '1', limit = '10' } = c.req.query()

  const conditions: string[] = ['user_id = ?']
  const binds: any[] = [user.id]

  if (start) {
    conditions.push('log_date >= ?')
    binds.push(start)
  }

  if (end) {
    conditions.push('log_date <= ?')
    binds.push(end)
  }

  if (keyword) {
    conditions.push('(log_time LIKE ? OR description LIKE ?)')
    binds.push(`%${keyword}%`, `%${keyword}%`)
  }

  if (!start && !end) {
    conditions.push('log_date >= date("now", "-3 days")')
  }

  const whereSQL = `WHERE ${conditions.join(' AND ')}`

  // 分頁處理
  const pageNum = Math.max(parseInt(page), 1)
  const limitNum = Math.max(parseInt(limit), 1)
  const offset = (pageNum - 1) * limitNum

  const result = await c.env.DB.prepare(`
    SELECT * FROM food_logs
    ${whereSQL}
    ORDER BY log_date DESC, log_time DESC
    LIMIT ? OFFSET ?
  `).bind(...binds, limitNum, offset).all()

  // 總筆數（分頁用）
  const countRes = await c.env.DB.prepare(`
    SELECT COUNT(*) as total FROM food_logs ${whereSQL}
  `).bind(...binds).first()

  return c.json({
    total: countRes?.total || 0,
    page: pageNum,
    limit: limitNum,
    results: result.results,
  })
})

// ✅ 新增飲食紀錄
logs.post('/api/logs', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  const {
    log_date,
    log_time = null,
    description = null,
    source = null,
    grains = 0,
    protein = 0,
    vegetables = 0,
    fruits = 0,
    dairy = 0,
    fats = 0
  } = body

  // 自動營養計算
  const calories =
    grains * 70 +
    protein * 75 +
    vegetables * 25 +
    fruits * 60 +
    dairy * 85 +     // 估值（乳品：碳水12g + 蛋白8g ≈ 85 kcal）
    fats * 45

  const carbs =
    grains * 15 +
    vegetables * 5 +
    fruits * 15 +
    dairy * 12

  const proteins =
    grains * 2 +
    protein * 7 +
    vegetables * 1 +
    dairy * 8

  const fats_total =
    protein * 5 +
    fats * 5

  await c.env.DB.prepare(`
    INSERT INTO food_logs (
      user_id, log_date, log_time, description, source,
      grains, protein, vegetables, fruits, dairy, fats,
      calories, carbs, proteins, fats_total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    user.id, log_date, log_time, description, source,
    grains, protein, vegetables, fruits, dairy, fats,
    calories, carbs, proteins, fats_total
  ).run()

  return c.json({ message: '紀錄成功' })
})

logs.put('/api/logs/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const id = Number(c.req.param('id'))
  const body = await c.req.json()

  // 先確認該筆屬於此用戶
  const record = await c.env.DB.prepare('SELECT * FROM food_logs WHERE id = ? AND user_id = ?').bind(id, user.id).first()
  if (!record) return c.json({ message: '找不到紀錄或無權限' }, 403)

  const {
    log_date, log_time = null, description = null, source = null,
    grains = 0, protein = 0, vegetables = 0, fruits = 0, dairy = 0, fats = 0
  } = body

  const calories = grains * 70 + protein * 75 + vegetables * 25 + fruits * 60 + dairy * 85 + fats * 45
  const carbs = grains * 15 + vegetables * 5 + fruits * 15 + dairy * 12
  const proteins = grains * 2 + protein * 7 + vegetables * 1 + dairy * 8
  const fats_total = protein * 5 + fats * 5

  await c.env.DB.prepare(`
    UPDATE food_logs SET
      log_date=?, log_time=?, description=?, source=?,
      grains=?, protein=?, vegetables=?, fruits=?, dairy=?, fats=?,
      calories=?, carbs=?, proteins=?, fats_total=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND user_id=?
  `).bind(
    log_date, log_time, description, source,
    grains, protein, vegetables, fruits, dairy, fats,
    calories, carbs, proteins, fats_total,
    id, user.id
  ).run()

  return c.json({ message: '更新成功' })
})

logs.delete('/api/logs/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const id = Number(c.req.param('id'))

  const record = await c.env.DB.prepare('SELECT * FROM food_logs WHERE id = ? AND user_id = ?').bind(id, user.id).first()
  if (!record) return c.json({ message: '找不到紀錄或無權限' }, 403)

  await c.env.DB.prepare('DELETE FROM food_logs WHERE id = ? AND user_id = ?').bind(id, user.id).run()
  return c.json({ message: '刪除成功' })
})