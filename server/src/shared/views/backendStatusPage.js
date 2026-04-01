function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildMetric(label, value) {
  return `
    <div class="item">
      <span class="label">${escapeHtml(label)}</span>
      <div class="value">${escapeHtml(value)}</div>
    </div>
  `;
}

function renderBackendStatusPage({ req, health, timestamp, uptimeSeconds }) {
  const host = req.get("host");
  const protocol = req.protocol;
  const backendBaseUrl = `${protocol}://${host}`;
  const apiBaseUrl = `${backendBaseUrl}/api`;
  const frontendUrl =
    process.env.FRONTEND_URL || process.env.CLIENT_URL || "Not configured";
  const frontendStatusUrl = process.env.FRONTEND_STATUS_URL || "Not configured";
  const frontendLink = /^https?:\/\//i.test(frontendUrl) ? frontendUrl : "#";
  const healthUrl = `${backendBaseUrl}/health`;
  const uptime =
    typeof uptimeSeconds === "number"
      ? `${Math.floor(uptimeSeconds)}s`
      : "Unknown";
  const status = health?.status || "UNKNOWN";
  const requestTime = timestamp
    ? new Date(timestamp).toLocaleString()
    : new Date().toLocaleString();
  const nodeEnv = process.env.NODE_ENV || "development";
  const corsOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SilkPay Backend Status</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0d0e12;
        --card: rgba(23, 25, 36, 0.94);
        --card-strong: rgba(10, 12, 18, 0.35);
        --border: rgba(255, 255, 255, 0.08);
        --text: #f5f7fb;
        --muted: #9aa3bd;
        --accent: #6c5dd3;
        --good: #4ade80;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, rgba(108,93,211,0.18), transparent 32%),
          radial-gradient(circle at bottom right, rgba(34,197,94,0.08), transparent 28%),
          linear-gradient(180deg, #0d0e12 0%, #090a0e 100%);
        color: var(--text);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 24px;
      }
      .shell {
        width: min(1080px, 100%);
        border: 1px solid var(--border);
        background: var(--card);
        backdrop-filter: blur(18px);
        border-radius: 28px;
        box-shadow: 0 24px 80px rgba(0,0,0,0.35);
        overflow: hidden;
      }
      .hero {
        padding: 30px;
        border-bottom: 1px solid var(--border);
        background:
          linear-gradient(135deg, rgba(108,93,211,0.14), transparent 55%),
          rgba(255,255,255,0.01);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid rgba(108,93,211,0.25);
        background: rgba(108,93,211,0.12);
        color: #c7c0ff;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      h1 {
        margin: 16px 0 10px;
        font-size: clamp(28px, 4vw, 46px);
        line-height: 1.05;
      }
      .hero p {
        margin: 0;
        max-width: 780px;
        color: var(--muted);
        line-height: 1.65;
      }
      .content {
        display: grid;
        gap: 18px;
        padding: 24px 30px 30px;
        grid-template-columns: 1.2fr 0.8fr;
      }
      .panel {
        border: 1px solid var(--border);
        background: var(--card-strong);
        border-radius: 22px;
        padding: 22px;
      }
      .panel h2 {
        margin: 0 0 12px;
        font-size: 18px;
      }
      .summary {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      }
      .metric {
        border: 1px solid var(--border);
        background: rgba(0,0,0,0.18);
        border-radius: 18px;
        padding: 16px;
      }
      .label {
        display: block;
        margin-bottom: 7px;
        color: var(--muted);
        font-size: 11px;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      .value {
        font-size: 14px;
        word-break: break-word;
        line-height: 1.5;
      }
      .value strong {
        color: white;
      }
      .list {
        display: grid;
        gap: 12px;
      }
      .link {
        color: #d7d2ff;
        text-decoration: none;
      }
      .link:hover { text-decoration: underline; }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid rgba(74, 222, 128, 0.25);
        background: rgba(74, 222, 128, 0.12);
        color: #b8ffd2;
        font-size: 13px;
        font-weight: 700;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--good);
        box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.14);
      }
      .footer {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 40px;
        padding: 0 16px;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: var(--accent);
        color: white;
        font-weight: 600;
        text-decoration: none;
      }
      .button.secondary {
        background: transparent;
      }
      @media (max-width: 900px) {
        .content { grid-template-columns: 1fr; }
      }
      @media (max-width: 520px) {
        .hero, .content { padding-left: 18px; padding-right: 18px; }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <div class="badge">Backend Online</div>
        <h1>SilkPay backend is responding.</h1>
        <p>
          This page is meant for quick manual verification. It gives you live backend details, the current health status,
          and the URLs your frontend is expected to use.
        </p>
      </section>

      <section class="content">
        <article class="panel">
          <h2>Current status</h2>
          <div class="status-pill"><span class="dot"></span>${escapeHtml(status)}</div>

          <div class="summary" style="margin-top: 18px;">
            ${buildMetric("Backend URL", backendBaseUrl)}
            ${buildMetric("API Base URL", apiBaseUrl)}
            ${buildMetric("Health URL", healthUrl)}
            ${buildMetric("Uptime", uptime)}
            ${buildMetric("Node Environment", nodeEnv)}
            ${buildMetric("Checked At", requestTime)}
          </div>

          <div class="footer">
            <a class="button" href="/health">Open Health JSON</a>
            <a class="button secondary" href="${escapeHtml(frontendLink)}" target="_blank" rel="noreferrer">Open Frontend</a>
          </div>
        </article>

        <aside class="panel">
          <h2>Environment details</h2>
          <div class="list">
            ${buildMetric("Frontend URL", frontendUrl)}
            ${buildMetric("Frontend Status URL", frontendStatusUrl)}
            ${buildMetric("Allowed CORS origins", corsOrigins.length ? corsOrigins.join(", ") : "Not configured")}
            ${buildMetric("Request Host", host)}
            ${buildMetric("Request Protocol", protocol)}
          </div>
        </aside>
      </section>
    </main>
  </body>
</html>`;
}

module.exports = { renderBackendStatusPage };
