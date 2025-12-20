import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* =======================
   EMAIL CHECK
======================= */
app.post("/api/check-email", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const response = await fetch(
      `https://emailrep.io/${encodeURIComponent(email)}`,
      {
        headers: {
          "User-Agent": "EmailGuard/1.0",
          "Accept": "application/json",
          "Key": process.env.EMAILREP_API_KEY
        }
      }
    );

    const data = await response.json();
    console.log("EmailRep RAW:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "EmailRep API rejected request",
        details: data
      });
    }

    const { error } = await supabase.from("email_lookups").insert([
      {
        email: data.email,
        reputation: data.reputation ?? "none",
        suspicious: Boolean(data.suspicious),
        reference_count: Number(data.references) || 0,
        data_breach: Boolean(data.details?.data_breach),
        credentials_leaked: Boolean(data.details?.credentials_leaked),
        spam: Boolean(data.details?.spam),
        disposable: Boolean(data.details?.disposable)
      }
    ]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
    }

    res.json({ result: data });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server failure" });
  }
});

/* =======================
   RECENT LOOKUPS
======================= */
app.get("/api/lookups", async (req, res) => {
  const { data, error } = await supabase
    .from("email_lookups")
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(10);

  if (error) return res.status(500).json({ error: "Lookup fetch failed" });
  res.json({ lookups: data });
});

/* =======================
   STATS
======================= */
app.get("/api/stats", async (req, res) => {
  const { data, error } = await supabase
    .from("email_lookups")
    .select("reputation, suspicious");

  if (error) return res.status(500).json({ error: "Stats fetch failed" });

  const repCounts = { high: 0, medium: 0, low: 0, none: 0 };
  let suspiciousYes = 0;
  let suspiciousNo = 0;

  data.forEach(row => {
    repCounts[row.reputation ?? "none"]++;
    row.suspicious ? suspiciousYes++ : suspiciousNo++;
  });

  res.json({ repCounts, suspicious: { yes: suspiciousYes, no: suspiciousNo } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
