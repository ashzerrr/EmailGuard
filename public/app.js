document.addEventListener("DOMContentLoaded", () => {
  loadRecentLookups();
  loadStats();
});

/* =======================
   RECENT LOOKUPS
======================= */
async function loadRecentLookups() {
  const list = document.getElementById("recentList");
  if (!list) return;

  try {
    const res = await fetch("/api/lookups");
    const data = await res.json();

    list.innerHTML = "";

    if (!data.lookups || data.lookups.length === 0) {
      list.innerHTML = "<li>No lookups yet</li>";
      return;
    }

    data.lookups.forEach(row => {
      const li = document.createElement("li");
      li.textContent = `${row.email} — ${row.reputation.toUpperCase()}`;
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Failed to load lookups", err);
  }
}

/* =======================
   REPUTATION SUMMARY
======================= */
async function loadStats() {
  const canvas = document.getElementById("repChart");
  if (!canvas) return;

  try {
    const res = await fetch("/api/stats");
    const data = await res.json();

    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["High", "Medium", "Low", "None"],
        datasets: [{
          label: "Email Reputation Summary",
          data: [
            data.repCounts.high,
            data.repCounts.medium,
            data.repCounts.low,
            data.repCounts.none
          ],
          backgroundColor: "#2c5cc5"
        }]
      }
    });

  } catch (err) {
    console.error("Failed to load stats", err);
  }
}
