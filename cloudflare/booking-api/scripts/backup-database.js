import Database from "better-sqlite3";
import { chmodSync, mkdirSync, readdirSync, renameSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const sourcePath = process.env.BOOKING_DB_PATH;
const backupDirectory = process.env.BACKUP_DIR;

if (!sourcePath || !backupDirectory) throw new Error("BOOKING_DB_PATH and BACKUP_DIR must be set.");
if (sourcePath === ":memory:") throw new Error("In-memory databases cannot be backed up.");

process.umask(0o077);
mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
const timestamp = new Date().toISOString().replaceAll(":", "-");
const fileName = `lena-bookings-${timestamp}.sqlite`;
const backupPath = join(backupDirectory, fileName);
const temporaryPath = `${backupPath}.tmp`;
const database = new Database(resolve(sourcePath), { readonly: true, fileMustExist: true, timeout: 5000 });

try {
  await database.backup(temporaryPath);
} catch (error) {
  try { unlinkSync(temporaryPath); } catch {}
  throw error;
} finally {
  database.close();
}

chmodSync(temporaryPath, 0o600);
renameSync(temporaryPath, backupPath);
const backups = readdirSync(backupDirectory)
  .filter((name) => /^lena-bookings-.*\.sqlite$/.test(name))
  .sort()
  .reverse();
for (const staleBackup of backups.slice(7)) unlinkSync(join(backupDirectory, staleBackup));
process.stdout.write(`Database backup created: ${fileName}\n`);
