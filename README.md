# 🥗 diet-record 飲食紀錄系統

一個以 Hono + Cloudflare D1 + Bootstrap 製作的飲食紀錄系統，支援：

## 🔧 功能介紹

- 🧑‍💼 使用者管理
  - 支援多用戶註冊（可透過環境變數控制是否開放）
  - JWT 驗證與 User-Agent 安全驗證
- 🥗 飲食紀錄管理
  - 支援六大類食物輸入，並自動估算熱量與營養素
  - 提供資料查詢、篩選、分頁與 CRUD 編輯功能
  - 新增或編輯餐點時，過去輸入過的內容會自動保存，方便重複使用
- 📈 統計分析與圖表
  - 支援快速範圍（今天／昨天／七日／30 日／自訂）
  - 顯示每日攝取、營養組成趨勢折線圖與圓餅圖
  - 提供統計摘要（天數、總筆數、平均每日記錄）
  - 含六大類與三大營養素的總計與每筆平均

## 📄 頁面預覽

- `login.html`：帳號密碼登入與註冊
- `logs.html`：
  - 飲食紀錄表單（新增／查詢／編輯／刪除）
  - 可搜尋時間、描述，支援分頁與排序
- `report.html`：
  - 圖表分析（六大類營養素／三大營養素趨勢）
  - 表格統計摘要，平均與總計資料

---

## 📁 專案結構

```bash
diet-record/
├── public/                 # 靜態前端頁面與資源
│   ├── login.html          # 登入與註冊畫面
│   ├── logs.html           # 飲食紀錄表單
│   ├── report.html         # 統計分析與圖表
│   ├── js/                 # 前端 JS 模組（模組化管理）
│   │   ├── auth.js
│   │   ├── logs-form.js
│   │   ├── logs-table.js
│   │   ├── nutrition.js
│   │   ├── report.js
│   │   └── user-profile.js
│   └── css/
│       └── style.css       # 自訂樣式
├── src/                    # Workers 後端程式
│   ├── index.ts            # Worker 入口與路由整合
│   ├── routes/
│   │   ├── auth.ts         # /api/login 登入／註冊
│   │   ├── logs.ts         # /api/logs CRUD 操作
│   │   └── stats.ts        # /api/stats 統計分析
│   └── middleware/
│       └── auth.ts         # JWT 驗證中介層
├── wrangler.toml           # Workers 設定（D1、靜態資源）
├── init.sql                # D1 資料表結構初始化
└── README.md
```

---

## 🚀 部署步驟

### 1. 安裝依賴套件

```bash
npm install
```

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

- 系統支援多用戶註冊，預設僅允許第一位用戶註冊（單人模式）
- 可透過環境變數 `ALLOW_MULTI_USER=true` 切換為開放註冊（多用戶模式）

⸻

📜 License

MIT License

## 📝 Changelog

### 2025-07-06

- 完成飲食紀錄 CRUD 與使用者登入驗證功能
- 加入 JWT 與 User-Agent 驗證機制，提升登入安全性

### 2025-07-08

- 新增統計頁面，支援六大類與三大營養素的圖表顯示
- 實作每日總計與平均的營養素統計摘要
- 優化 logs.html 搜尋與分頁機制

### 2025-07-09

- 改善描述欄位 UX，導入 Tagify 並支援自動儲存常用標籤
- 實作記錄編輯時自動帶入 Tagify 標籤格式
- 加入 Chart 圖表單位、標題與 responsive 排版邏輯

### 2025-07-10

- 新增多用戶註冊切換（透過 `ALLOW_MULTI_USER` 環境變數控制）
- 新增 token 加鹽與 User-Agent 雙重驗證機制
- 實作統計比較分析區段（支援近七日與近 30 日比較）
- 加入 PWA manifest 設定與 icon
- SQLite 資料表加入多組 index 提升效能
