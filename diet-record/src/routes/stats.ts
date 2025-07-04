import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DB: D1Database
}

export const stats = new Hono<{ Bindings: Bindings }>()

stats.get('/api/stats', authMiddleware, async (c) => {
  const user = c.get('user')
  const range = c.req.query('range') || '7days'
  const start = c.req.query('start')
  const end = c.req.query('end')
  const compare = c.req.query('compare') === 'true'

  const makeSql = (range: string, start?: string, end?: string) => {
    const conditions: string[] = ['user_id = ?']
    const binds: any[] = [user.id]

    if (range === 'today') {
      conditions.push(`log_date = date('now')`)
    } else if (range === 'yesterday') {
      conditions.push(`log_date = date('now', '-1 day')`)
    } else if (range === '7days') {
      conditions.push(`log_date >= date('now', '-6 days')`)
    } else if (range === '30days') {
      conditions.push(`log_date >= date('now', '-29 days')`)
    } else if (range === 'month') {
      conditions.push(`strftime('%Y-%m', log_date) = strftime('%Y-%m', 'now')`)
    } else if (range === 'custom') {
      if (start) {
        conditions.push('log_date >= ?')
        binds.push(start)
      }
      if (end) {
        conditions.push('log_date <= ?')
        binds.push(end)
      }
    } else if (range === 'compare_7days') {
      conditions.push(`log_date BETWEEN date('now', '-13 days') AND date('now', '-7 days')`)
    } else if (range === 'compare_30days') {
      conditions.push(`log_date BETWEEN date('now', '-59 days') AND date('now', '-30 days')`)
    }

    const sql = `
      SELECT log_date,
        SUM(grains) as grains,
        SUM(protein) as protein,
        SUM(vegetables) as vegetables,
        SUM(fruits) as fruits,
        SUM(dairy) as dairy,
        SUM(fats) as fats,
        SUM(calories) as calories,
        SUM(carbs) as carbs,
        SUM(proteins) as proteins,
        SUM(fats_total) as fats_total
      FROM food_logs
      WHERE ${conditions.join(' AND ')}
      GROUP BY log_date
      ORDER BY log_date ASC
    `

    return { sql, binds }
  }

  const { sql, binds } = makeSql(range, start, end)
  const current = await c.env.DB.prepare(sql).bind(...binds).all()

  if (!compare) return c.json(current.results)

  // 計算比較區間（目前只對 7days 與 30days 支援）
  let compareRange = ''
  if (range === '7days') {
    compareRange = 'compare_7days'
  } else if (range === '30days') {
    compareRange = 'compare_30days'
  }

  if (!compareRange) {
    return c.json({ current: current.results, previous: [] })
  }

  const { sql: prevSql, binds: prevBinds } = makeSql(compareRange)
  const previous = await c.env.DB.prepare(prevSql).bind(...prevBinds).all()

  return c.json({ current: current.results, previous: previous.results })
})