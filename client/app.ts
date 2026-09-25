interface Entry {
  date: string;
  time: string;
  description: string;
  protein_g: number;
}

interface TodayResponse {
  date: string;
  total: number;
  goal: number;
  entries: Entry[];
}

interface Estimate {
  protein_g: number;
  description: string;
  breakdown: string;
}

interface ImagePayload {
  mimeType: string;
  data: string;
}

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};

async function api<T>(
  url: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(url, {
    method: options.method,
    headers: { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

function setStatus(message = ""): void {
  $("status").textContent = message;
}

// Read a File as { mimeType, data } with base64 data (no data: prefix).
function readImage(file: File): Promise<ImagePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        mimeType: file.type,
        data: (reader.result as string).split(",")[1],
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function refresh(): Promise<void> {
  const { total, goal, entries } = await api<TodayResponse>("/api/today");
  $("total").textContent = String(Math.round(total));
  $("goal").textContent = String(goal);
  $<HTMLProgressElement>("bar").max = goal;
  $<HTMLProgressElement>("bar").value = total;
  $("entries").replaceChildren(
    ...entries.map((e) => {
      const li = document.createElement("li");
      li.textContent = `${e.time} — ${e.description}: ${e.protein_g} g`;
      return li;
    }),
  );
}

function resetForms(): void {
  $<HTMLFormElement>("estimate-form").reset();
  $("estimate-form").hidden = false;
  $("confirm-form").hidden = true;
  setStatus();
}

$("estimate-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = $<HTMLTextAreaElement>("text").value.trim();
  const file = $<HTMLInputElement>("photo").files?.[0];
  if (!text && !file)
    return setStatus("Enter a description or choose a photo.");

  setStatus("Estimating…");
  try {
    const image = file ? await readImage(file) : undefined;
    const result = await api<Estimate>("/api/estimate", {
      method: "POST",
      body: { text, image },
    });
    $("breakdown").textContent = result.breakdown;
    $<HTMLInputElement>("confirm-description").value = result.description;
    $<HTMLInputElement>("confirm-grams").value = String(result.protein_g);
    $("estimate-form").hidden = true;
    $("confirm-form").hidden = false;
    setStatus();
  } catch (err) {
    setStatus(errorMessage(err));
  }
});

$("confirm-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api<Entry>("/api/entries", {
      method: "POST",
      body: {
        description: $<HTMLInputElement>("confirm-description").value,
        protein_g: $<HTMLInputElement>("confirm-grams").value,
      },
    });
    resetForms();
    await refresh();
  } catch (err) {
    setStatus(errorMessage(err));
  }
});

$("cancel").addEventListener("click", resetForms);

$("edit-goal").addEventListener("click", async () => {
  const value = prompt("Daily protein goal (g):", $("goal").textContent ?? "");
  if (value === null) return;
  try {
    await api<{ goal: number }>("/api/goal", {
      method: "PUT",
      body: { goal: value },
    });
    await refresh();
  } catch (err) {
    setStatus(errorMessage(err));
  }
});

refresh().catch((err) => setStatus(errorMessage(err)));

// Marks this file as a module so its top-level names don't leak into the global scope.
export {};
