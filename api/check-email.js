import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

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

    if (!response.ok) {
      return res.status(response.status).json({
        error: "EmailRep API error",
        details: data
      });
    }

    await supabase.from("email_lookups").insert([{
      email: data.email,
      reputation: data.reputation ?? "none",
      suspicious: Boolean(data.suspicious),
      reference_count: Number(data.references) || 0,
      data_breach: Boolean(data.details?.data_breach),
      credentials_leaked: Boolean(data.details?.credentials_leaked),
      spam: Boolean(data.details?.spam),
      disposable: Boolean(data.details?.disposable)
    }]);

    return res.status(200).json({ result: data });

  } catch (err) {
    console.error("CHECK EMAIL ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
