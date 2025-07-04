# 🥗 diet-record 飲食紀錄系統

一個以 Hono + Cloudflare D1 + Bootstrap 製作的飲食紀錄系統，支援：

- Basic Auth 登入（僅允許首位使用者註冊）
- 六大類食物份量輸入與熱量自動計算
- 飲食紀錄 CRUD 功能（新增／查詢／編輯／刪除）
- JWT 驗證保護 API
- 統計頁面（七日／本月分析）
- 靜態前端頁面使用 Bootstrap + AJAX 操作 API

---

## 📁 專案結構
```bash
diet-record/
├── public/                 # 靜態前端頁面（login, logs, report）
│   ├── login.html
│   ├── logs.html
│   └── report.html
├── src/                    # Workers 後端程式
│   ├── index.ts            # Worker 入口與路由整合
│   ├── routes/
│   │   ├── auth.ts         # /api/login 登入／註冊
│   │   ├── logs.ts         # /api/logs CRUD 操作
│   │   └── stats.ts        # /api/stats 統計分析
│   └── middleware/
│       └── auth.ts         # JWT 驗證中介層
├── wrangler.toml           # Workers 設定（D1 綁定）
├── init.sql                # D1 資料表結構
└── README.md
```
---

## 🚀 部署步驟

### 1. 安裝依賴套件

```bash
npm install

2. 初始化資料庫（D1）

wrangler d1 create diet-record-db
wrangler d1 execute diet-record-db --file=init.sql

更新 wrangler.toml：

```bash
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "diet-record",
  "main": "src/index.ts",
  "compatibility_date": "2025-07-03",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "diet-record-db",
      "database_id": "<你的資料庫 ID>"
    }
  ],
  "observability": {
		"enabled": true
	},
	"assets": {
		"directory": "./public",
		"binding": "ASSETS"
	}
}
```

3. 設定 JWT 密鑰

wrangler secret put JWT_SECRET

4. 啟動開發伺服器（本機）

wrangler dev

訪問 http://localhost:8787 自行測試

⸻

🛡 使用者登入說明
- 首次註冊僅允許第一位用戶輸入名字建立帳號（自動註冊）
-	後續只能登入，無法新增其他用戶

⸻

📊 功能預覽
-	login.html：帳號密碼登入／註冊
-	logs.html：六大類食物輸入、歷史紀錄查詢、編輯、刪除
-	report.html：近七日或本月營養趨勢圖表

⸻

📜 License

MIT License