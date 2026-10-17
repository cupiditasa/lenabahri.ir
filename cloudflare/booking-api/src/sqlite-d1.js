import Database from "better-sqlite3";
import { Buffer } from "node:buffer";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const migrationsDirectory = fileURLToPath(new URL("../migrations/", import.meta.url));

class SqliteD1Statement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.values = [];
  }

  bind(...values) {
    this.values = values.map((value) => {
      if (value instanceof ArrayBuffer) return Buffer.from(value);
      if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
      return value;
    });
    return this;
  }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: result.changes, last_row_id: result.lastInsertRowid } };
  }

  async all() {
    const results = this.database.prepare(this.sql).all(...this.values);
    return { success: true, results, meta: { changes: results.length } };
  }

  async first(columnName) {
    const result = this.database.prepare(this.sql).get(...this.values);
    return columnName && result ? result[columnName] : result || null;
  }
}

class SqliteD1Database {
  constructor(database) {
    this.database = database;
  }

  prepare(sql) {
    return new SqliteD1Statement(this.database, sql);
  }

  async batch(statements) {
    const execute = this.database.transaction(() => statements.map((statement) => {
      const result = this.database.prepare(statement.sql).run(...statement.values);
      return { success: true, meta: { changes: result.changes, last_row_id: result.lastInsertRowid } };
    }));
    return execute();
  }

  close() {
    this.database.close();
  }
}

function applyMigrations(database, directory) {
  database.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)");
  const migrationFiles = readdirSync(directory).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  for (const migrationId of migrationFiles) {
    const applied = database.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get(migrationId);
    if (applied) continue;
    const migration = readFileSync(resolve(directory, migrationId), "utf8");
    database.transaction(() => {
      database.exec(migration);
      database.prepare("INSERT INTO schema_migrations (id) VALUES (?)").run(migrationId);
    })();
  }
}

export function openBookingDatabase(filePath) {
  if (!filePath) throw new Error("BOOKING_DB_PATH must be set.");
  if (filePath !== ":memory:") mkdirSync(dirname(resolve(filePath)), { recursive: true, mode: 0o700 });
  const database = new Database(filePath);
  database.pragma("busy_timeout = 5000");
  database.pragma("foreign_keys = ON");
  if (filePath !== ":memory:") database.pragma("journal_mode = WAL");
  database.pragma("synchronous = FULL");
  applyMigrations(database, migrationsDirectory);
  return new SqliteD1Database(database);
}
