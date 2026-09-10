const state = {
  token: sessionStorage.getItem("rhythmtouch_admin_token") || "",
  limit: 100,
  offset: 0,
  total: 0,
  timer: null,
  loading: false,
};

const elements = {
  loginView: document.querySelector("#login-view"),
  dashboardView: document.querySelector("#dashboard-view"),
  loginForm: document.querySelector("#login-form"),
  loginButton: document.querySelector("#login-button"),
  loginError: document.querySelector("#login-error"),
  logoutButton: document.querySelector("#logout-button"),
  refreshAll: document.querySelector("#refresh-all"),
  autoRefresh: document.querySelector("#auto-refresh"),
  liveStatus: document.querySelector("#live-status"),
  updatedAt: document.querySelector("#updated-at"),
  participantRows: document.querySelector("#participant-rows"),
  participantEmpty: document.querySelector("#participant-empty"),
  formalTrialCount: document.querySelector("#formal-trial-count"),
  filterForm: document.querySelector("#filter-form"),
  tableFilter: document.querySelector("#table-filter"),
  userFilter: document.querySelector("#user-filter"),
  blockFilter: document.querySelector("#block-filter"),
  searchFilter: document.querySelector("#search-filter"),
  dataMessage: document.querySelector("#data-message"),
  dataHead: document.querySelector("#data-head"),
  dataBody: document.querySelector("#data-body"),
  dataEmpty: document.querySelector("#data-empty"),
  pageSummary: document.querySelector("#page-summary"),
  previousPage: document.querySelector("#previous-page"),
  nextPage: document.querySelector("#next-page"),
  exportButton: document.querySelector("#export-button"),
  toast: document.querySelector("#toast"),
};

const statElements = {
  users: document.querySelector("#stat-users"),
  trials: document.querySelector("#stat-trials"),
  attempts: document.querySelector("#stat-attempts"),
  surveys: document.querySelector("#stat-surveys"),
  success: document.querySelector("#stat-success"),
  similarity: document.querySelector("#stat-similarity"),
};

function setSignedIn(signedIn) {
  elements.loginView.hidden = signedIn;
  elements.dashboardView.hidden = !signedIn;
  if (signedIn) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3500);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${state.token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...options, headers, cache: "no-store" });
  if (response.status === 401) {
    logout("Your administrator session has expired. Sign in again.");
    throw new Error("Session expired");
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.error || message;
    } catch {
    }
    throw new Error(message);
  }
  return response;
}

function logout(message = "") {
  state.token = "";
  sessionStorage.removeItem("rhythmtouch_admin_token");
  setSignedIn(false);
  if (message) {
    elements.loginError.textContent = message;
    elements.loginError.hidden = false;
  }
}

function formatDate(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  const date = Number.isFinite(number) && number > 10_000_000_000
    ? new Date(number)
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

const timestampColumns = new Set([
  "trial_start_time",
  "trial_end_time",
  "preview_end_time",
  "attempt_start_time",
  "attempt_end_time",
  "timestamp",
  "last_activity",
  "created_at",
  "submitted_at",
]);

function displayValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (timestampColumns.has(key)) return formatDate(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function createCell(key, value) {
  const cell = document.createElement("td");
  if (typeof value === "boolean") {
    const badge = document.createElement("span");
    badge.className = value ? "value-true" : "value-false";
    badge.textContent = value ? "Yes" : "No";
    cell.append(badge);
  } else {
    const displayed = displayValue(key, value);
    cell.textContent = displayed;
    cell.title = displayed;
  }
  return cell;
}

async function loadSummary() {
  const response = await api("/api/admin/summary");
  const summary = await response.json();
  statElements.users.textContent = summary.counts.users;
  statElements.trials.textContent = summary.counts.trials;
  statElements.attempts.textContent = summary.counts.attempts;
  statElements.surveys.textContent = summary.counts.survey_responses;
  statElements.success.textContent = `${summary.success_rate}%`;
  statElements.similarity.textContent = summary.average_similarity === null
    ? "—"
    : `${summary.average_similarity}%`;
  elements.formalTrialCount.textContent = summary.formal_trial_count;
  renderParticipants(summary.participants, summary.formal_trial_count);
  updateParticipantFilter(summary.participants);
  elements.updatedAt.textContent = `Last updated: ${formatDate(summary.updated_at)}`;
}

function updateParticipantFilter(participants) {
  const selected = elements.userFilter.value;
  const fragment = document.createDocumentFragment();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "All participants";
  fragment.append(all);
  participants.forEach((participant) => {
    const option = document.createElement("option");
    option.value = participant.user_id;
    option.textContent = `${participant.username} · ${participant.user_id}`;
    fragment.append(option);
  });
  elements.userFilter.replaceChildren(fragment);
  if ([...elements.userFilter.options].some((option) => option.value === selected)) {
    elements.userFilter.value = selected;
  }
}

function renderParticipants(participants, formalTrialCount) {
  const fragment = document.createDocumentFragment();
  participants.forEach((participant) => {
    const row = document.createElement("tr");

    const identity = document.createElement("td");
    const name = document.createElement("span");
    name.className = "participant-name";
    name.textContent = participant.username;
    const id = document.createElement("span");
    id.className = "participant-id";
    id.textContent = participant.user_id;
    identity.append(name, id);

    const progress = document.createElement("td");
    const progressLayout = document.createElement("div");
    progressLayout.className = "progress-layout";
    const progressTrack = document.createElement("div");
    progressTrack.className = "progress-track";
    const progressFill = document.createElement("i");
    progressFill.style.width = `${participant.progress_percent}%`;
    progressTrack.append(progressFill);
    const progressText = document.createElement("span");
    progressText.textContent = `${participant.completed_trials}/${formalTrialCount}`;
    progressLayout.append(progressTrack, progressText);
    progress.append(progressLayout);

    row.append(
      identity,
      progress,
      createCell("successful_trials", participant.successful_trials),
      createCell(
        "average_similarity",
        participant.average_similarity === null
          ? null
          : `${participant.average_similarity}%`,
      ),
      createCell("last_activity", participant.last_activity || participant.created_at),
    );
    fragment.append(row);
  });
  elements.participantRows.replaceChildren(fragment);
  elements.participantEmpty.hidden = participants.length > 0;
}

function buildQuery(includePagination = true) {
  const parameters = new URLSearchParams();
  parameters.set("table", elements.tableFilter.value);
  if (elements.userFilter.value) parameters.set("user_id", elements.userFilter.value);
  if (elements.blockFilter.value) parameters.set("block_number", elements.blockFilter.value);
  if (elements.searchFilter.value.trim()) {
    parameters.set("search", elements.searchFilter.value.trim());
  }
  if (includePagination) {
    parameters.set("limit", state.limit);
    parameters.set("offset", state.offset);
  }
  return parameters;
}

function syncFilterAvailability() {
  const table = elements.tableFilter.value;
  elements.blockFilter.disabled = table === "users";
  if (table === "users") elements.blockFilter.value = "";
}

async function loadData() {
  const query = buildQuery();
  elements.dataMessage.textContent = "Loading database records…";
  const response = await api(`/api/admin/data?${query}`);
  const payload = await response.json();
  state.total = payload.total;
  renderDataTable(payload.rows);
  updatePagination();
  elements.dataMessage.textContent = `${payload.table} · Raw SQLite records (read-only)`;
}

function renderDataTable(rows) {
  elements.dataHead.replaceChildren();
  elements.dataBody.replaceChildren();
  elements.dataEmpty.hidden = rows.length > 0;
  if (!rows.length) return;

  const columns = Object.keys(rows[0]);
  const headRow = document.createElement("tr");
  columns.forEach((column) => {
    const heading = document.createElement("th");
    heading.textContent = column;
    headRow.append(heading);
  });
  elements.dataHead.append(headRow);

  const fragment = document.createDocumentFragment();
  rows.forEach((record) => {
    const row = document.createElement("tr");
    columns.forEach((column) => row.append(createCell(column, record[column])));
    fragment.append(row);
  });
  elements.dataBody.append(fragment);
}

function updatePagination() {
  const start = state.total ? state.offset + 1 : 0;
  const end = Math.min(state.offset + state.limit, state.total);
  const page = Math.floor(state.offset / state.limit) + 1;
  const pages = Math.max(1, Math.ceil(state.total / state.limit));
  elements.pageSummary.textContent = `${start}–${end} of ${state.total} · Page ${page} of ${pages}`;
  elements.previousPage.disabled = state.offset === 0;
  elements.nextPage.disabled = state.offset + state.limit >= state.total;
}

async function refreshAll({ quiet = false } = {}) {
  if (state.loading || !state.token) return;
  state.loading = true;
  elements.liveStatus.classList.remove("is-error");
  try {
    await Promise.all([loadSummary(), loadData()]);
    if (!quiet) showToast("Data refreshed");
  } catch (error) {
    if (error.message !== "Session expired") {
      elements.liveStatus.classList.add("is-error");
      elements.dataMessage.textContent = error.message;
      if (!quiet) showToast(`Refresh failed: ${error.message}`);
    }
  } finally {
    state.loading = false;
  }
}

function stopAutoRefresh() {
  window.clearInterval(state.timer);
  state.timer = null;
}

function startAutoRefresh() {
  stopAutoRefresh();
  if (elements.autoRefresh.checked) {
    state.timer = window.setInterval(() => refreshAll({ quiet: true }), 10_000);
  }
}

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.loginError.hidden = true;
  elements.loginButton.disabled = true;
  elements.loginButton.textContent = "Signing in…";
  const data = new FormData(elements.loginForm);
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: data.get("username"),
        password: data.get("password"),
      }),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Sign-in failed");
    state.token = payload.token;
    sessionStorage.setItem("rhythmtouch_admin_token", state.token);
    setSignedIn(true);
    await refreshAll({ quiet: true });
  } catch (error) {
    elements.loginError.textContent = error.message;
    elements.loginError.hidden = false;
  } finally {
    elements.loginButton.disabled = false;
    elements.loginButton.textContent = "Sign in";
  }
});

elements.logoutButton.addEventListener("click", () => logout());
elements.refreshAll.addEventListener("click", () => refreshAll());
elements.autoRefresh.addEventListener("change", startAutoRefresh);

elements.filterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.offset = 0;
  loadData().catch((error) => showToast(`Query failed: ${error.message}`));
});

elements.tableFilter.addEventListener("change", () => {
  syncFilterAvailability();
  state.offset = 0;
  loadData().catch((error) => showToast(`Query failed: ${error.message}`));
});

elements.previousPage.addEventListener("click", () => {
  state.offset = Math.max(0, state.offset - state.limit);
  loadData().catch((error) => showToast(`Query failed: ${error.message}`));
});

elements.nextPage.addEventListener("click", () => {
  if (state.offset + state.limit < state.total) {
    state.offset += state.limit;
    loadData().catch((error) => showToast(`Query failed: ${error.message}`));
  }
});

elements.exportButton.addEventListener("click", async () => {
  elements.exportButton.disabled = true;
  elements.exportButton.textContent = "Exporting…";
  try {
    const response = await api(`/api/admin/export?${buildQuery(false)}`);
    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `${elements.tableFilter.value}.csv`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("CSV exported");
  } catch (error) {
    showToast(`Export failed: ${error.message}`);
  } finally {
    elements.exportButton.disabled = false;
    elements.exportButton.textContent = "Export current CSV";
  }
});

syncFilterAvailability();
if (state.token) {
  setSignedIn(true);
  refreshAll({ quiet: true });
} else {
  setSignedIn(false);
}
