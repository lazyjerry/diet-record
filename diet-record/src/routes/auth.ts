import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { authMiddleware } from "../middleware/auth";

type Bindings = {
	DB: D1Database;
	JWT_SECRET: string;
	ALLOW_MULTI_USER: string; // 是否允許多用戶註冊
};

export const auth = new Hono<{ Bindings: Bindings }>();

// JWT 建立函式（使用 HS256 + 7d 有效期）
async function createJwt(payload: object, secret: string): Promise<string> {
	// 請幫我判斷 secret 有多少字元，產生該字元數量的隨機英文數字符號作為 prefix
	// const prefix = Array.from({ length: secret.length }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 65)).join("");
	// const salted = `${btoa(JSON.stringify(payload))}`;
	// console.log("prefix:", prefix);
	// console.log("salted:", salted);
	const key = new TextEncoder().encode(secret);
	return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key);
}

// 新增 JWT 驗證 API
auth.post("/api/verify", authMiddleware, async (c) => {
	const payload = c.get("user");

	// 驗證 UA 是否一致（可視情況保留或省略）
	const ua = c.req.header("user-agent") || "";
	if (payload.ua !== ua) {
		return c.json({ valid: false, reason: "UA 不符" }, 401);
	}

	return c.json({ valid: true, payload });
});

// 更新用戶
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

// 取得用戶數量
auth.get("/api/user-count", async (c) => {
	const result = await c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
	const allowRegister = c.env.ALLOW_MULTI_USER === "true";
	return c.json({ count: result.count, allowRegister: allowRegister });
});

// 登入或註冊 API
auth.post("/api/login", async (c) => {
	const { username, password, name } = await c.req.json();
	if (!username || !password) {
		return c.json({ message: "帳號與密碼必填" }, 400);
	}

	const db = c.env.DB;

	if (!name) {
		const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();

		// ✅ 已存在帳號 → 驗證密碼
		if (user) {
			const match = await bcrypt.compare(password, user.password);
			if (!match) return c.json({ message: "密碼錯誤" }, 401);

			const token = await createJwt({ id: user.id, name: user.name, ua: c.req.header("user-agent") }, c.env.JWT_SECRET);
			return c.json({ token });
		}
	}

	// 檢查是否允許註冊
	const allowRegister = c.env.ALLOW_MULTI_USER === "true" || (await db.prepare("SELECT COUNT(*) as count FROM users").first()).count === 0;

	if (allowRegister && name) {
		// 檢查 username 是否已存在
		const existingUser = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
		if (existingUser) {
			return c.json({ message: "帳號已存在，如果需要登入姓名欄位請留空" }, 409);
		}
		const hash = await bcrypt.hash(password, 10);
		await db.prepare("INSERT INTO users (username, password, name) VALUES (?, ?, ?)").bind(username, hash, name).run();

		const newUser = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
		const token = await createJwt({ id: newUser.id, name: newUser.name, ua: c.req.header("user-agent") }, c.env.JWT_SECRET);
		return c.json({ token });
	}

	return c.json({ message: "帳號不存在或無法註冊" }, 401);
});
