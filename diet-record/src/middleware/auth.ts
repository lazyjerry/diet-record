import { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

type Bindings = {
	JWT_SECRET: string;
};

export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
	const authHeader = c.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ message: "未提供授權 token" }, 401);
	}

	const token = authHeader.split(" ")[1];

	try {
		// 把 encodedJwt 去掉加鹽。加鹽規則是： token 前面有 c.env.JWT_SECRET 字元數量的隨機英文數字符號
		// 這樣可以避免 token 被暴力破解
		const saltLength = c.env.JWT_SECRET.length;
		const encodedJwt = token.slice(saltLength);
		const rawToken = atob(encodedJwt);
		const payload = await verify(rawToken, c.env.JWT_SECRET);
		c.set("user", payload);
		await next();
	} catch (e) {
		return c.json({ message: "無效或過期的 token" }, 401);
	}
};
