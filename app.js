// app.js
const pdfDirectory = "pdfs"; // PDFs folder in repo root
const pdfList = document.getElementById("pdfList");
const searchBox = document.getElementById("searchBox");
const loading = document.getElementById("loading");
const error = document.getElementById("error");

async function fetchPDFList() {
  try {
    const res = await fetch(`${pdfDirectory}/list.json`);
    const files = await res.json();
    loading.classList.add("hidden");
    displayPDFs(files);
  } catch (err) {
    loading.classList.add("hidden");
    error.classList.remove("hidden");
    console.error("Failed to load PDF list:", err);
  }
}

function displayPDFs(files) {
  pdfList.innerHTML = "";
  files.forEach((file) => {
    const card = document.createElement("div");
    card.className = "pdf-card";
    card.innerHTML = `<h3>${file.title}</h3><p>${file.description}</p><a href="${pdfDirectory}/${file.filename}" target="_blank" rel="noopener">Download</a>`;
    pdfList.appendChild(card);
  });
}

searchBox.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase();
  const cards = document.querySelectorAll(".pdf-card");
  cards.forEach((card) => {
    card.style.display = card.textContent.toLowerCase().includes(term)
      ? "block"
      : "none";
  });
});

fetchPDFList();

/* list.json (example content in pdfs/list.json)
[
  {
    "title": "Introduction to Algorithms",
    "description": "Notes on sorting and searching algorithms.",
    "filename": "algorithms_intro.pdf"
  },
  {
    "title": "Operating Systems",
    "description": "Key concepts and architecture.",
    "filename": "operating_systems.pdf"
  }
]
*/
