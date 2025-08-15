// Config
const pdfDir = "pdfs";
const listURL = `${pdfDir}/list.json`;

const els = {
  sem1: document.getElementById("sem1Grid"),
  sem2: document.getElementById("sem2Grid"),
  sem3: document.getElementById("sem3Grid"),
  sem4: document.getElementById("sem4Grid"),
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
  installBtn: document.getElementById("installBtn"),
};

let allPDFs = [];
let activeTags = new Set();
let deferredPrompt = null;

// Utilities
const debounce = (fn, ms = 140) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const esc = s => (s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmtDate = iso => { if (!iso) return "—"; const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"}); };
const hi = (t, term) => { if (!term) return esc(t); return esc(t).replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g,"\\$&")})`,"gi"),"<mark>$1</mark>"); };

// Theme
(function initTheme(){
  const pref = localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = pref;
  document.body.classList.toggle("dark-mode", pref === "dark");
  els.darkToggle.textContent = pref === "dark" ? "☀️" : "🌙";
})();
els.darkToggle.addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
  els.darkToggle.textContent = dark ? "☀️" : "🌙";
});

// Install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  els.installBtn.hidden = false;
});
els.installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  els.installBtn.hidden = true;
});

// Fetch data
async function loadList() {
  try {
    const res = await fetch(listURL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("list.json must be an array");
    allPDFs = data.map(x => ({
      title: String(x.title || "").trim(),
      description: String(x.description || ""),
      filename: String(x.filename || ""),
      category: String(x.category || "library"),
      date: String(x.date || ""),
      tags: Array.isArray(x.tags) ? x.tags.slice(0, 10) : []
    }));
    els.loading.classList.add("hidden");
    buildQuickSections();
    buildTags(allPDFs);
    handleHashRoute();
    render();
  } catch (e) {
    console.error(e);
    els.loading.classList.add("hidden");
    els.error.classList.remove("hidden");
  }
}

// Quick sections (top 4 recent per semester)
function buildQuickSections() {
  const byCat = (cat) => allPDFs.filter(i => i.category === cat)
                                .sort((a,b) => new Date(b.date)-new Date(a.date))
                                .slice(0, 4);
  mountCards(els.sem1, byCat("semester1"));
  mountCards(els.sem2, byCat("semester2"));
  mountCards(els.sem3, byCat("semester3"));
  mountCards(els.sem4, byCat("semester4"));
}

function mountCards(container, items) {
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = `<div class="status">No items yet.</div>`;
    return;
  }
  const frag = document.createDocumentFragment();
  items.forEach(f => frag.appendChild(cardEl(f)));
  container.appendChild(frag);
}

function cardEl(file, term = "") {
  const a = document.createElement("article");
  a.className = "pdf-card";
  a.innerHTML = `
    <h3 class="pdf-title">${hi(file.title, term)}</h3>
    <p class="pdf-desc">${hi(file.description || "No description available", term)}</p>
    <div class="meta">
      <span>${labelFor(file.category)}</span>
      <time datetime="${esc(file.date)}">${fmtDate(file.date)}</time>
    </div>
    <div class="card-actions">
      <a href="${pdfDir}/${encodeURIComponent(file.filename)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(file.title)}">Open</a>
      <a class="secondary" href="${pdfDir}/${encodeURIComponent(file.filename)}" download aria-label="Download ${esc(file.title)}">Download</a>
    </div>
  `;
  return a;
}
const labelFor = c => ({
  semester1: "Semester I",
  semester2: "Semester II",
  semester3: "Semester III",
  semester4: "Semester IV",
  library: "Library"
}[c] || "Library");

// Library render
function render() {
  const term = els.search.value.trim().toLowerCase();
  let items = allPDFs.slice();

  const cat = els.category.value;
  if (cat !== "all") items = items.filter(i => i.category === cat);
  if (activeTags.size) items = items.filter(i => i.tags?.some(t => activeTags.has(t)));

  if (term) {
    items = items.filter(i =>
      i.title.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term) ||
      i.tags?.some(t => t.toLowerCase().includes(term))
    );
  }

  const s = els.sort.value;
  if (s === "az") items.sort((a,b) => a.title.localeCompare(b.title));
  if (s === "za") items.sort((a,b) => b.title.localeCompare(a.title));
  if (s === "newest") items.sort((a,b) => new Date(b.date) - new Date(a.date));

  els.list.innerHTML = "";
  if (!items.length) {
    els.noResults.classList.remove("hidden");
    els.list.setAttribute("aria-busy","false");
    return;
  }
  els.noResults.classList.add("hidden");

  const frag = document.createDocumentFragment();
  items.forEach(f => frag.appendChild(cardEl(f, term)));
  els.list.appendChild(frag);
  els.list.setAttribute("aria-busy","false");
}

// Tags
function buildTags(items) {
  const counts = new Map();
  items.forEach(i => (i.tags || []).forEach(t => counts.set(t, (counts.get(t)||0)+1)));
  els.tagsBar.innerHTML = "";
  [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14).forEach(([tag,count])=>{
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

// Hash routing for deep links
function handleHashRoute() {
  const hash = location.hash || "";
  if (hash.startsWith("#library")) {
    const q = new URLSearchParams(hash.split("?")[1]);
    const cat = q.get("category");
    if (cat) els.category.value = cat;
    document.getElementById("library").scrollIntoView({ behavior: "smooth", block: "start" });
    render();
  } else if (hash.startsWith("#quick-sem")) {
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
window.addEventListener("hashchange", handleHashRoute);

// Events
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

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== els.search) {
    e.preventDefault(); els.search.focus(); return;
  }
  if (e.key.toLowerCase() === "d") { e.preventDefault(); els.darkToggle.click(); }
  if (e.key.toLowerCase() === "r") { e.preventDefault(); els.clear.click(); }
  if (e.key.toLowerCase() === "g") {
    let next = false;
    const onKey = (ev) => {
      if (next) {
        if (ev.key.toLowerCase() === "s") { location.hash = "#quick-sem2"; }
        document.removeEventListener("keydown", onKey, true);
      } else next = true;
    };
    document.addEventListener("keydown", onKey, true);
  }
});

// Lazy hydrate quick sections after first render
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if (e.isIntersecting) { e.target.classList.add("in-view"); }
  });
}, { rootMargin: "0px 0px -20% 0px" });
["quick-sem1","quick-sem2","quick-sem3","quick-sem4"].forEach(id=>{
  const el = document.getElementById(id);
  if (el) io.observe(el);
});

// Service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
}

// Init
loadList();
