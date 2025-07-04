import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DB: D1Database
}

export const stats = new Hono<{ Bindings: Bindings }>()

stats.get('/api/stats', authMiddleware, async (c) => {
  const user = c.get('user')
  const type = c.req.query('range') || '7days'

  const sql =
    type === 'month'
      ? `
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
        WHERE user_id = ? AND strftime('%Y-%m', log_date) = strftime('%Y-%m', 'now')
        GROUP BY log_date ORDER BY log_date ASC
      `
      : `
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
        WHERE user_id = ? AND log_date >= date('now', '-6 days')
        GROUP BY log_date ORDER BY log_date ASC
      `

  const result = await c.env.DB.prepare(sql).bind(user.id).all()
  return c.json(result.results)
})