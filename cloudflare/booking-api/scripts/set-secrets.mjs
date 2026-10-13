import { spawn } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectDirectory = dirname(dirname(fileURLToPath(import.meta.url)));

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
      reject(new Error("اجرا باید در ترمینال تعاملی انجام شود."));
      return;
    }
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = "";
    const onData = (chunk) => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          reject(new Error("عملیات لغو شد."));
          return;
        }
        if (character === "\r" || character === "\n") {
          process.stdin.off("data", onData);
          process.stdin.setRawMode(false);
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    process.stdin.on("data", onData);
  });
}

function putSecrets(secrets) {
  return new Promise((resolve, reject) => {
    const wranglerCli = fileURLToPath(new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url));
    const child = spawn(process.execPath, [wranglerCli, "secret", "bulk"], {
      cwd: projectDirectory,
      stdio: ["pipe", "inherit", "inherit"]
    });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`تنظیم secretها ناموفق بود (${code}).`)));
    child.stdin.end(JSON.stringify(secrets));
  });
}

try {
  const password = await readHidden("رمز عبور اولیهٔ پنل را وارد کنید (مخفی): ");
  const repeated = await readHidden("برای اطمینان دوباره وارد کنید (مخفی): ");
  if (password.length < 12 || password !== repeated) throw new Error("دو ورودی یکسان نیستند یا رمز کوتاه‌تر از ۱۲ نویسه است.");
  const salt = randomBytes(16);
  const derived = pbkdf2Sync(password, salt, 210000, 32, "sha256");
  const passwordHash = `pbkdf2-sha256$210000$${salt.toString("base64url")}$${derived.toString("base64url")}`;
  await putSecrets({
    ADMIN_PASSWORD_HASH: passwordHash,
    SESSION_SECRET: randomBytes(32).toString("base64url"),
    RATE_LIMIT_SALT: randomBytes(32).toString("base64url")
  });
  process.stdout.write("سه secret به‌صورت امن ثبت شدند؛ رمز یا هش در فایل ذخیره نشد.\n");
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
