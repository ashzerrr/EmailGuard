module.exports = async (req, res) => {
    return res.status(200).json({
      repCounts: {
        high: 0,
        medium: 0,
        low: 0,
        none: 1
      }
    });
  };
  