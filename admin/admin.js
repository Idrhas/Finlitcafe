// ── Config — same values as app.js ───────────────────────────────────────────
const SUPABASE_URL     = 'https://peyfqyqsltxnwvhsfzxl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uzkq-b0BRv4BDesrqIz7Ag_fair9PpJ';

// Set your admin password here (or use Supabase Auth for production)
const ADMIN_PASSWORD = 'Aboogeeky123';

// ── Auth ──────────────────────────────────────────────────────────────────────
function login() {
  const pw    = document.getElementById('passwordInput').value;
  const errEl = document.getElementById('loginError');
  const card  = document.querySelector('.login-card');

  if (pw === ADMIN_PASSWORD) {
    errEl.classList.remove('visible');
    sessionStorage.setItem('flc_admin', '1');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadEntries();
  } else {
    // Show error message
    errEl.classList.add('visible');
    // Shake the card for feedback
    card.classList.remove('shake');
    void card.offsetWidth; // force reflow so animation restarts
    card.classList.add('shake');
    // Clear the password field so user can retype cleanly
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  }
}

function togglePw() {
  const input  = document.getElementById('passwordInput');
  const toggle = document.getElementById('pwToggle');
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '🙈';
    toggle.setAttribute('aria-label', 'Hide password');
  } else {
    input.type = 'password';
    toggle.textContent = '👁';
    toggle.setAttribute('aria-label', 'Show password');
  }
}

function logout() {
  sessionStorage.removeItem('flc_admin');
  location.reload();
}

// Initialise once DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('passwordInput');
  if (pwInput) {
    // Enter key submits
    pwInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') login();
    });
    // Hide error as soon as user starts retyping
    pwInput.addEventListener('input', () => {
      document.getElementById('loginError').classList.remove('visible');
    });
  }

  // Auto-login if session exists from a previous visit
  if (sessionStorage.getItem('flc_admin') === '1') {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadEntries();
  }
});

// ── Data ──────────────────────────────────────────────────────────────────────
let allEntries = [];
let sortKey    = 'created_at';
let sortAsc    = false;

async function loadEntries() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allEntries = await res.json();
    updateStats();
    renderTable();
  } catch (err) {
    document.getElementById('tableBody').innerHTML =
      `<tr><td colspan="7" class="loading-row" style="color:#C0392B">
        Failed to load entries. Check your Supabase config.<br/>
        <small>${err.message}</small>
      </td></tr>`;
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statTotal').textContent    = allEntries.length;
  document.getElementById('statLearners').textContent = allEntries.filter(e => e.role === 'Learner').length;
  document.getElementById('statExperts').textContent  = allEntries.filter(e => e.role === 'Expert').length;
  document.getElementById('statBoth').textContent     = allEntries.filter(e => e.role === 'Both').length;
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderTable() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const role   = document.getElementById('roleFilter').value;

  let rows = allEntries.filter(e => {
    const matchSearch =
      !search ||
      `${e.first_name} ${e.last_name} ${e.email} ${e.zip_code}`.toLowerCase().includes(search);
    const matchRole = !role || e.role === role;
    return matchSearch && matchRole;
  });

  // Sort
  rows.sort((a, b) => {
    let va = a[sortKey] ?? '';
    let vb = b[sortKey] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const tbody = document.getElementById('tableBody');

  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-row">No entries found.</td></tr>`;
    document.getElementById('tableCount').textContent = '';
    return;
  }

  tbody.innerHTML = rows.map((e, i) => {
    const topics = Array.isArray(e.topics) ? e.topics : [];
    const topicsHtml = topics.map(t => `<span class="topic-tag">${t}</span>`).join('');
    const date = e.created_at ? new Date(e.created_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }) : '—';

    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${esc(e.first_name)} ${esc(e.last_name)}</strong></td>
        <td><a href="mailto:${esc(e.email)}" style="color:var(--brown)">${esc(e.email)}</a></td>
        <td>${esc(e.zip_code)}</td>
        <td><span class="role-badge role-${esc(e.role)}">${esc(e.role)}</span></td>
        <td><div class="topics-cell">${topicsHtml}</div></td>
        <td>${date}</td>
      </tr>`;
  }).join('');

  document.getElementById('tableCount').textContent =
    `Showing ${rows.length} of ${allEntries.length} entries`;
}

// ── Sort ──────────────────────────────────────────────────────────────────────
function sortBy(key) {
  if (sortKey === key) sortAsc = !sortAsc;
  else { sortKey = key; sortAsc = true; }
  renderTable();
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV() {
  if (!allEntries.length) return;

  const headers = ['First Name', 'Last Name', 'Email', 'ZIP', 'Role', 'Topics', 'Signed Up'];
  const rows = allEntries.map(e => [
    e.first_name,
    e.last_name,
    e.email,
    e.zip_code,
    e.role,
    Array.isArray(e.topics) ? e.topics.join('; ') : '',
    e.created_at ? new Date(e.created_at).toISOString() : '',
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `finlitcafe-waitlist-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
