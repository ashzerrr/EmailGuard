import "dotenv/config";
import express from "express";
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

    if (error) {
      console.error("LOOKUPS ERROR:", error);
      return res.status(500).json({ error: "Failed to fetch lookups" });
    }

    res.json({ lookups: data });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   GET /api/stats
   → Aggregated stats for chart
======================= */
app.get("/api/stats", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("email_lookups")
      .select("reputation, suspicious");

    if (error) {
      console.error("STATS ERROR:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }

    const repCounts = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0
    };

    let suspiciousYes = 0;
    let suspiciousNo = 0;

    data.forEach(row => {
      const rep = row.reputation ?? "none";
      repCounts[rep] = (repCounts[rep] ?? 0) + 1;
      row.suspicious ? suspiciousYes++ : suspiciousNo++;
    });

    res.json({
      repCounts,
      suspicious: {
        yes: suspiciousYes,
        no: suspiciousNo
      }
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =======================
   START LOCAL SERVER ONLY
======================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Local server running at http://localhost:${PORT}`);
});
