// ─── Types ──────────────────────────────────────────────────
type LogLevel = "info" | "success" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
}

// ─── State ──────────────────────────────────────────────────
const FLASK_URL = "http://localhost:5000/console-stream";

let currentFilter: string = "all";
let scrollLocked = false;
let showTimestamps = true;
let expandData = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
let totalCount = 0;

const counts: Record<string, number> = {
  all: 0, info: 0, success: 0, warn: 0, error: 0,
};

// ─── DOM Refs ────────────────────────────────────────────────
const logContainer   = document.getElementById("log-container")!;
const emptyState     = document.getElementById("empty-state")!;
const statusDot      = document.getElementById("status-dot")!;
const statusLabel    = document.getElementById("status-label")!;
const searchInput    = document.getElementById("search-input") as HTMLInputElement;
const logCountLabel  = document.getElementById("log-count-label")!;
const lastEventLabel = document.getElementById("last-event-label")!;
const reconnectLabel = document.getElementById("reconnect-label")!;
const logArea        = document.getElementById("log-area")!;
const scrollToggle   = document.getElementById("scroll-lock-toggle")!;
const timestampToggle = document.getElementById("timestamp-toggle")!;
const expandToggle   = document.getElementById("expand-toggle")!;
const btnClear       = document.getElementById("btn-clear")!;

// ─── SSE Connection ──────────────────────────────────────────
function connect() {
  setStatus("reconnecting", "Connecting…");
  reconnectLabel.textContent = "";

  const source = new EventSource(FLASK_URL);

  source.onopen = () => {
    reconnectAttempts = 0;
    setStatus("connected", "Connected");
  };

  source.onmessage = (e: MessageEvent) => {
    try {
      const entry: LogEntry = JSON.parse(e.data);
      appendLog(entry);
    } catch {
      appendLog({ level: "warn", message: "Malformed event received", data: e.data });
    }
  };

  source.onerror = () => {
    source.close();
    setStatus("disconnected", "Disconnected");
    reconnectAttempts++;
    const delay = Math.min(3000 * reconnectAttempts, 15000);
    reconnectLabel.textContent = `Reconnecting in ${delay / 1000}s…`;
    reconnectTimer = setTimeout(() => {
      reconnectLabel.textContent = "";
      connect();
    }, delay);
  };
}

function setStatus(state: "connected" | "disconnected" | "reconnecting", label: string) {
  statusDot.className = `status-dot ${state}`;
  statusLabel.textContent = label;
}

// ─── Syntax Highlight JSON ───────────────────────────────────
function highlightJSON(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?)/g, (match) => {
      if (/:$/.test(match)) return `<span class="key">${match}</span>`;
      return `<span class="str">${match}</span>`;
    })
    .replace(/\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span class="num">$1</span>')
    .replace(/\b(true|false)\b/g, '<span class="bool">$1</span>')
    .replace(/\bnull\b/g, '<span class="null">null</span>');
}

// ─── Append Log ──────────────────────────────────────────────
function appendLog(entry: LogEntry) {
  totalCount++;
  counts.all++;
  counts[entry.level] = (counts[entry.level] || 0) + 1;

  updateCounts();

  const time = new Date().toLocaleTimeString("en-US", {
    hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  const ms = new Date().getMilliseconds().toString().padStart(3, "0");
  const fullTime = `${time}.${ms}`;

  const row = document.createElement("div");
  row.className = `log-row log-${entry.level}`;
  row.dataset.level = entry.level;
  row.dataset.message = entry.message.toLowerCase();

  const timeSpan = document.createElement("span");
  timeSpan.className = `log-time${showTimestamps ? "" : " hidden"}`;
  timeSpan.textContent = fullTime;

  const badge = document.createElement("span");
  badge.className = `log-badge ${entry.level}`;
  badge.textContent = entry.level.toUpperCase();

  const msg = document.createElement("span");
  msg.className = "log-message";
  msg.textContent = entry.message;

  row.appendChild(timeSpan);
  row.appendChild(badge);
  row.appendChild(msg);

  if (entry.data !== undefined && entry.data !== null) {
    const pre = document.createElement("pre");
    pre.className = `log-data${expandData ? " visible" : ""}`;
    try {
      const pretty = JSON.stringify(entry.data, null, 2);
      pre.innerHTML = highlightJSON(pretty);
    } catch {
      pre.textContent = String(entry.data);
    }
    row.appendChild(pre);

    // Click row to expand data
    row.style.cursor = "pointer";
    row.addEventListener("click", () => {
      pre.classList.toggle("visible");
    });
  }

  // Filtering
  applyVisibility(row);

  logContainer.prepend(row);

  // Hide empty state
  emptyState.style.display = "none";

  // Update status bar
  logCountLabel.textContent = `${totalCount} event${totalCount !== 1 ? "s" : ""}`;
  lastEventLabel.textContent = `Last: ${entry.level.toUpperCase()} — ${entry.message.slice(0, 60)}${entry.message.length > 60 ? "…" : ""}`;

  // Scroll lock
  if (!scrollLocked) {
    logArea.scrollTop = 0;
  }
}

// ─── Visibility / Filter ─────────────────────────────────────
function applyVisibility(row: HTMLElement) {
  const level = row.dataset.level ?? "";
  const message = row.dataset.message ?? "";
  const query = searchInput.value.toLowerCase();

  const matchesFilter = currentFilter === "all" || level === currentFilter;
  const matchesSearch = !query || message.includes(query) || level.includes(query);

  row.style.display = matchesFilter && matchesSearch ? "grid" : "none";
}

function refilter() {
  const rows = logContainer.querySelectorAll<HTMLElement>(".log-row");
  rows.forEach(applyVisibility);
}

// ─── Count Updates ───────────────────────────────────────────
function updateCounts() {
  (["all", "info", "success", "warn", "error"] as const).forEach((level) => {
    const el = document.getElementById(`count-${level}`);
    if (el) el.textContent = String(counts[level] || 0);
  });
}

// ─── Filter Nav ──────────────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter ?? "all";
    refilter();
  });
});

// ─── Search ──────────────────────────────────────────────────
searchInput.addEventListener("input", refilter);

// ─── Toggles ─────────────────────────────────────────────────
scrollToggle.addEventListener("click", () => {
  scrollLocked = !scrollLocked;
  scrollToggle.classList.toggle("active", scrollLocked);
});

timestampToggle.addEventListener("click", () => {
  showTimestamps = !showTimestamps;
  timestampToggle.classList.toggle("active", showTimestamps);
  document.querySelectorAll<HTMLElement>(".log-time").forEach((el) => {
    el.classList.toggle("hidden", !showTimestamps);
  });
});

expandToggle.addEventListener("click", () => {
  expandData = !expandData;
  expandToggle.classList.toggle("active", expandData);
  document.querySelectorAll<HTMLElement>(".log-data").forEach((el) => {
    el.classList.toggle("visible", expandData);
  });
});

// ─── Clear ───────────────────────────────────────────────────
btnClear.addEventListener("click", () => {
  logContainer.innerHTML = "";
  emptyState.style.display = "flex";
  totalCount = 0;
  counts.all = 0;
  counts.info = 0;
  counts.success = 0;
  counts.warn = 0;
  counts.error = 0;
  updateCounts();
  logCountLabel.textContent = "0 events";
  lastEventLabel.textContent = "—";
});

// ─── Boot ────────────────────────────────────────────────────
connect();