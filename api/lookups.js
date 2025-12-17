const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // GET recent lookups
  if (req.method === "GET") {
    const limit = Number(req.query.limit) || 10;

    const { data, error } = await supabase
      .from("email_lookups")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase SELECT error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ lookups: data });
  }

  // POST save lookup
  if (req.method === "POST") {
    const { email, reputation, suspicious, references } = req.body;

    const { error } = await supabase
      .from("email_lookups")
      .insert({
        email,
        reputation,
        suspicious,
        reference_count: references,
        checked_at: new Date().toISOString()
      });

    if (error) {
      console.error("Supabase INSERT error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ saved: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
