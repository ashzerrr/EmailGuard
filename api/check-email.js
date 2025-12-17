module.exports = async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }
  
    return res.status(200).json({
      result: {
        email,
        reputation: "none",
        suspicious: false,
        references: 0,
        details: {
          data_breach: false,
          credentials_leaked: false,
          spam: false,
          disposable: false
        }
      }
    });
  };
  