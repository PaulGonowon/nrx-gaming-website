const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");

const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
const usePg = Boolean(DATABASE_URL);

const MIME_BY_EXT = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

let pool = null;

if (usePg) {
  const { Pool } = require("pg");
  let host = "";
  let normalizedUrl = DATABASE_URL;
  try {
    const u = new URL(DATABASE_URL);
    host = u.hostname;
    // pg treats sslmode=require as verify-full, which fails against Supabase's
    // pooler certificate chain; TLS is enabled via the ssl option below instead.
    u.searchParams.delete("sslmode");
    u.searchParams.delete("channel_binding");
    normalizedUrl = u.toString();
  } catch {}
  const localHost = /^(localhost|127\.0\.0\.1|::1|\[::1\])$/.test(host);

  pool = new Pool({
    connectionString: normalizedUrl,
    ssl: localHost ? false : { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
  });
  pool.on("error", (err) => console.error("[storage] idle client error:", err.message));
}

function safeName(name) {
  const base = path.basename(String(name || ""));
  if (!base || base === "." || base === "..") return null;
  return base;
}

function filePath(name) {
  return path.join(DATA_DIR, name + ".json");
}

function mimeOf(name) {
  const ext = String(name).split(".").pop().toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

async function init() {
  if (!usePg) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    return;
  }

  await pool.query(
    "CREATE TABLE IF NOT EXISTS docs (collection TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())"
  );
  await pool.query(
    "CREATE TABLE IF NOT EXISTS uploads (name TEXT PRIMARY KEY, mime TEXT NOT NULL, data BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())"
  );
  await importLocalUploads();
}

// One-time import of public/uploads files when the uploads table is still empty,
// so photos that exist on disk before the switch to Postgres are not lost.
async function importLocalUploads() {
  try {
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM uploads");
    if (rows[0].n > 0) return;
    if (!fs.existsSync(UPLOADS_DIR)) return;

    let imported = 0;
    for (const entry of fs.readdirSync(UPLOADS_DIR)) {
      const name = safeName(entry);
      if (!name || name === ".gitkeep") continue;
      try {
        const p = path.join(UPLOADS_DIR, entry);
        if (!fs.statSync(p).isFile()) continue;
        const buffer = fs.readFileSync(p);
        if (!buffer.length) continue;
        await pool.query(
          "INSERT INTO uploads (name, mime, data) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING",
          [name, mimeOf(name), buffer]
        );
        imported++;
      } catch (err) {
        console.error("[storage] could not import upload", entry + ":", err.message);
      }
    }
    if (imported) console.log("[storage] imported " + imported + " local upload(s) into Postgres");
  } catch (err) {
    console.error("[storage] upload import failed:", err.message);
  }
}

async function readDoc(name) {
  if (usePg) {
    const { rows } = await pool.query("SELECT data FROM docs WHERE collection = $1", [name]);
    return rows.length ? rows[0].data : undefined;
  }

  const file = filePath(name);
  if (!fs.existsSync(file)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

async function writeDoc(name, value) {
  if (usePg) {
    await pool.query(
      "INSERT INTO docs (collection, data) VALUES ($1, $2::jsonb) " +
        "ON CONFLICT (collection) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
      [name, JSON.stringify(value === undefined ? null : value)]
    );
    return;
  }
  fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2));
}

// Seeds only when the document has never been stored, so deletions survive
// restarts. Existing local data/*.json files win over the built-in defaults
// when migrating to Postgres for the first time.
async function seedDoc(name, seed) {
  if (usePg) {
    const { rows } = await pool.query("SELECT 1 FROM docs WHERE collection = $1", [name]);
    if (rows.length) return;

    let value = seed;
    const localFile = filePath(name);
    if (fs.existsSync(localFile)) {
      try {
        value = JSON.parse(fs.readFileSync(localFile, "utf8"));
        console.log("[storage] seeding \"" + name + "\" from local file");
      } catch {
        value = seed;
      }
    }
    await pool.query(
      "INSERT INTO docs (collection, data) VALUES ($1, $2::jsonb) ON CONFLICT (collection) DO NOTHING",
      [name, JSON.stringify(value === undefined ? null : value)]
    );
    return;
  }

  const file = filePath(name);
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(seed, null, 2));
}

async function putUpload(name, mime, buffer) {
  const n = safeName(name);
  if (!n) throw new Error("Invalid upload name.");

  if (usePg) {
    await pool.query(
      "INSERT INTO uploads (name, mime, data) VALUES ($1, $2, $3) " +
        "ON CONFLICT (name) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data",
      [n, mime, buffer]
    );
    return;
  }
  fs.writeFileSync(path.join(UPLOADS_DIR, n), buffer);
}

async function getUpload(name) {
  const n = safeName(name);
  if (!n) return null;

  if (usePg) {
    const { rows } = await pool.query("SELECT mime, data FROM uploads WHERE name = $1", [n]);
    if (!rows.length) return null;
    return { mime: rows[0].mime, data: rows[0].data };
  }

  const file = path.join(UPLOADS_DIR, n);
  if (!fs.existsSync(file)) return null;
  return { mime: mimeOf(n), data: fs.readFileSync(file) };
}

async function deleteUpload(name) {
  const n = safeName(name);
  if (!n) return;

  if (usePg) {
    await pool.query("DELETE FROM uploads WHERE name = $1", [n]);
    return;
  }
  try {
    fs.unlinkSync(path.join(UPLOADS_DIR, n));
  } catch {}
}

module.exports = {
  driver: usePg ? "postgres" : "local-files",
  init,
  readDoc,
  writeDoc,
  seedDoc,
  putUpload,
  getUpload,
  deleteUpload,
};
