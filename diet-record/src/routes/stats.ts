import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

type Bindings = {
	DB: D1Database;
};

export const stats = new Hono<{ Bindings: Bindings }>();

stats.get("/api/stats", authMiddleware, async (c) => {
	const user = c.get("user");
	const range = c.req.query("range") || "7days";
	const start = c.req.query("start");
	const end = c.req.query("end");
	const compare = c.req.query("compare") === "true";

	const makeSql = (range: string, start?: string, end?: string) => {
		const conditions: string[] = ["user_id = ?"];
		const binds: any[] = [user.id];

		if (range === "today") {
			conditions.push(`log_date = date('now', '+8 hours')`);
		} else if (range === "yesterday") {
			conditions.push(`log_date = date('now', '-1 day', '+8 hours')`);
		} else if (range === "7days") {
			conditions.push(`log_date >= date('now', '-6 days', '+8 hours')`);
		} else if (range === "30days") {
			conditions.push(`log_date >= date('now', '-29 days', '+8 hours')`);
		} else if (range === "custom") {
			if (start) {
				conditions.push("log_date >= ?");
				binds.push(start);
			}
			if (end) {
				conditions.push("log_date <= ?");
				binds.push(end);
			}
		} else if (range === "compare_7days") {
			conditions.push(`log_date BETWEEN date('now', '-13 days', '+8 hours') AND date('now', '-7 days', '+8 hours')`);
		} else if (range === "compare_30days") {
			conditions.push(`log_date BETWEEN date('now', '-59 days', '+8 hours') AND date('now', '-30 days', '+8 hours')`);
		}

		const whereClause = conditions.join(" AND ");

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
      WHERE ${whereClause}
      GROUP BY log_date
      ORDER BY log_date ASC
    `;

		const countSql = `SELECT COUNT(*) as total FROM food_logs WHERE ${whereClause}`;

		return { sql, countSql, whereClause, binds };
	};

	const { sql, countSql, binds } = makeSql(range, start, end);
	const current = await c.env.DB.prepare(sql)
		.bind(...binds)
		.all();

	// 查詢指定範圍內 food_logs 的總數
	const countResult = await c.env.DB.prepare(countSql)
		.bind(...binds)
		.first();
	const totalCount = countResult?.total || 0;

	if (!compare) return c.json({ data: current.results, totalCount });

	// 計算比較區間（目前只對 7days 與 30days 支援）
	let compareRange = "";
	if (range === "7days") {
		compareRange = "compare_7days";
	} else if (range === "30days") {
		compareRange = "compare_30days";
	}

	if (!compareRange) {
		return c.json({ current: current.results, previous: [], totalCount });
	}

	const { sql: prevSql, binds: prevBinds } = makeSql(compareRange);
	const previous = await c.env.DB.prepare(prevSql)
		.bind(...prevBinds)
		.all();

	return c.json({
		current: current.results,
		previous: previous.results,
		totalCount,
	});
});
