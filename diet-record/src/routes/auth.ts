import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { authMiddleware } from "../middleware/auth";

type Bindings = {
	DB: D1Database;
	JWT_SECRET: string;
};

export const auth = new Hono<{ Bindings: Bindings }>();

// JWT 建立函式（使用 HS256 + 7d 有效期）
async function createJwt(payload: object, secret: string): Promise<string> {
	// 請幫我判斷 secret 有多少字元，產生該字元數量的隨機英文數字符號作為 prefix
	const prefix = Array.from({ length: secret.length }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 65)).join("");
	const salted = `${prefix}${btoa(rawToken)}`;
	return salted;
}

// 新增 JWT 驗證 API
auth.get("/api/verify", authMiddleware, async (c) => {
	const payload = c.get("user");

	// 驗證 UA 是否一致（可視情況保留或省略）
	const ua = c.req.header("user-agent") || "";
	if (payload.ua !== ua) {
		return c.json({ valid: false, reason: "UA 不符" }, 401);
	}

	return c.json({ valid: true, payload });
});

auth.put("/api/user", authMiddleware, async (c) => {
	const { id } = c.get("user");
	const { name, password } = await c.req.json();
	if (!name) return c.json({ message: "名稱為必填" }, 400);

	const db = c.env.DB;
	if (password) {
		const hash = await bcrypt.hash(password, 10);
		await db.prepare("UPDATE users SET name=?, password=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name, hash, id).run();
	} else {
		await db.prepare("UPDATE users SET name=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name, id).run();
	}

	return c.json({ message: "ok" });
});

auth.get("/api/user-count", async (c) => {
	const result = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
	return c.json({ count: result.count });
});

auth.post("/api/login", async (c) => {
	const { username, password, name } = await c.req.json();
	if (!username || !password) {
		return c.json({ message: "帳號與密碼必填" }, 400);
	}

	const db = c.env.DB;
	const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();

	// ✅ 已存在帳號 → 驗證密碼
	if (user) {
		const match = await bcrypt.compare(password, user.password);
		if (!match) return c.json({ message: "密碼錯誤" }, 401);

		const token = await createJwt({ id: user.id, name: user.name, ua: c.req.header("user-agent") }, c.env.JWT_SECRET);
		return c.json({ token });
	}

	// ✅ 首位註冊用戶（僅限一次）
	const count = await db.prepare("SELECT COUNT(*) as count FROM users").first();
	if (count.count === 0 && name) {
		const hash = await bcrypt.hash(password, 10);
		await db.prepare("INSERT INTO users (username, password, name) VALUES (?, ?, ?)").bind(username, hash, name).run();

		const newUser = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
		const token = await createJwt({ id: newUser.id, name: newUser.name, ua: c.req.header("user-agent") }, c.env.JWT_SECRET);
		return c.json({ token });
	}

	return c.json({ message: "帳號不存在或無法註冊" }, 401);
});
