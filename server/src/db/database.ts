// SQLite 数据访问层：使用 Node 24 内置的 node:sqlite（实验性，但无需原生编译）。
// 通过 createRequire 加载，避免依赖 @types/node 对 node:sqlite 的类型支持版本。
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

// 最小类型声明：只描述本项目用到的 node:sqlite API。
interface StatementSync {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): Record<string, unknown> | undefined;
  all(...params: unknown[]): Record<string, unknown>[];
}

interface DatabaseSync {
  prepare(sql: string): StatementSync;
  exec(sql: string): void;
}

const sqlite = require('node:sqlite') as { DatabaseSync: new (path: string) => DatabaseSync };

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'hamster.db');
mkdirSync(DATA_DIR, { recursive: true });

// 内嵌建表 SQL，与同目录 schema.sql 保持一致。
const SCHEMA_SQL = `
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
`;

export const db: DatabaseSync = new sqlite.DatabaseSync(DB_PATH);
db.exec(SCHEMA_SQL);

type CamelToSnake = Record<string, string>;

/** 实体表配置：camelCase 字段 -> snake_case 列名。 */
const TABLES: Record<string, { columns: CamelToSnake; hasPetId: boolean; orderBy: string }> = {
  pets: {
    columns: {
      id: 'id',
      name: 'name',
      birthDate: 'birth_date',
      breed: 'breed',
      gender: 'gender',
      photo: 'photo',
      personality: 'personality',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    hasPetId: false,
    orderBy: 'created_at',
  },
  weight_records: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      weight: 'weight',
      bodyLength: 'body_length',
      status: 'status',
      note: 'note',
      createdAt: 'created_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
  growth_photos: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      photo: 'photo',
      caption: 'caption',
      createdAt: 'created_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
  feeding_records: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      foodType: 'food_type',
      amount: 'amount',
      note: 'note',
      createdAt: 'created_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
  drinking_records: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      amount: 'amount',
      note: 'note',
      createdAt: 'created_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
  bedding_records: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      beddingType: 'bedding_type',
      note: 'note',
      createdAt: 'created_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
  bath_records: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      bathType: 'bath_type',
      note: 'note',
      createdAt: 'created_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
  activity_records: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      wheelMinutes: 'wheel_minutes',
      activeLevel: 'active_level',
      activeTimeRange: 'active_time_range',
      note: 'note',
      createdAt: 'created_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
  daily_reports: {
    columns: {
      id: 'id',
      petId: 'pet_id',
      date: 'date',
      healthScore: 'health_score',
      weight: 'weight',
      activityMinutes: 'activity_minutes',
      summary: 'summary',
      generatedAt: 'generated_at',
    },
    hasPetId: true,
    orderBy: 'date',
  },
};

function camelizeKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}

export function isKnownTable(table: string): boolean {
  return Boolean(TABLES[table]);
}

export function upsertEntity(table: string, record: Record<string, unknown>): void {
  const def = TABLES[table];
  if (!def) throw new Error(`未知实体类型: ${table}`);
  if (!record.id) throw new Error('记录缺少 id 字段');

  const entries = Object.entries(def.columns).filter(([camel]) => record[camel] !== undefined);
  const columns = entries.map(([, snake]) => snake);
  const values = entries.map(([camel]) => record[camel]);
  const placeholders = columns.map(() => '?').join(', ');
  const updateSet = columns
    .filter((col) => col !== 'id')
    .map((col) => `${col} = excluded.${col}`)
    .join(', ');

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updateSet}`;
  db.prepare(sql).run(...values);
}

export function deleteEntity(table: string, id: string): void {
  if (!TABLES[table]) throw new Error(`未知实体类型: ${table}`);
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

export function getEntity(table: string, id: string): Record<string, unknown> | undefined {
  if (!TABLES[table]) throw new Error(`未知实体类型: ${table}`);
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  return row ? camelizeKeys(row) : undefined;
}

export function listEntities(
  table: string,
  petId?: string,
): Record<string, unknown>[] {
  const def = TABLES[table];
  if (!def) throw new Error(`未知实体类型: ${table}`);

  let sql = `SELECT * FROM ${table}`;
  const params: unknown[] = [];
  if (def.hasPetId && petId) {
    sql += ' WHERE pet_id = ?';
    params.push(petId);
  }
  sql += ` ORDER BY ${def.orderBy} ASC, created_at ASC`;
  return db.prepare(sql).all(...params).map(camelizeKeys);
}
