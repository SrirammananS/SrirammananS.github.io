// Config
const pdfDirectory = "pdfs";              // Folder containing PDFs and list.json
const listFile = `${pdfDirectory}/list.json`;

const els = {
  list: document.getElementById("pdfList"),
  search: document.getElementById("searchBox"),
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  noResults: document.getElementById("noResults"),
  category: document.getElementById("categoryFilter"),
  sort: document.getElementById("sortOrder"),
  clear: document.getElementById("clearFilters"),
  tagsBar: document.getElementById("tagsBar"),
  darkToggle: document.getElementById("darkModeToggle"),
};

let allPDFs = [];
let activeTags = new Set();

// --- Utilities
const debounce = (fn, ms = 150) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
};
const escapeHTML = (s) => s?.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) || "";

function highlight(text, term) {
  if (!term) return escapeHTML(text || "");
  const safe = escapeHTML(text || "");
  return safe.replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>");
}

// --- Theme
(function initTheme(){
  const pref = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.body.classList.toggle("dark-mode", pref === "dark");
  els.darkToggle.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
})();
els.darkToggle.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
  els.darkToggle.textContent = dark ? "☀️" : "🌙";
});

// --- Data load
async function fetchPDFList() {
  try {
    const res = await fetch(listFile, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // basic schema guard
    if (!Array.isArray(data)) throw new Error("list.json must be an array");
    allPDFs = data.map(item => ({
      title: String(item.title || "").trim(),
      description: String(item.description || ""),
      filename: String(item.filename || ""),
      category: String(item.category || "library"),
      date: String(item.date || ""),
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 8) : []
    }));
    els.loading.classList.add("hidden");
    buildTags(allPDFs);
    render();
  } catch (e) {
    console.error(e);
    els.loading.classList.add("hidden");
    els.error.classList.remove("hidden");
  }
}

// --- Tags
function buildTags(items) {
  const tagCounts = new Map();
  items.forEach(i => (i.tags || []).forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
  els.tagsBar.innerHTML = "";
  [...tagCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 12).forEach(([tag, count]) => {
    const btn = document.createElement("button");
    btn.className = "tag";
    btn.type = "button";
    btn.textContent = `${tag} (${count})`;
    btn.dataset.tag = tag;
    btn.addEventListener("click", () => {
      if (activeTags.has(tag)) activeTags.delete(tag); else activeTags.add(tag);
      btn.classList.toggle("active");
      render();
    });
    els.tagsBar.appendChild(btn);
  });
}

// --- Render
function render() {
  const term = els.search.value.trim().toLowerCase();
  let items = allPDFs.slice();

  // category
  const cat = els.category.value;
  if (cat !== "all") items = items.filter(i => i.category === cat);

  // tags
  if (activeTags.size > 0) items = items.filter(i => i.tags?.some(t => activeTags.has(t)));

  // search
  if (term) {
    items = items.filter(i =>
      i.title.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term) ||
      i.tags?.some(t => t.toLowerCase().includes(term))
    );
  }

  // sort
  const sort = els.sort.value;
  if (sort === "az") items.sort((a,b) => a.title.localeCompare(b.title));
  if (sort === "za") items.sort((a,b) => b.title.localeCompare(a.title));
  if (sort === "newest") items.sort((a,b) => new Date(b.date) - new Date(a.date));

  els.list.innerHTML = "";
  if (items.length === 0) {
    els.noResults.classList.remove("hidden");
    els.list.setAttribute("aria-busy", "false");
    return;
  }
  els.noResults.classList.add("hidden");

  // build cards
  const frag = document.createDocumentFragment();
  items.forEach(file => {
    const card = document.createElement("article");
    card.className = "pdf-card";
    card.innerHTML = `
      <h3 class="pdf-title">${highlight(file.title, term)}</h3>
      <p class="pdf-desc">${highlight(file.description || "No description available", term)}</p>
      <div class="meta">
        <span>${file.category === "semester2" ? "Semester II" : "Library"}</span>
        <time datetime="${escapeHTML(file.date)}">${fmtDate(file.date)}</time>
      </div>
      <div class="card-actions">
        <a href="${pdfDirectory}/${encodeURIComponent(file.filename)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHTML(file.title)} in new tab">Open</a>
        <a class="secondary" href="${pdfDirectory}/${encodeURIComponent(file.filename)}" download aria-label="Download ${escapeHTML(file.title)}">Download</a>
      </div>
    `;
    frag.appendChild(card);
  });
  els.list.appendChild(frag);
  els.list.setAttribute("aria-busy", "false");
}

// --- Events
els.search.addEventListener("input", debounce(render, 120));
els.category.addEventListener("change", render);
els.sort.addEventListener("change", render);
els.clear.addEventListener("click", () => {
  els.category.value = "all";
  els.sort.value = "az";
  els.search.value = "";
  activeTags.clear();
  document.querySelectorAll(".tag.active").forEach(t => t.classList.remove("active"));
  render();
});

// Init
fetchPDFList();
