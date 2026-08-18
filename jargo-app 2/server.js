import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "data", "db.json");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function readDB() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}
async function writeDB(db) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Load a saved profile by email
app.get("/api/state", async (req, res) => {
  const email = normalizeEmail(req.query.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email" });
  const db = await readDB();
  res.json({ state: db[email] || null });
});

// Save/overwrite a profile by email
app.post("/api/state", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email" });
  if (!req.body.state) return res.status(400).json({ error: "Missing state" });

  const db = await readDB();
  db[email] = req.body.state;
  await writeDB(db);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Jargo server running at http://localhost:${PORT}`);
});
