// ── Supabase config ──────────────────────────────────────────────────────────
// Replace these two values with your own from supabase.com → Project Settings → API
const SUPABASE_URL = 'https://peyfqyqsltxnwvhsfzxl.supabase.co';       // e.g. https://xyzabc.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_uzkq-b0BRv4BDesrqIz7Ag_fair9PpJ'; // starts with eyJ...

// ── State ────────────────────────────────────────────────────────────────────
let currentStep = 1;
const TOTAL_STEPS = 4;

const state = {
  firstName: '',
  lastName: '',
  email: '',
  zip: '',
  role: '',
  topics: [],
};

// ── Step navigation ───────────────────────────────────────────────────────────
function goStep(n) {
  if (n > currentStep && !validateStep(currentStep)) return;

  document.getElementById(`step${currentStep}`).classList.remove('active');
  currentStep = n;
  document.getElementById(`step${currentStep}`).classList.add('active');

  updateProgress();

  if (n === 4) populateReview();
}

function updateProgress() {
  const pct = (currentStep / TOTAL_STEPS) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  const isSuccess = currentStep === 5;
  document.getElementById('stepLabel').textContent = isSuccess
    ? 'Complete!'
    : `Step ${currentStep} of ${TOTAL_STEPS}`;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateStep(step) {
  if (step === 1) return validateBasicInfo();
  if (step === 2) return validateRole();
  if (step === 3) return validateTopics();
  return true;
}

function validateBasicInfo() {
  let valid = true;

  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('email').value.trim();
  const zip       = document.getElementById('zip').value.trim();

  setError('firstNameErr', 'firstName', !firstName ? 'First name is required.' : '');
  setError('lastNameErr',  'lastName',  !lastName  ? 'Last name is required.'  : '');

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  setError('emailErr', 'email', !email ? 'Email is required.' : !emailOk ? 'Enter a valid email.' : '');

  const zipOk = /^\d{5}(-\d{4})?$/.test(zip);
  setError('zipErr', 'zip', !zip ? 'ZIP code is required.' : !zipOk ? 'Enter a valid ZIP code.' : '');

  if (!firstName || !lastName || !email || !emailOk || !zip || !zipOk) valid = false;

  if (valid) {
    state.firstName = firstName;
    state.lastName  = lastName;
    state.email     = email;
    state.zip       = zip;
  }

  return valid;
}

function validateRole() {
  if (!state.role) {
    document.getElementById('roleErr').textContent = 'Please select a role.';
    return false;
  }
  document.getElementById('roleErr').textContent = '';
  return true;
}

function validateTopics() {
  const checked = [...document.querySelectorAll('.topic-chip input:checked')].map(i => i.value);
  if (checked.length === 0) {
    document.getElementById('topicsErr').textContent = 'Please select at least one topic.';
    return false;
  }
  document.getElementById('topicsErr').textContent = '';
  state.topics = checked;
  return true;
}

function setError(errId, inputId, msg) {
  document.getElementById(errId).textContent = msg;
  const input = document.getElementById(inputId);
  if (msg) input.classList.add('invalid');
  else input.classList.remove('invalid');
}

// ── Role selection ────────────────────────────────────────────────────────────
function selectRole(el) {
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.role = el.dataset.role;
  document.getElementById('roleErr').textContent = '';
}

// ── Review ────────────────────────────────────────────────────────────────────
function populateReview() {
  const initials = (state.firstName[0] + state.lastName[0]).toUpperCase();
  document.getElementById('reviewAvatar').textContent = initials;
  document.getElementById('reviewName').textContent   = `${state.firstName} ${state.lastName}`;
  document.getElementById('reviewRole').textContent   = state.role;

  const topicsEl = document.getElementById('reviewTopics');
  topicsEl.innerHTML = state.topics
    .map(t => `<span class="tag">${t}</span>`)
    .join('');
}

// ── Submit ────────────────────────────────────────────────────────────────────
async function submitForm() {
  const btn     = document.getElementById('submitBtn');
  const text    = document.getElementById('submitText');
  const spinner = document.getElementById('submitSpinner');
  const errEl   = document.getElementById('submitError');

  btn.disabled = true;
  text.classList.add('hidden');
  spinner.classList.remove('hidden');
  errEl.classList.add('hidden');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        first_name: state.firstName,
        last_name:  state.lastName,
        email:      state.email,
        zip_code:   state.zip,
        role:       state.role,
        topics:     state.topics,
      }),
    });

    if (!response.ok) {
      // Handle duplicate email gracefully
      const body = await response.json().catch(() => ({}));
      if (response.status === 409 || (body.code === '23505')) {
        // Already signed up — still show success
        showSuccess();
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    showSuccess();

  } catch (err) {
    console.error('Submission error:', err);
    errEl.classList.remove('hidden');
    btn.disabled = false;
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
}

function showSuccess() {
  document.getElementById('step4').classList.remove('active');
  currentStep = 5;
  document.getElementById('step5').classList.add('active');
  document.getElementById('progressFill').style.width = '100%';
  document.getElementById('stepLabel').textContent = 'Complete!';
}
