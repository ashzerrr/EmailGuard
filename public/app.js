document.addEventListener("DOMContentLoaded", () => {
  // Home page loaders
  loadRecentLookups();
  loadStats();

  // Checker page handler
  const checkBtn = document.getElementById("checkBtn");
  if (checkBtn) {
    checkBtn.addEventListener("click", runEmailCheck);
  }
});

/* =======================
   CHECKER PAGE
======================= */
async function runEmailCheck() {
  const emailInput = document.getElementById("emailInput");
  const errorBox = document.getElementById("errorBox");
  const resultBox = document.getElementById("resultBox");

  errorBox.textContent = "";
  resultBox.style.display = "none";

  const email = emailInput.value.trim();
  if (!email) {
    errorBox.textContent = "Please enter an email address.";
    return;
  }

  try {
    const res = await fetch("/api/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      errorBox.textContent = data.error || "API request failed.";
      return;
    }

    const r = data.result;

    document.getElementById("emailLabel").textContent = r.email;
    document.getElementById("repBadge").textContent = r.reputation.toUpperCase();
    document.getElementById("repBadge").className = `badge ${r.reputation}`;
    document.getElementById("suspiciousLabel").textContent = r.suspicious ? "Yes" : "No";
    document.getElementById("referencesLabel").textContent = r.references;
    document.getElementById("breachLabel").textContent = r.details.data_breach ? "Yes" : "No";
    document.getElementById("credsLabel").textContent = r.details.credentials_leaked ? "Yes" : "No";
    document.getElementById("spamLabel").textContent = r.details.spam ? "Yes" : "No";
    document.getElementById("disposableLabel").textContent = r.details.disposable ? "Yes" : "No";

    resultBox.style.display = "block";

  } catch (err) {
    console.error("NETWORK ERROR:", err);
    errorBox.textContent = "Server unreachable.";
  }
}

/* =======================
   HOME PAGE: RECENT LOOKUPS
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
    console.error("LOOKUPS LOAD FAILED", err);
  }
}

/* =======================
   HOME PAGE: STATS GRAPH
======================= */
async function loadStats() {
  const canvas = document.getElementById("repChart");
  if (!canvas) return;

  try {
    const res = await fetch("/api/stats");
    const data = await res.json();

    new Chart(canvas.getContext("2d"), {
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
          backgroundColor: "#2a4d9b"
        }]
      }
    });

  } catch (err) {
    console.error("STATS LOAD FAILED", err);
  }
}
