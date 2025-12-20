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
    .select("*")
    .order("checked_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("LOOKUPS ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch lookups" });
  }

  res.status(200).json({ lookups: data });
}
