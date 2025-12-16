// Helper: make badges
function makeBadge(rep) {
    const span = document.createElement("span");
    span.className = `badge ${rep || "none"}`;
    span.textContent = (rep || "none").toUpperCase();
    return span;
  }
  
  // Fetch Call #1: GET recent lookups (DB)
  async function loadRecentLookups(limit = 10) {
    const res = await fetch(`/api/lookups?limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load lookups");
    return data.lookups;
  }
  
  // Fetch Call #2: GET stats (DB -> chart)
  async function loadStats() {
    const res = await fetch(`/api/stats`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load stats");
    return data;
  }
  
  // Fetch Call #3: POST check email (external EmailRep)
  async function checkEmail(email) {
    const res = await fetch(`/api/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Check failed");
    return data.result;
  }
  
  // Fetch Call #4: POST save lookup (DB write)
  async function saveLookup(result) {
    const res = await fetch(`/api/lookups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: result.email,
        reputation: result.reputation,
        suspicious: result.suspicious,
        references: result.references
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");
    return data.saved;
  }
  
  // -------- Home page logic (charts + recent) --------
  async function initHomePage() {
    const recentEl = document.getElementById("recentList");
    const chartEl = document.getElementById("repChart");
    if (!recentEl || !chartEl) return;
  
    const lookups = await loadRecentLookups(8);
  
    recentEl.innerHTML = lookups.map(l => {
      const when = dayjs(l.checked_at).fromNow();
      return `<li><strong>${l.email}</strong> — ${l.reputation.toUpperCase()} — suspicious: ${l.suspicious ? "Yes" : "No"} — ${when}</li>`;
    }).join("");
  
    const stats = await loadStats();
    const labels = Object.keys(stats.repCounts);
    const values = labels.map(k => stats.repCounts[k]);
  
    // Chart.js library usage
    new Chart(chartEl, {
      type: "bar",
      data: { labels, datasets: [{ label: "Reputation counts", data: values }] }
    });
  }
  
  // -------- Checker page logic --------
  async function initCheckerPage() {
    const btn = document.getElementById("checkBtn");
    if (!btn) return;
  
    btn.addEventListener("click", async () => {
      const email = document.getElementById("emailInput").value.trim();
      const out = document.getElementById("resultBox");
      const errEl = document.getElementById("errorBox");
  
      errEl.textContent = "";
      out.style.display = "none";
  
      if (!email) {
        errEl.textContent = "Please enter an email.";
        return;
      }
  
      try {
        const result = await checkEmail(email);
  
        // show results
        document.getElementById("emailLabel").textContent = result.email;
  
        const badgeHost = document.getElementById("repBadge");
        badgeHost.innerHTML = "";
        badgeHost.appendChild(makeBadge(result.reputation));
  
        document.getElementById("suspiciousLabel").textContent = result.suspicious ? "Yes" : "No";
        document.getElementById("referencesLabel").textContent = result.references ?? 0;
  
        document.getElementById("breachLabel").textContent = result.details?.data_breach ? "Yes" : "No";
        document.getElementById("credsLabel").textContent = result.details?.credentials_leaked ? "Yes" : "No";
        document.getElementById("spamLabel").textContent = result.details?.spam ? "Yes" : "No";
        document.getElementById("disposableLabel").textContent = result.details?.disposable ? "Yes" : "No";
  
        // Save lookup to Supabase (DB write)
        await saveLookup(result);
  
        out.style.display = "block";
      } catch (e) {
        errEl.textContent = e.message;
      }
    });
  }
  
  document.addEventListener("DOMContentLoaded", async () => {
    // Day.js library usage (relative time)
    if (window.dayjs && window.dayjs_plugin_relativeTime) {
      dayjs.extend(window.dayjs_plugin_relativeTime);
    }
  
    try {
      await initHomePage();
      await initCheckerPage();
    } catch (e) {
      const errEl = document.getElementById("errorBox");
      if (errEl) errEl.textContent = e.message;
    }
  });
  