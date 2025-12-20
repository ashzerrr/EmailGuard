import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data, error } = await supabase
    .from("email_lookups")
    .select("reputation, suspicious");

  if (error) {
    console.error("STATS ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }

  const repCounts = { high: 0, medium: 0, low: 0, none: 0 };
  let suspiciousYes = 0;
  let suspiciousNo = 0;

  data.forEach(row => {
    const rep = row.reputation ?? "none";
    repCounts[rep]++;
    row.suspicious ? suspiciousYes++ : suspiciousNo++;
  });

  res.status(200).json({
    repCounts,
    suspicious: { yes: suspiciousYes, no: suspiciousNo }
  });
}
