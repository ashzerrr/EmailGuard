let mockDB = [];

export default async function handler(req, res) {
  if (req.method === "GET") {
    const limit = Number(req.query.limit) || 10;
    return res.status(200).json({
      lookups: mockDB.slice(-limit).reverse()
    });
  }

  if (req.method === "POST") {
    const lookup = {
      ...req.body,
      checked_at: new Date().toISOString()
    };

    mockDB.push(lookup);

    return res.status(200).json({ saved: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}
