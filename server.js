require("dotenv").config({ quiet: true });

const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const storage = require("./storage");

const app = express();
const PORT = process.env.PORT || 3000;

// Behind Render's reverse proxy so req.ip / req.secure are correct
app.set("trust proxy", 1);

const ADMIN_USERNAME = process.env.NRX_ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.NRX_ADMIN_PASS || "NRX@Admin2024";

/* ------------------------------------------------------------------ */
/*  JSON store helpers                                                 */
/* ------------------------------------------------------------------ */
const PHOTO_RE = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)$/;

async function removePhoto(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return;
  await storage.deleteUpload(url);
}

// Reads/writes through storage: Postgres when DATABASE_URL is set, local JSON otherwise.
function collection(name, seed) {
  return {
    seed: () => storage.seedDoc(name, seed),
    async read() {
      const value = await storage.readDoc(name);
      return value === undefined ? seed : value;
    },
    write: (data) => storage.writeDoc(name, data),
  };
}

/* ------------------------------------------------------------------ */
/*  Users / admin account                                              */
/* ------------------------------------------------------------------ */
const users = collection("users", [
  {
    id: crypto.randomUUID(),
    username: ADMIN_USERNAME,
    password: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    role: "admin",
    displayName: "NRX Administrator",
    createdAt: new Date().toISOString(),
  },
]);

function readUsers() {
  return users.read();
}
function writeUsers(list) {
  return users.write(list);
}

/* ------------------------------------------------------------------ */
/*  Activity logs (records every action on the site)                   */
/* ------------------------------------------------------------------ */
const activity = collection("activity", []);

function logActivity(req, action, detail, userOverride) {
  const s = req.session && req.session.user;
  return activity
    .read()
    .then((list) => {
      list.unshift({
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        user: userOverride || (s && s.username) || "guest",
        role: (s && s.role) || "",
        ip: req.ip || "",
        action,
        detail: detail || "",
      });
      return activity.write(list.slice(0, 500));
    })
    .catch((err) => console.error("[activity] write failed:", err.message));
}

/* ------------------------------------------------------------------ */
/*  Site data (public roster / stats)                                  */
/* ------------------------------------------------------------------ */
const siteStats = collection("siteStats", {
  wins: 128,
  tournaments: 47,
  members: 1320,
  followers: 86400,
  announcements: [
    "NRX Gaming qualifies for the Southeast Asia Masters 2024.",
    "New Valorant roster unveiled — meet NRX.Vyper and NRX.Orbit.",
    "Merch drop: NRX x Voidline limited edition jersey is live.",
  ],
});

/* ------------------------------------------------------------------ */
/*  Editable collections (CRUD)                                        */
/* ------------------------------------------------------------------ */
const members = collection("members", [
  { id: crypto.randomUUID(), ingameName: "NRX.Vyper", fullName: "Marco Reyes", email: "vyper@nrx.gg", role: "Player", team: "Valorant", status: "Active", joinedAt: "2023-02-14" },
  { id: crypto.randomUUID(), ingameName: "NRX.Zenith", fullName: "Liam Santos", email: "zenith@nrx.gg", role: "Player", team: "CS2", status: "Active", joinedAt: "2023-03-02" },
  { id: crypto.randomUUID(), ingameName: "NRX.Kaizen", fullName: "Jared Cruz", email: "kaizen@nrx.gg", role: "Player", team: "MLBB", status: "Active", joinedAt: "2022-11-20" },
  { id: crypto.randomUUID(), ingameName: "NRX.Nova", fullName: "Ana Dela Cruz", email: "nova@nrx.gg", role: "Player", team: "Dota 2", status: "Active", joinedAt: "2023-01-09" },
  { id: crypto.randomUUID(), ingameName: "NRX.Coach", fullName: "Ruel Bautista", email: "coach@nrx.gg", role: "Coach", team: "All", status: "Active", joinedAt: "2021-08-01" },
  { id: crypto.randomUUID(), ingameName: "NRX.Orbit", fullName: "Ken Villamor", email: "orbit@nrx.gg", role: "Player", team: "Valorant", status: "Pending", joinedAt: "2024-05-12" },
]);

const teams = collection("teams", [
  { id: crypto.randomUUID(), name: "NRX Valorant", game: "Valorant", region: "SEA", manager: "Ruel Bautista", status: "Active", roster: "NRX.Vyper, NRX.Orbit, NRX.Kaze, NRX.Lumen, NRX.Sable" },
  { id: crypto.randomUUID(), name: "NRX CS2", game: "CS2", region: "SEA", manager: "Ruel Bautista", status: "Active", roster: "NRX.Zenith, NRX.Blitz, NRX.Frost, NRX.Echo, NRX.Rift" },
  { id: crypto.randomUUID(), name: "NRX MLBB", game: "Mobile Legends", region: "PH", manager: "Grace Lim", status: "Active", roster: "NRX.Kaizen, NRX.Riptide, NRX.Yuki, NRX.Drake, NRX.Mika" },
  { id: crypto.randomUUID(), name: "NRX Dota 2", game: "Dota 2", region: "SEA", manager: "Grace Lim", status: "Academy", roster: "NRX.Nova, NRX.Apex, NRX.Cinder, NRX.Rune, NRX.Wisp" },
]);

const championships = collection("championships", [
  { id: crypto.randomUUID(), name: "SEA Masters Season 4", game: "Valorant", team: "NRX Valorant", placement: "1st Place", prize: "₱1,500,000", venue: "Singapore", date: "2024-03-18", status: "Champion" },
  { id: crypto.randomUUID(), name: "PH National Cup 2023", game: "Mobile Legends", team: "NRX MLBB", placement: "2nd Place", prize: "₱500,000", venue: "Manila", date: "2023-10-07", status: "Runner-up" },
  { id: crypto.randomUUID(), name: "APAC Clash Finals", game: "CS2", team: "NRX CS2", placement: "3rd Place", prize: "₱250,000", venue: "Bangkok", date: "2023-07-22", status: "Qualified" },
  { id: crypto.randomUUID(), name: "Campus Esports League", game: "Dota 2", team: "NRX Dota 2", placement: "1st Place", prize: "₱80,000", venue: "Online", date: "2022-12-11", status: "Champion" },
]);

const sponsorships = collection("sponsorships", [
  { id: crypto.randomUUID(), name: "Voidline Peripherals", type: "Sponsor", tier: "Platinum", contactPerson: "Ella Torres", email: "ella@voidline.co", amount: "₱2,000,000", startDate: "2024-01-01", endDate: "2024-12-31", status: "Active" },
  { id: crypto.randomUUID(), name: "HyperFuel Energy", type: "Partner", tier: "Gold", contactPerson: "Mark Dizon", email: "mark@hyperfuel.ph", amount: "₱850,000", startDate: "2024-02-15", endDate: "2025-02-14", status: "Active" },
  { id: crypto.randomUUID(), name: "NeonByte Studios", type: "Sponsor", tier: "Silver", contactPerson: "Carla Uy", email: "partners@neonbyte.gg", amount: "₱300,000", startDate: "2023-09-01", endDate: "2024-08-31", status: "Expired" },
]);

const contracts = collection("contracts", [
  { id: crypto.randomUUID(), party: "NRX.Vyper", type: "Player Contract", position: "Duelist / Valorant", value: "₱85,000 / month", startDate: "2024-01-15", endDate: "2025-01-14", status: "Active" },
  { id: crypto.randomUUID(), party: "NRX.Kaizen", type: "Player Contract", position: "Mid Laner / MLBB", value: "₱72,000 / month", startDate: "2023-09-01", endDate: "2025-08-31", status: "Active" },
  { id: crypto.randomUUID(), party: "Voidline Peripherals", type: "Sponsorship Contract", position: "Platinum Sponsor", value: "₱2,000,000 / year", startDate: "2024-01-01", endDate: "2024-12-31", status: "Expiring" },
  { id: crypto.randomUUID(), party: "NRX.Riptide", type: "Player Contract", position: "Jungler / MLBB", value: "₱60,000 / month", startDate: "2023-11-01", endDate: "2024-10-31", status: "Expired" },
  { id: crypto.randomUUID(), party: "NRX.Orbit", type: "Tryout Agreement", position: "IGL / Valorant", value: "Trial period", startDate: "2024-05-12", endDate: "2024-07-12", status: "Draft" },
]);

/* ------------------------------------------------------------------ */
/*  Landing page content (editable from the dashboard)                 */
/* ------------------------------------------------------------------ */
const games = collection("games", [
  { id: crypto.randomUUID(), name: "ROS Legacy", description: "Battle royale roots — where the NRX legacy began and our first titles were won.", tag: "Active Roster", image: "/img/games/ros-legacy.jpg", order: 1 },
  { id: crypto.randomUUID(), name: "Call of Duty: Mobile", description: "Mobile FPS firepower — ranked climbs, scrims, and tournament-ready gunplay.", tag: "Active Roster", image: "/img/games/codm.jpg", order: 2 },
  { id: crypto.randomUUID(), name: "Mobile Legends: Bang Bang", description: "Fast-paced MOBA dominance across Philippine and SEA circuits.", tag: "Active Roster", image: "/img/games/mlbb.jpg", order: 3 },
]);

const matches = collection("matches", [
  { id: crypto.randomUUID(), teamA: "NRX", teamB: "Voidline", meta: "LIVE • BO3", scoreA: "1", scoreB: "1", order: 1 },
  { id: crypto.randomUUID(), teamA: "NRX", teamB: "Apex Nine", meta: "UPCOMING • 20:00 PHT", scoreA: "", scoreB: "", order: 2 },
  { id: crypto.randomUUID(), teamA: "NRX", teamB: "Solstice", meta: "UPCOMING • SEA Masters", scoreA: "", scoreB: "", order: 3 },
]);

// Public admin profiles shown on the landing page — separate from login accounts.
const publicAdmins = collection("admins", []);

const siteContent = collection("siteContent", {
  hero: {
    badge: "Southeast Asia • Tier 1 Roster",
    titleBefore: "WE BLEED",
    titleAccent: "BLACK AND YELLOW",
    tagline: "#FORVICTORY",
    subtitle:
      "NRX Gaming is a professional esports organization forged for championship runs in ROS Legacy, Call of Duty: Mobile and Mobile Legends: Bang Bang.",
    ctaPrimary: { label: "View Tournaments", href: "#tournaments" },
    ctaSecondary: { label: "Meet The Admins", href: "#admins" },
  },
  stats: [
    { value: 200, suffix: "+", label: "Match Wins" },
    { value: 47, suffix: "", label: "Tournaments" },
    { value: 50, suffix: "+", label: "Members" },
    { value: 172, suffix: "K", label: "Followers" },
  ],
  about: {
    kicker: "// Who We Are",
    titleBefore: "About",
    titleAccent: "Us",
    paragraphs: [
      "NRX Gaming was founded and established on July 2018 by Likeanaa, Jayzee, Ziepy, 6ix9ine, Kyaaah, Peter, Soul, and Rheeze.",
      "NRX Gaming is a clan that first originated in Rules of Survival Mobile, Rules of Survival PC Asia, Call of Duty Mobile, Sausage Man, Valorant, and Mobile Legends.",
      "Not only is NRX Gaming on various platforms — it is also characterized by diversity. We are composed of members not only from the Philippines but also Cambodia, Indonesia, Vietnam, and Thailand. Our diverse background makes us stand out amongst other organizations because this shows that diversity makes us stronger.",
      "We aim to be one of the best in the pro-gaming scene, where we shall maintain great sportsmanship and camaraderie.",
    ],
    facts: ["Est. July 2018", "8 Founding Members", "PH · KH · ID · VN · TH"],
  },
  cta: {
    titleBefore: "Ready to join the",
    titleAccent: "NRX",
    titleAfter: "movement?",
    subtitle: "Partner with a roster built for the world stage.",
    button: "Sign In to Admin Console",
  },
  footer: {
    text: "NRX Gaming. All rights reserved. Built for the win.",
  },
});

/* ------------------------------------------------------------------ */
/*  Middleware                                                         */
/* ------------------------------------------------------------------ */
app.use(express.json({ limit: "8mb" }));

// Sessions live in Postgres when DATABASE_URL is set (survive restarts/deploys),
// and fall back to express-session's MemoryStore for local runs without a database.
function createSessionStore() {
  if (storage.driver !== "postgres" || !storage.pool) return undefined;
  const PgStore = require("connect-pg-simple")(session);
  return new PgStore({
    pool: storage.pool,
    tableName: "session",
    disableTouch: true,
  });
}

app.use(
  session({
    name: "nrx.sid",
    secret: process.env.NRX_SESSION_SECRET || "nrx-gaming-session-secret",
    store: createSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: "auto", maxAge: 1000 * 60 * 60 * 4 },
  })
);

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}

// Drops a user's stored sessions. Used when a password changes so old
// logins (other devices, or a compromised account) stop working.
async function revokeUserSessions(userId, exceptSid) {
  if (!storage.pool) return;
  try {
    const sql =
      "DELETE FROM \"session\" WHERE sess -> 'user' ->> 'id' = $1" +
      (exceptSid ? " AND sid <> $2" : "");
    await storage.pool.query(sql, exceptSid ? [userId, exceptSid] : [userId]);
  } catch (err) {
    console.error("[session] could not revoke sessions:", err.message);
  }
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(401).json({ ok: false, error: "Authentication required." });
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === "admin") return next();
  res.status(403).json({ ok: false, error: "Admin privileges required." });
}

function requireStaff(req, res, next) {
  const u = req.session && req.session.user;
  if (u && (u.role === "admin" || u.role === "staff")) return next();
  res.status(403).json({ ok: false, error: "Staff privileges required." });
}

const loginAttempts = new Map();
function throttleLogin(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const entry = loginAttempts.get(key) || { count: 0, ts: now };
  if (now - entry.ts > 60_000) {
    entry.count = 0;
    entry.ts = now;
  }
  if (entry.count >= 8) {
    return res.status(429).json({ ok: false, error: "Too many attempts. Try again in a minute." });
  }
  entry.count += 1;
  loginAttempts.set(key, entry);
  next();
}

// Wraps async handlers so rejections reach Express' error handler instead of hanging.
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ------------------------------------------------------------------ */
/*  Realtime updates (Server-Sent Events)                              */
/* ------------------------------------------------------------------ */
const eventClients = new Set();

// Tells every connected browser which resource just changed so open
// pages can re-fetch it without a manual refresh.
function broadcastChange(resource) {
  if (!eventClients.size) return;
  const payload = "event: change\ndata: " + JSON.stringify({ resource, ts: Date.now() }) + "\n\n";
  for (const client of eventClients) {
    try {
      client.write(payload);
    } catch {
      eventClients.delete(client);
    }
  }
}

app.get("/api/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write("retry: 3000\n\n");
  eventClients.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(heartbeat);
      eventClients.delete(res);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    eventClients.delete(res);
  });
});

/* ------------------------------------------------------------------ */
/*  Auth routes                                                        */
/* ------------------------------------------------------------------ */
app.post("/api/login", throttleLogin, ah(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "Username and password are required." });
  }

  const attempted = String(username).trim();
  const allUsers = await readUsers();
  const user = allUsers.find(
    (u) => u.username.toLowerCase() === attempted.toLowerCase()
  );
  const genericError = { ok: false, error: "Invalid username or password." };
  if (!user) {
    await logActivity(req, "login", "Failed sign-in attempt", attempted || "unknown");
    return res.status(401).json(genericError);
  }

  const valid = await bcrypt.compare(String(password), user.password);
  if (!valid) {
    await logActivity(req, "login", "Failed sign-in attempt", user.username);
    return res.status(401).json(genericError);
  }

  const list = await readUsers();
  const fresh = list.find((u) => u.id === user.id) || user;
  fresh.lastLogin = new Date().toISOString();
  await writeUsers(list);

  // Fresh session id on login so a pre-set cookie cannot be reused (fixation).
  await regenerateSession(req);

  req.session.user = {
    id: fresh.id,
    username: fresh.username,
    role: fresh.role,
    displayName: fresh.displayName,
  };
  await logActivity(req, "login", "Signed in to the admin console", fresh.username);

  res.json({
    ok: true,
    user: { username: fresh.username, role: fresh.role, displayName: fresh.displayName },
  });
}));

app.post("/api/logout", ah(async (req, res) => {
  await logActivity(req, "logout", "Signed out");
  req.session.destroy(() => {
    res.clearCookie("nrx.sid");
    res.json({ ok: true });
  });
}));

app.get("/api/session", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ ok: true, authenticated: true, user: req.session.user });
  }
  res.json({ ok: true, authenticated: false });
});

/* ------------------------------------------------------------------ */
/*  My account (any signed-in user)                                    */
/* ------------------------------------------------------------------ */
app.get("/api/me", requireAuth, ah(async (req, res) => {
  const u = (await readUsers()).find((x) => x.id === req.session.user.id);
  if (!u) return res.status(401).json({ ok: false, error: "Account not found." });
  res.json({ ok: true, user: publicUser(u) });
}));

app.post("/api/me/password", requireAuth, ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const u = (await readUsers()).find((x) => x.id === req.session.user.id);
  if (!u) return res.status(401).json({ ok: false, error: "Account not found." });

  const valid = await bcrypt.compare(String(currentPassword || ""), u.password);
  if (!valid) {
    return res.status(400).json({ ok: false, error: "Current password is incorrect." });
  }
  const pass = String(newPassword || "");
  if (pass.length < 8) {
    return res.status(400).json({ ok: false, error: "New password must be at least 8 characters." });
  }
  if (pass === String(currentPassword || "")) {
    return res.status(400).json({ ok: false, error: "New password must be different from the current one." });
  }

  const list = await readUsers();
  const idx = list.findIndex((x) => x.id === u.id);
  list[idx].password = bcrypt.hashSync(pass, 10);
  list[idx].passwordChangedAt = new Date().toISOString();
  await writeUsers(list);
  await revokeUserSessions(u.id, req.sessionID);
  await logActivity(req, "password", "Changed own account password");
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/*  Public site data                                                   */
/* ------------------------------------------------------------------ */
const ROSTER_ICONS = ["🔥", "🎯", "⚔️", "🌌", "🌊", "🛰️"];
app.get("/api/roster", ah(async (req, res) => {
  const players = (await members.read())
    .filter((m) => m.role === "Player")
    .slice(0, 6)
    .map((m, i) => ({
      tag: m.ingameName,
      role: m.team || "Player",
      game: m.team || "NRX",
      img: ROSTER_ICONS[i % ROSTER_ICONS.length],
      photo: m.photo || "",
      wins: 150 + i * 41,
    }));
  res.json({ ok: true, players });
}));

app.get("/api/stats", ah(async (req, res) => {
  res.json({ ok: true, stats: await siteStats.read() });
}));

/* ------------------------------------------------------------------ */
/*  Generic CRUD factory for admin records                             */
/* ------------------------------------------------------------------ */
function labelOf(record, fields) {
  for (const k of fields) if (String(record[k] || "").trim()) return String(record[k]);
  return record.name || record.party || record.ingameName || "record";
}
function singular(n) {
  return n.replace(/s$/, "");
}

function registerCrud(name, store, requiredFields) {
  const base = "/api/admin/" + name;
  const entity = singular(name);

  app.get(base, requireAuth, requireStaff, ah(async (req, res) => {
    res.json({ ok: true, items: await store.read() });
  }));

  app.post(base, requireAuth, requireStaff, ah(async (req, res) => {
    const body = req.body || {};
    const missing = requiredFields.filter((f) => !String(body[f] ?? "").trim());
    if (missing.length) {
      return res.status(400).json({ ok: false, error: "Missing fields: " + missing.join(", ") });
    }
    const record = { id: crypto.randomUUID() };
    for (const key of Object.keys(body)) {
      if (key === "id") continue;
      record[key] = body[key];
    }
    const list = await store.read();
    list.unshift(record);
    await store.write(list);
    await logActivity(req, "create", entity + " \u201c" + labelOf(record, requiredFields) + "\u201d");
    broadcastChange(name);
    res.status(201).json({ ok: true, item: record });
  }));

  app.put(base + "/:id", requireAuth, requireStaff, ah(async (req, res) => {
    const list = await store.read();
    const idx = list.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ ok: false, error: "Record not found." });

    const body = req.body || {};
    const oldPhoto = list[idx].photo;
    const merged = { ...list[idx], ...body, id: list[idx].id };
    const missing = requiredFields.filter((f) => !String(merged[f] ?? "").trim());
    if (missing.length) {
      return res.status(400).json({ ok: false, error: "Missing fields: " + missing.join(", ") });
    }
    list[idx] = merged;
    await store.write(list);
    if (oldPhoto && oldPhoto !== merged.photo) await removePhoto(oldPhoto);
    await logActivity(req, "update", entity + " \u201c" + labelOf(merged, requiredFields) + "\u201d");
    broadcastChange(name);
    res.json({ ok: true, item: merged });
  }));

  app.delete(base + "/:id", requireAuth, requireStaff, ah(async (req, res) => {
    const list = await store.read();
    const existing = list.find((i) => i.id === req.params.id);
    if (!existing) return res.status(404).json({ ok: false, error: "Record not found." });
    await store.write(list.filter((i) => i.id !== req.params.id));
    if (existing.photo) await removePhoto(existing.photo);
    await logActivity(req, "delete", entity + " \u201c" + labelOf(existing, requiredFields) + "\u201d");
    broadcastChange(name);
    res.json({ ok: true });
  }));
}

registerCrud("members", members, ["ingameName", "fullName", "email", "role", "status"]);
registerCrud("teams", teams, ["name", "game", "status"]);
registerCrud("championships", championships, ["name", "game", "team", "placement", "date"]);
registerCrud("sponsorships", sponsorships, ["name", "type", "tier", "status"]);
registerCrud("contracts", contracts, ["party", "type", "status"]);

/* Landing page records (editable from the dashboard) */
registerCrud("games", games, ["name"]);
registerCrud("matches", matches, ["teamA", "teamB"]);
registerCrud("admins", publicAdmins, ["name"]);

/* ------------------------------------------------------------------ */
/*  Member photo upload (base64 -> /uploads)                           */
/* ------------------------------------------------------------------ */
app.post("/api/admin/upload-photo", requireAuth, requireStaff, ah(async (req, res) => {
  const { dataUrl } = req.body || {};
  const match = PHOTO_RE.exec(String(dataUrl || ""));
  if (!match) {
    return res.status(400).json({ ok: false, error: "Invalid image. Use PNG, JPEG, WebP or GIF." });
  }
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  const buffer = Buffer.from(match[2].replace(/\r?\n/g, ""), "base64");
  if (!buffer.length) {
    return res.status(400).json({ ok: false, error: "Empty image data." });
  }
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(413).json({ ok: false, error: "Image is too large. Maximum 5MB." });
  }
  const name = crypto.randomUUID() + "." + ext;
  const mime = "image/" + (ext === "jpg" ? "jpeg" : ext);
  await storage.putUpload(name, mime, buffer);
  await logActivity(req, "upload", "Photo uploaded (" + (buffer.length / 1024).toFixed(0) + "KB)");
  broadcastChange("members");
  res.status(201).json({ ok: true, url: "/uploads/" + name });
}));

app.delete("/api/admin/upload-photo", requireAuth, requireStaff, ah(async (req, res) => {
  const url = (req.body || {}).url;
  await removePhoto(String(url || ""));
  broadcastChange("members");
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/*  Dashboard summary + announcements                                  */
/* ------------------------------------------------------------------ */
app.get("/api/admin/summary", requireAuth, requireStaff, ah(async (req, res) => {
  const [m, t, c, s, ct, list] = await Promise.all([
    members.read(),
    teams.read(),
    championships.read(),
    sponsorships.read(),
    contracts.read(),
    readUsers(),
  ]);
  res.json({
    ok: true,
    summary: {
      members: m.length,
      activeMembers: m.filter((x) => x.status === "Active").length,
      teams: t.length,
      championships: c.length,
      titles: c.filter((ch) => ch.status === "Champion").length,
      sponsorships: s.length,
      activeSponsors: s.filter((sp) => sp.status === "Active").length,
      contracts: ct.length,
      activeContracts: ct.filter((k) => k.status === "Active").length,
      users: list.length,
    },
    recentMembers: m.slice(0, 5),
    recentChampionships: c.slice(0, 4),
  });
}));

app.get("/api/admin/announcements", requireAuth, requireStaff, ah(async (req, res) => {
  const stats = await siteStats.read();
  res.json({ ok: true, announcements: stats.announcements || [] });
}));

app.post("/api/admin/announcement", requireAuth, requireStaff, ah(async (req, res) => {
  const { message } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ ok: false, error: "Announcement message is required." });
  }
  const msg = String(message).trim();
  const stats = await siteStats.read();
  const announcements = [msg, ...(stats.announcements || [])].slice(0, 6);
  await siteStats.write({ ...stats, announcements });
  await logActivity(req, "announce", "Published: " + msg.slice(0, 140));
  broadcastChange("announcements");
  broadcastChange("stats");
  res.json({ ok: true, announcements });
}));

/* ------------------------------------------------------------------ */
/*  Landing page text content (siteContent)                            */
/* ------------------------------------------------------------------ */
app.get("/api/admin/content", requireAuth, requireStaff, ah(async (req, res) => {
  res.json({ ok: true, content: await siteContent.read() });
}));

app.put("/api/admin/content", requireAuth, requireStaff, ah(async (req, res) => {
  const body = req.body || {};
  const current = await siteContent.read();

  const str = (v, fallback) => (typeof v === "string" ? v : fallback || "");
  const lines = (v, fallback) =>
    Array.isArray(v)
      ? v.map((x) => String(x)).filter((x) => x.trim())
      : typeof v === "string"
      ? v.split("\n").map((x) => x.trim()).filter(Boolean)
      : fallback || [];

  const heroIn = body.hero || {};
  const aboutIn = body.about || {};
  const ctaIn = body.cta || {};
  const footerIn = body.footer || {};
  const heroPrimary = heroIn.ctaPrimary || {};
  const heroSecondary = heroIn.ctaSecondary || {};

  const next = {
    hero: {
      badge: str(heroIn.badge, current.hero.badge),
      titleBefore: str(heroIn.titleBefore, current.hero.titleBefore),
      titleAccent: str(heroIn.titleAccent, current.hero.titleAccent),
      tagline: str(heroIn.tagline, current.hero.tagline),
      subtitle: str(heroIn.subtitle, current.hero.subtitle),
      ctaPrimary: {
        label: str(heroPrimary.label, current.hero.ctaPrimary.label),
        href: str(heroPrimary.href, current.hero.ctaPrimary.href),
      },
      ctaSecondary: {
        label: str(heroSecondary.label, current.hero.ctaSecondary.label),
        href: str(heroSecondary.href, current.hero.ctaSecondary.href),
      },
    },
    stats: Array.isArray(body.stats)
      ? body.stats.slice(0, 8).map((s) => ({
          value: Number(s && s.value) || 0,
          suffix: str(s && s.suffix, ""),
          label: str(s && s.label, ""),
        }))
      : current.stats,
    about: {
      kicker: str(aboutIn.kicker, current.about.kicker),
      titleBefore: str(aboutIn.titleBefore, current.about.titleBefore),
      titleAccent: str(aboutIn.titleAccent, current.about.titleAccent),
      paragraphs: lines(aboutIn.paragraphs, current.about.paragraphs),
      facts: lines(aboutIn.facts, current.about.facts),
    },
    cta: {
      titleBefore: str(ctaIn.titleBefore, current.cta.titleBefore),
      titleAccent: str(ctaIn.titleAccent, current.cta.titleAccent),
      titleAfter: str(ctaIn.titleAfter, current.cta.titleAfter),
      subtitle: str(ctaIn.subtitle, current.cta.subtitle),
      button: str(ctaIn.button, current.cta.button),
    },
    footer: { text: str(footerIn.text, current.footer.text) },
  };

  await siteContent.write(next);
  await logActivity(req, "update", "landing page content");
  broadcastChange("content");
  res.json({ ok: true, content: next });
}));

/* ------------------------------------------------------------------ */
/*  User accounts (admin only)                                         */
/* ------------------------------------------------------------------ */
function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName || u.username,
    role: u.role,
    title: u.title || "",
    photo: u.photo || "",
    createdAt: u.createdAt || "",
    lastLogin: u.lastLogin || "",
    passwordChangedAt: u.passwordChangedAt || "",
  };
}

function sortByOrder(list) {
  return list.slice().sort((a, b) => {
    const hasA = a.order !== undefined && a.order !== null && a.order !== "";
    const hasB = b.order !== undefined && b.order !== null && b.order !== "";
    const na = hasA ? Number(a.order) : 999;
    const nb = hasB ? Number(b.order) : 999;
    if (na !== nb) return na - nb;
    return String(a.name || a.teamA || "").localeCompare(String(b.name || b.teamA || ""));
  });
}

function publicAdmin(a) {
  return {
    id: a.id,
    name: a.name || "",
    title: a.title || "",
    role: a.role || "",
    photo: a.photo || "",
  };
}

// Everything the landing page renders, in a single request.
app.get("/api/site", ah(async (req, res) => {
  const [content, gameList, matchList, adminList] = await Promise.all([
    siteContent.read(),
    games.read(),
    matches.read(),
    publicAdmins.read(),
  ]);
  res.json({
    ok: true,
    content,
    games: sortByOrder(gameList),
    matches: sortByOrder(matchList),
    admins: sortByOrder(adminList).map(publicAdmin),
  });
}));

app.get("/api/admins", ah(async (req, res) => {
  const admins = sortByOrder(await publicAdmins.read()).map(publicAdmin);
  res.json({ ok: true, admins });
}));

app.get("/api/admin/users", requireAuth, requireAdmin, ah(async (req, res) => {
  res.json({ ok: true, items: (await readUsers()).map(publicUser) });
}));

app.post("/api/admin/users", requireAuth, requireAdmin, ah(async (req, res) => {
  const body = req.body || {};
  const name = String(body.username || "").trim();
  const pass = String(body.password || "");
  const disp = String(body.displayName || "").trim() || name;
  const role = body.role === "staff" ? "staff" : "admin";

  if (!/^[A-Za-z0-9._-]{3,24}$/.test(name)) {
    return res.status(400).json({ ok: false, error: "Username must be 3-24 characters (letters, numbers, . _ -)." });
  }
  if (pass.length < 8) {
    return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
  }
  const list = await readUsers();
  if (list.some((u) => u.username.toLowerCase() === name.toLowerCase())) {
    return res.status(409).json({ ok: false, error: "Username already exists." });
  }

  const record = {
    id: crypto.randomUUID(),
    username: name,
    password: bcrypt.hashSync(pass, 10),
    role,
    displayName: disp,
    title: String(body.title || "").trim(),
    photo: String(body.photo || ""),
    createdAt: new Date().toISOString(),
    lastLogin: "",
  };
  list.unshift(record);
  await writeUsers(list);
  await logActivity(req, "create", "user \u201c" + name + "\u201d (" + (role === "admin" ? "Administrator" : "Staff") + ")");
  broadcastChange("users");
  res.status(201).json({ ok: true, item: publicUser(record) });
}));

app.put("/api/admin/users/:id", requireAuth, requireAdmin, ah(async (req, res) => {
  const list = await readUsers();
  const idx = list.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ ok: false, error: "User not found." });

  const body = req.body || {};
  const target = list[idx];
  const disp = String(body.displayName ?? target.displayName ?? "").trim() || target.username;
  const role = body.role === "staff" ? "staff" : body.role === "admin" ? "admin" : target.role;

  if (target.role === "admin" && role !== "admin") {
    const otherAdmins = list.filter((u) => u.role === "admin" && u.id !== target.id);
    if (!otherAdmins.length) {
      return res.status(400).json({ ok: false, error: "Cannot demote the last administrator." });
    }
  }
  const pass = String(body.password || "");
  if (pass && pass.length < 8) {
    return res.status(400).json({ ok: false, error: "Password must be at least 8 characters." });
  }

  const oldPhoto = target.photo;
  target.displayName = disp;
  target.role = role;
  if (body.title !== undefined) target.title = String(body.title || "").trim();
  if (body.photo !== undefined) target.photo = String(body.photo || "");
  if (pass) target.password = bcrypt.hashSync(pass, 10);
  list[idx] = target;
  await writeUsers(list);
  if (oldPhoto && oldPhoto !== target.photo) await removePhoto(oldPhoto);

  if (req.session.user && req.session.user.id === target.id) {
    req.session.user.displayName = target.displayName;
    req.session.user.role = target.role;
  }
  if (pass) {
    const keepSid = req.session.user && req.session.user.id === target.id ? req.sessionID : undefined;
    await revokeUserSessions(target.id, keepSid);
  }
  await logActivity(req, "update", "user \u201c" + target.username + "\u201d" + (pass ? " (password reset)" : ""));
  broadcastChange("users");
  res.json({ ok: true, item: publicUser(target) });
}));

app.delete("/api/admin/users/:id", requireAuth, requireAdmin, ah(async (req, res) => {
  const list = await readUsers();
  const target = list.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ ok: false, error: "User not found." });
  if (req.session.user && req.session.user.id === target.id) {
    return res.status(400).json({ ok: false, error: "You cannot delete your own account." });
  }
  if (target.role === "admin" && list.filter((u) => u.role === "admin").length <= 1) {
    return res.status(400).json({ ok: false, error: "Cannot delete the last administrator." });
  }
  await writeUsers(list.filter((u) => u.id !== target.id));
  if (target.photo) await removePhoto(target.photo);
  await logActivity(req, "delete", "user \u201c" + target.username + "\u201d");
  broadcastChange("users");
  res.json({ ok: true });
}));

/* ------------------------------------------------------------------ */
/*  Activity log feed (admin only)                                     */
/* ------------------------------------------------------------------ */
app.get("/api/admin/activity", requireAuth, requireAdmin, ah(async (req, res) => {
  res.json({ ok: true, items: await activity.read() });
}));

/* ------------------------------------------------------------------ */
/*  Protected dashboard page + static assets                           */
/* ------------------------------------------------------------------ */
function serveDashboard(req, res, next) {
  if (!req.session || !req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
}

app.get("/dashboard", serveDashboard);
app.get("/dashboard.html", serveDashboard);

// Uploaded photos live in storage (Postgres when configured, disk otherwise).
app.get("/uploads/:name", ah(async (req, res) => {
  const file = await storage.getUpload(req.params.name);
  if (!file) return res.status(404).json({ ok: false, error: "File not found." });
  res.set("Content-Type", file.mime);
  res.set("Cache-Control", "public, max-age=86400");
  res.end(file.data);
}));

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"], index: "index.html" }));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, req, res, next) => {
  console.error("[error]", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ ok: false, error: "Internal server error." });
});

const COLLECTIONS = [users, activity, siteStats, members, teams, championships, sponsorships, contracts, games, matches, siteContent];

// One-time: if the landing-admin list was never created, start it from the
// existing login accounts so the section is not empty. After this, the list is
// fully managed in the dashboard (add / edit / delete freely).
async function seedLandingAdmins() {
  const existing = await storage.readDoc("admins");
  if (existing !== undefined) return;

  const list = (await readUsers()).map((u, i) => ({
    id: crypto.randomUUID(),
    name: u.displayName || u.username,
    title: u.title || (u.role === "admin" ? "Administrator" : "Staff"),
    role: u.role === "admin" ? "Platform Admin" : "Staff",
    photo: u.photo || "",
    order: i + 1,
  }));
  await storage.writeDoc("admins", list);
  console.log('[storage] seeded "admins" from ' + list.length + " user account(s)");
}

async function boot() {
  await storage.init();
  for (const c of COLLECTIONS) await c.seed();
  await seedLandingAdmins();

  const list = await users.read();
  if (list.length && list[0] && typeof list[0].password === "string" && !list[0].password.startsWith("$2")) {
    await users.write(list.map((u) => ({ ...u, password: bcrypt.hashSync(u.password, 10) })));
  }

  app.listen(PORT, () => {
    console.log("==============================================");
    console.log("  NRX GAMING  |  server online");
    console.log("  Storage    : " + storage.driver);
    console.log("  Site      : http://localhost:" + PORT);
    console.log("  Dashboard : http://localhost:" + PORT + "/dashboard");
    console.log("  Admin user: " + ADMIN_USERNAME);
    console.log("  Admin pass: " + ADMIN_PASSWORD);
    console.log("==============================================");
  });
}

boot().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
