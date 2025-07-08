import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

type Bindings = {
	DB: D1Database;
	JWT_SECRET: string;
};

export const logs = new Hono<{ Bindings: Bindings }>();

// 檢查日期格式是否為 YYYY-MM-DD
function checkDateFormat(date: string): boolean {
	// 檢查日期格式是否為 YYYY-MM-DD
	return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// 取得當前日期（台北時區）
function getDateInTaipei(): Date {
	const now = new Date();
	const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
	const offsetInMs = 8 * 60 * 60 * 1000; // +8 小時
	const taipeiDate = new Date(utc + offsetInMs);
	taipeiDate.setHours(0, 0, 0, 0); // 設定為 00:00:00.000
	return taipeiDate;
}

// 將 Date 物件格式化為 YYYY-MM-DD 字串
function formatDateToYMD(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份是 0-based
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
// 將 YYYY-MM-DD 字串解析為 Date 物件
function parseYMDToDate(ymd: string): Date {
	const [year, month, day] = ymd.split("-").map(Number);
	return new Date(year, month - 1, day); // 注意：月份是 0-based
}

// ✅ 查詢歷史紀錄（支援日期區間、關鍵字、分頁，預設當天）
logs.get("/api/logs", authMiddleware, async (c) => {
	const user = c.get("user");
	let { start, end, keyword, page = "1" } = c.req.query();

	const conditions: string[] = ["user_id = ?"];
	const binds: any[] = [user.id];

	if (keyword) {
		conditions.push("(log_time LIKE ? OR description LIKE ?)");
		binds.push(`%${keyword}%`, `%${keyword}%`);
	}

	// 分頁處理
	const pageNum = Math.max(parseInt(page), 1);

	const offsetDays = 1 - pageNum;

	// 取得當前日期（台北時區）
	let targetDate = getDateInTaipei();
	let targetDateString = formatDateToYMD(targetDate);

	if (!end) {
		end = targetDateString; // 如果沒有指定結束日期，則使用當天日期
	}
	if (!start) {
		// 如果沒有指定開始日期，則使紀錄最早的日期
		const firstLogDateResult = await c.env.DB.prepare(
			`
    SELECT log_date as log_date FROM food_logs ORDER BY log_date ASC LIMIT 1
  `
		).first();
		// 如果沒有紀錄，則使用當天日期
		start = firstLogDateResult?.log_date ?? targetDateString;
	}

	// 請檢查 start 格式是否正確
	if (!checkDateFormat(start)) {
		return c.json({ message: "開始日期格式錯誤，請使用 YYYY-MM-DD" }, 400);
	}

	// 請檢查 end 格式是否正確
	if (!checkDateFormat(end)) {
		return c.json({ message: "結束日期格式錯誤，請使用 YYYY-MM-DD" }, 400);
	}

	// 如果開始日期大於結束日期
	let endDate = parseYMDToDate(end);
	let startDate = parseYMDToDate(start);
	if (startDate > endDate) {
		//交換
		let temp = startDate;
		startDate = endDate;
		endDate = temp;

		let tempstr = start;
		start = end;
		end = tempstr;
	}

	// console.log("targetDateString:", targetDateString);
	// 是否有下一頁的標記，以日期為主
	let hasNextPage = true;

	endDate.setDate(endDate.getDate() + offsetDays);
	targetDateString = formatDateToYMD(endDate);

	if (startDate >= targetDate) {
		// 如果開始日期已經大於或等於目標日期，則沒有下一頁
		hasNextPage = false;
	}

	// console.log("startDate:", startDate);
	// console.log("targetDate:", targetDate);

	// 取得現在日期
	conditions.push("log_date = ?");
	binds.push(targetDateString);

	// console.log("offsetDays:", offsetDays);
	// console.log("targetDateString:", targetDateString);

	if (start) {
		conditions.push("log_date >= ?");
		binds.push(start);
	}
	if (end) {
		conditions.push("log_date <= ?");
		binds.push(end);
	}

	const whereSQL = `WHERE ${conditions.join(" AND ")}`;
	const sql = `
    SELECT * FROM food_logs
    ${whereSQL}
    ORDER BY log_date DESC, created_at DESC
    `;

	// console.log("SQL:", sql);
	// console.log("Binds:", binds);
	const result = await c.env.DB.prepare(sql)
		.bind(...binds)
		.all();

	return c.json({
		currentPage: pageNum,
		hasNextPage: hasNextPage,
		targetDate: targetDateString,
		results: result.results,
	});
});

// ✅ 新增飲食紀錄
logs.post("/api/logs", authMiddleware, async (c) => {
	const user = c.get("user");
	const body = await c.req.json();

	const { log_date, log_time = null, description = null, source = null, grains = 0, protein = 0, vegetables = 0, fruits = 0, dairy = 0, fats = 0 } = body;

	// 自動營養計算
	const calories =
		grains * 70 +
		protein * 75 +
		vegetables * 25 +
		fruits * 60 +
		dairy * 85 + // 估值（乳品：碳水12g + 蛋白8g ≈ 85 kcal）
		fats * 45;

	const carbs = grains * 15 + vegetables * 5 + fruits * 15 + dairy * 12;

	const proteins = grains * 2 + protein * 7 + vegetables * 1 + dairy * 8;

	const fats_total = protein * 5 + fats * 5;

	await c.env.DB.prepare(
		`
    INSERT INTO food_logs (
      user_id, log_date, log_time, description, source,
      grains, protein, vegetables, fruits, dairy, fats,
      calories, carbs, proteins, fats_total, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+8 hours'))
  `
	)
		.bind(user.id, log_date, log_time, description, source, grains, protein, vegetables, fruits, dairy, fats, calories, carbs, proteins, fats_total)
		.run();

	return c.json({ message: "紀錄成功" });
});

logs.put("/api/logs/:id", authMiddleware, async (c) => {
	const user = c.get("user");
	const id = Number(c.req.param("id"));
	const body = await c.req.json();

	// 先確認該筆屬於此用戶
	const record = await c.env.DB.prepare("SELECT * FROM food_logs WHERE id = ? AND user_id = ?").bind(id, user.id).first();
	if (!record) return c.json({ message: "找不到紀錄或無權限" }, 403);

	const { log_date, log_time = null, description = null, source = null, grains = 0, protein = 0, vegetables = 0, fruits = 0, dairy = 0, fats = 0 } = body;

	const calories = grains * 70 + protein * 75 + vegetables * 25 + fruits * 60 + dairy * 85 + fats * 45;
	const carbs = grains * 15 + vegetables * 5 + fruits * 15 + dairy * 12;
	const proteins = grains * 2 + protein * 7 + vegetables * 1 + dairy * 8;
	const fats_total = protein * 5 + fats * 5;

	await c.env.DB.prepare(
		`
    UPDATE food_logs SET
      log_date=?, log_time=?, description=?, source=?,
      grains=?, protein=?, vegetables=?, fruits=?, dairy=?, fats=?,
      calories=?, carbs=?, proteins=?, fats_total=?, updated_at=datetime('now', '+8 hours')
    WHERE id=? AND user_id=?
  `
	)
		.bind(log_date, log_time, description, source, grains, protein, vegetables, fruits, dairy, fats, calories, carbs, proteins, fats_total, id, user.id)
		.run();

	return c.json({ message: "更新成功" });
});

logs.delete("/api/logs/:id", authMiddleware, async (c) => {
	const user = c.get("user");
	const id = Number(c.req.param("id"));

	const record = await c.env.DB.prepare("SELECT * FROM food_logs WHERE id = ? AND user_id = ?").bind(id, user.id).first();
	if (!record) return c.json({ message: "找不到紀錄或無權限" }, 403);

	await c.env.DB.prepare("DELETE FROM food_logs WHERE id = ? AND user_id = ?").bind(id, user.id).run();
	return c.json({ message: "刪除成功" });
});
