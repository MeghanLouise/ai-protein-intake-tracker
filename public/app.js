const $ = (id) => document.getElementById(id);

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body && JSON.stringify(options.body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function setStatus(message = '') {
  $('status').textContent = message;
}

// Read a File as { mimeType, data } with base64 data (no data: prefix).
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ mimeType: file.type, data: reader.result.split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function refresh() {
  const { total, goal, entries } = await api('/api/today');
  $('total').textContent = Math.round(total);
  $('goal').textContent = goal;
  $('bar').max = goal;
  $('bar').value = total;
  $('entries').replaceChildren(
    ...entries.map((e) => {
      const li = document.createElement('li');
      li.textContent = `${e.time} — ${e.description}: ${e.protein_g} g`;
      return li;
    }),
  );
}

$('estimate-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = $('text').value.trim();
  const file = $('photo').files[0];
  if (!text && !file) return setStatus('Enter a description or choose a photo.');

  setStatus('Estimating…');
  try {
    const image = file ? await readImage(file) : undefined;
    const result = await api('/api/estimate', { method: 'POST', body: { text, image } });
    $('breakdown').textContent = result.breakdown;
    $('confirm-description').value = result.description;
    $('confirm-grams').value = result.protein_g;
    $('estimate-form').hidden = true;
    $('confirm-form').hidden = false;
    setStatus();
  } catch (err) {
    setStatus(err.message);
  }
});

$('confirm-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await api('/api/entries', {
      method: 'POST',
      body: { description: $('confirm-description').value, protein_g: $('confirm-grams').value },
    });
    resetForms();
    await refresh();
  } catch (err) {
    setStatus(err.message);
  }
});

function resetForms() {
  $('estimate-form').reset();
  $('estimate-form').hidden = false;
  $('confirm-form').hidden = true;
  setStatus();
}

$('cancel').addEventListener('click', resetForms);

$('edit-goal').addEventListener('click', async () => {
  const value = prompt('Daily protein goal (g):', $('goal').textContent);
  if (value === null) return;
  try {
    await api('/api/goal', { method: 'PUT', body: { goal: value } });
    await refresh();
  } catch (err) {
    setStatus(err.message);
  }
});

refresh().catch((err) => setStatus(err.message));
