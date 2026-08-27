-- 服务端 SQLite 建表脚本（与 docs/database-design.md 保持一致）。
-- 运行期 database.ts 内嵌同名 SQL，避免构建时复制文件；本文件作为可读参考。

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT,
  breed TEXT,
  gender TEXT,
  photo TEXT,
  personality TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS weight_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  weight REAL,
  body_length REAL,
  status TEXT,
  note TEXT,
  created_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS growth_photos (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  photo TEXT,
  caption TEXT,
  created_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feeding_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  food_type TEXT,
  amount REAL,
  note TEXT,
  created_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS drinking_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  amount REAL,
  note TEXT,
  created_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bedding_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  bedding_type TEXT,
  note TEXT,
  created_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bath_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  bath_type TEXT,
  note TEXT,
  created_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_records (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  wheel_minutes INTEGER,
  active_level INTEGER,
  active_time_range TEXT,
  note TEXT,
  created_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  date TEXT NOT NULL,
  health_score INTEGER,
  weight REAL,
  activity_minutes INTEGER,
  summary TEXT,
  generated_at TEXT,
  FOREIGN KEY(pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weight_pet_date ON weight_records(pet_id, date);
CREATE INDEX IF NOT EXISTS idx_feeding_pet_date ON feeding_records(pet_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_pet_date ON activity_records(pet_id, date);
