import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

/* =======================
   BASIC SETUP
======================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* =======================
   SUPABASE CLIENT
======================= */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* =======================
   POST /api/check-email
   → Calls EmailRep
   → Saves result to Supabase
======================= */
app.post("/api/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  try {
    const response = await fetch(
      `https://emailrep.io/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "User-Agent": "EmailGuard/1.0",
          "Accept": "application/json",
          "Key": process.env.EMAILREP_API_KEY
        }
      }
    );

    const data = await response.json();

    console.log("EmailRep RAW response:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "EmailRep API error",
        details: data
      });
    }

    /* SAVE RESULT TO SUPABASE */
    await supabase.from("email_lookups").insert([
      {
        email: data.email,
        reputation: data.reputation ?? "none",
        suspicious: Boolean(data.suspicious),
        reference_count: Number.isFinite(data.references)
          ? data.references
          : 0
      }
    ]);

    res.json({ result: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process email" });
  }
});

/* =======================
   GET /api/lookups
   → Recent email lookups
======================= */
app.get("/api/lookups", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("email_lookups")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ lookups: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch lookups" });
  }
});

/* =======================
   GET /api/stats
   → Aggregated data for chart
======================= */
app.get("/api/stats", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("email_lookups")
      .select("reputation, suspicious");

    if (error) throw error;

    const repCounts = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0
    };

    let suspiciousYes = 0;
    let suspiciousNo = 0;

    for (const row of data) {
      const rep = row.reputation ?? "none";
      repCounts[rep] = (repCounts[rep] ?? 0) + 1;

      row.suspicious ? suspiciousYes++ : suspiciousNo++;
    }

    res.json({
      repCounts,
      suspicious: {
        yes: suspiciousYes,
        no: suspiciousNo
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate stats" });
  }
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
