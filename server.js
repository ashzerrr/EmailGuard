import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static("public"));
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// --- Supabase (required) ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
}
const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "");

// ---------------------------
// Endpoint A (REQUIRED): External API + manipulation
// POST /api/check-email
// ---------------------------
app.post("/api/check-email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const response = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
      headers: {
        "User-Agent": "INST377-EmailGuard/1.0",
        "Accept": "application/json"
      }
      // If you later get an API key:
      // headers: { "Key": process.env.EMAILREP_KEY, "User-Agent": "...", "Accept": "application/json" }
    });

    if (response.status === 429) {
      // Don’t crash the demo
      return res.status(429).json({
        error: "EmailRep rate limit exceeded (HTTP 429). Try later or use an API key."
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "EmailRep API error",
        details: data
      });
    }

    // "Manipulate" / normalize data for frontend (this is good practice)
    const normalized = {
      email: data.email,
      reputation: data.reputation ?? "none",
      suspicious: Boolean(data.suspicious),
      references: Number.isFinite(data.references) ? data.references : 0,
      details: {
        data_breach: Boolean(data.details?.data_breach),
        credentials_leaked: Boolean(data.details?.credentials_leaked),
        blacklisted: Boolean(data.details?.blacklisted),
        spam: Boolean(data.details?.spam),
        free_provider: Boolean(data.details?.free_provider),
        disposable: Boolean(data.details?.disposable),
        domain_reputation: data.details?.domain_reputation ?? "n/a",
        first_seen: data.details?.first_seen ?? "never",
        last_seen: data.details?.last_seen ?? "never"
      }
    };

    return res.json({ result: normalized });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server failed to contact EmailRep." });
  }
});

// ---------------------------
// Endpoint B (REQUIRED): Write to Supabase
// POST /api/lookups
// ---------------------------
app.post("/api/lookups", async (req, res) => {
  const { email, reputation, suspicious, references } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const { data, error } = await supabase
      .from("email_lookups")
      .insert([{
        email,
        reputation: reputation ?? "none",
        suspicious: Boolean(suspicious),
        reference_count: Number.isFinite(references) ? references : 0
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: "DB insert failed", details: error.message });

    return res.json({ ok: true, saved: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server DB error" });
  }
});

// ---------------------------
// Endpoint C (REQUIRED): Retrieve from DB (front-end must use)
// GET /api/lookups?limit=10
// ---------------------------
app.get("/api/lookups", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);

  try {
    const { data, error } = await supabase
      .from("email_lookups")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ error: "DB read failed", details: error.message });

    return res.json({ ok: true, lookups: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server DB error" });
  }
});

// ---------------------------
// Bonus endpoint for Chart.js (counts)
// GET /api/stats
// ---------------------------
app.get("/api/stats", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("email_lookups")
      .select("reputation, suspicious");

    if (error) return res.status(500).json({ error: "DB stats failed", details: error.message });

    const repCounts = { high: 0, medium: 0, low: 0, none: 0 };
    let suspiciousYes = 0;
    let suspiciousNo = 0;

    for (const row of data) {
      const r = row.reputation ?? "none";
      if (repCounts[r] === undefined) repCounts.none++;
      else repCounts[r]++;

      if (row.suspicious) suspiciousYes++;
      else suspiciousNo++;
    }

    return res.json({
      ok: true,
      repCounts,
      suspicious: { yes: suspiciousYes, no: suspiciousNo }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server stats error" });
  }
});

// Local dev port (Vercel sets its own port in production)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
