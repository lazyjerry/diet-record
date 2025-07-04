-- 用戶登入資料表（Basic Auth）
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,               -- 可支援 bcrypt 加密
  name TEXT NOT NULL,
  is_valid INTEGER DEFAULT 1,           -- 1: 有效, 0: 停用
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 飲食紀錄資料表
CREATE TABLE food_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,             -- 對應 users.id

  -- 記錄時間（可自訂或使用 created_at）
  log_date TEXT NOT NULL,               -- 用戶自填 格式建議：YYYY-MM-DD
  log_time TEXT DEFAULT NULL,           -- 用戶自填 選填，例如：08:00 或 早餐
  -- 備註與資料來源（可作為後續 AI 分析用）
  description TEXT DEFAULT NULL,        -- 用戶自填描述
  source TEXT DEFAULT NULL,             -- 例如：自己輸入、API、照片分析等

  -- 六大類食物份量（浮點數，單位為份）
  grains REAL DEFAULT 0.0,              -- 用戶自填 全穀雜糧類（1份 ≈ 70 kcal，碳水15 g，蛋白質2 g）
  protein REAL DEFAULT 0.0,             -- 用戶自填 豆魚蛋肉類（1份 ≈ 75 kcal，蛋白7 g，脂肪5 g）
  vegetables REAL DEFAULT 0.0,          -- 用戶自填 蔬菜類（1份 ≈ 25 kcal，碳水5 g，蛋白1 g）
  fruits REAL DEFAULT 0.0,              -- 用戶自填 水果類（1份 ≈ 60 kcal，碳水15 g）
  dairy REAL DEFAULT 0.0,               -- 用戶自填 乳品類（1份 ≈ 12 g碳水，8 g蛋白質）
  fats REAL DEFAULT 0.0,                -- 用戶自填 油脂與堅果種子（1份 ≈ 45 kcal，脂肪5 g）

  -- 營養總計（自動計算或記錄）
  calories REAL DEFAULT 0.0,            -- 熱量 單位：kcal 千卡
  carbs REAL DEFAULT 0.0,               -- 碳水 單位：g 克
  proteins REAL DEFAULT 0.0,            -- 蛋白 單位：g 克
  fats_total REAL DEFAULT 0.0,          -- 油脂 單位：g 克

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);