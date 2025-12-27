// Notes Configuration
// --- Configuration ---
const REPO_BASE = 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/';
const LIST_JSON_URL = 'https://raw.githubusercontent.com/SrirammananS/SrirammananS.github.io/main/CFIS/pdfs/list.json';
const SITE_CONFIG_URL = 'https://raw.githubusercontent.com/SrirammananS/SrirammananS.github.io/main/CFIS/pdfs/site_config.json';


// State
let notesConfig = [];
let newsData = [];
let linksData = [];

// --- Dashboard Data (Loaded Dynamically) ---
// Defaults/Fallbacks in case fetch fails
newsData = [
    { date: 'Loading...', text: 'Fetching updates...', new: false }
];

linksData = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initApp();
});

async function initApp() {
    // Initial Render with dummy/loading data
    renderNews();
    renderQuickLinks();

    // UI Setup
    setupFilters();
    setupSearch();
    setupCmdPalette(); // [NEW] Command Palette
    initAnimations();
    setupMagneticHover();

    // Parallel Data Fetch
    await Promise.all([
        fetchNotes(),
        fetchSiteConfig()
    ]);


    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }

    initChatWidget();
}

function initChatWidget() {
    const tooltip = document.querySelector('#chat-tooltip');
    if (!tooltip) return;

    // Show after delay
    // Show after delay
    setTimeout(() => {
        tooltip.classList.add('visible');

        // Hide after 5 seconds of showing
        setTimeout(() => {
            tooltip.classList.remove('visible');
        }, 7000);
    }, 2000);
}

async function fetchSiteConfig() {
    try {
        // Try getting remote config first
        const response = await fetch(SITE_CONFIG_URL);
        if (!response.ok) throw new Error('Remote config not found');
        const data = await response.json();

        newsData = data.news || [];
        linksData = data.links || [];

        // Re-render
        renderNews();
        renderQuickLinks();
    } catch (e) {

        // In local dev without python server, this might fail on CORS or file:// protocol
        // We can fallback to fetching local file relative path if hosting via VS Code Live Server
        try {
            const localResp = await fetch('site_config.json');
            const localData = await localResp.json();
            newsData = localData.news;
            linksData = localData.links;
            renderNews();
            renderQuickLinks();
        } catch (err) {
            console.error('Config load failed', err);
        }
    }
}

async function fetchNotes() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Syncing with Archive...</p>';

    try {
        const response = await fetch(LIST_JSON_URL);
        const data = await response.json();

        // Transform list.json to our config format
        notesConfig = data.map(item => ({
            id: item.filename.replace(/\.pdf$/i, '').replace(/[^a-z0-9]/gi, '_').toLowerCase(),
            semester: item.category === 'semester2' ? 'Sem 2' : 'Sem 1', // Simple inferred mapping
            subject: (item.tags && item.tags[0]) ? item.tags[0].toUpperCase() : 'General',
            title: item.title,
            description: item.description,
            pdfUrl: REPO_BASE + encodeURIComponent(item.filename),
            type: item.filename.endsWith('.html') ? 'link' : 'pdf'
        }));

        renderNotes('all');
    } catch (error) {
        console.error('Failed to load notes:', error);
        grid.innerHTML = '<p style="color:#ef4444; text-align:center;">Failed to load archive data. Please refresh.</p>';
    }
}

// Render News
function renderNews() {
    const container = document.getElementById('news-feed');
    // Duplicate data for seamless marquee loop
    const loopData = [...newsData, ...newsData]; // A + A

    const itemsHtml = loopData.map(item => `
        <div class="news-item">
            <div class="news-content">
                <span>${item.text}</span>
                ${item.new ? '<span class="news-badge">NEW</span>' : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = `<div class="news-track">${itemsHtml}</div>`;
}

// Render Links
function renderQuickLinks() {
    const container = document.getElementById('quick-links');
    container.innerHTML = linksData.map(link => `
        <a href="${link.url}" target="_blank" class="quick-link">
            <span class="link-icon">${link.icon}</span>
            <span class="link-label">${link.title}</span>
        </a>
    `).join('');
}

// Render Notes (with Filter & Search)
function renderNotes(filter, searchQuery = '') {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = ''; // Clear current

    const searchLower = searchQuery.toLowerCase();

    const filteredNotes = notesConfig.filter(note => {
        // [NEW] Favorites Filter
        if (filter === 'favorites') {
            const favs = JSON.parse(localStorage.getItem('cfis_favorites') || '[]');
            if (!favs.includes(note.id)) return false;
        }

        const matchesFilter = (filter === 'all' || filter === 'favorites' || note.semester === filter);
        const matchesSearch =
            note.title.toLowerCase().includes(searchLower) ||
            note.subject.toLowerCase().includes(searchLower) ||
            note.description.toLowerCase().includes(searchLower);

        return matchesFilter && matchesSearch;
    });

    if (filteredNotes.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">No visible particles found.</p>';
        return;
    }

    filteredNotes.forEach(note => {
        // Determine Type Label
        let typeLabel = 'Note';
        const titleLower = note.title.toLowerCase();
        if (titleLower.includes('guide')) typeLabel = 'Guide';
        else if (titleLower.includes('syllabus')) typeLabel = 'Syllabus';
        else if (titleLower.includes('recording')) typeLabel = 'Video';
        else if (titleLower.includes('question')) typeLabel = 'Q&A';

        const card = document.createElement('div');
        card.className = 'glass-panel card';
        card.id = note.id; // For deep linking

        // Check if Fav
        const favs = JSON.parse(localStorage.getItem('cfis_favorites') || '[]');
        const isFav = favs.includes(note.id);

        card.innerHTML = `
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${note.id}')">
                ${isFav ? '❤️' : '🤍'}
            </button>
            <div class="card-content" onclick="openPreview('${note.pdfUrl}', '${note.title.replace(/'/g, "\\'")}', '${note.type}')">
                <div class="card-meta">
                    <span class="subject-tag">${note.subject}</span>
                    <span class="sem-tag">${note.semester}</span>
                </div>
                <div style="margin-bottom: 0.5rem;">
                     <span class="type-tag">${typeLabel}</span>
                </div>
                <h3 class="card-title">${note.title}</h3>
                <p class="card-desc">${note.description}</p>
            </div>
            <div class="card-action">
                <button class="btn-glass" onclick="openPreview('${note.pdfUrl}', '${note.title.replace(/'/g, "\\'")}', '${note.type}')">
                    <span>Preview</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z"/></svg>
                </button>
                <button class="icon-btn" onclick="copyLink('${note.id}')" title="Copy Link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </button>
            </div>
        `;

        // Add mouse move listener for gradient effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });

        grid.appendChild(card);
    });

    // Re-trigger entrance animation for new cards
    gsap.fromTo('.card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out', clearProps: 'transform' }
    );
}

// Filter Setup
function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class
            buttons.forEach(b => b.classList.remove('active'));
            // Add active class
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            renderNotes(filter, searchInput.value);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        renderNotes(activeFilter, e.target.value);
    });
}

// GSAP Animations
function initAnimations() {
    // Hero Text Scramble
    gsap.to('#scramble-text', {
        duration: 2,
        text: {
            value: "ACADEMIC_ARCHIVE",
            delimiter: ""
        },
        ease: "none",
        onStart: () => {
            // Helper to create random chars effect if TextPlugin allows, 
            // otherwise simple typing. 
            // For custom scramble:
            const tl = gsap.timeline();
            const originalText = "ACADEMIC_ARCHIVE";
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

            // Simple visual hack for scramble not using complex custom logic
            // The TextPlugin handles simple substitution nicely.
        }
    });

    // Animate Toast
    const toast = document.getElementById('welcome-toast');
    gsap.to(toast, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay: 1,
        ease: "back.out(1.7)"
    });

    // Auto hide toast
    setTimeout(() => {
        gsap.to(toast, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            pointerEvents: 'none'
        });
    }, 5000);
}

// Magnetic Hover Effect
function setupMagneticHover() {
    // Apply to buttons or specific elements
    const elements = document.querySelectorAll('.btn-glass, .filter-btn');

    elements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(el, {
                duration: 0.3,
                x: x * 0.2, // Magnetic pull strength
                y: y * 0.2,
                ease: 'power2.out'
            });
        });

        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                duration: 0.5,
                x: 0,
                y: 0,
                ease: 'elastic.out(1, 0.3)'
            });
        });
    });
}

// --- Features ---

// Preview
function openPreview(url, title, type) {
    if (type === 'link') {
        window.open(url, '_blank');
        return;
    }

    const modal = document.getElementById('pdf-modal');
    const frame = document.getElementById('pdf-frame');
    const titleEl = document.getElementById('preview-title');
    const newTabBtn = document.getElementById('open-new-tab');

    // FIX: Use Google Docs Viewer for reliable cross-browser PDF embedding
    // Pass 'embedded=true' to get the chrome-less viewer
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

    frame.src = viewerUrl;

    titleEl.innerText = title;
    newTabBtn.href = url;

    modal.classList.add('active');
}

function closePreview() {
    const modal = document.getElementById('pdf-modal');
    const frame = document.getElementById('pdf-frame');
    modal.classList.remove('active');
    setTimeout(() => frame.src = '', 300); // Clear after transiton
}

// Deep Linking
function copyLink(id) {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!');
}

function checkDeepLink() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    // Wait for render
    setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight');
            setTimeout(() => el.classList.remove('highlight'), 2000);
        }
    }, 500);
}

function showToast(msg) {
    // Re-use notification logic or simple alert for now if simpler
    // We already have a toast container, let's inject a new one
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'glass-panel toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">🔗</span>
            <div class="toast-text">
                <span class="toast-title">Success</span>
                <span class="toast-msg">${msg}</span>
            </div>
        </div>
    `;
    container.appendChild(toast);

    gsap.fromTo(toast, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });

    setTimeout(() => {
        gsap.to(toast, { y: 20, opacity: 0, onComplete: () => toast.remove() });
    }, 3000);
}

// --- Mega Features ---

// 1. Favorites System
function toggleFavorite(e, id) {
    e.stopPropagation(); // Don't trigger card click

    let favs = JSON.parse(localStorage.getItem('cfis_favorites') || '[]');

    if (favs.includes(id)) {
        favs = favs.filter(i => i !== id);
        showToast('Removed from Favorites');
    } else {
        favs.push(id);
        showToast('Added to Favorites ❤️');
    }

    localStorage.setItem('cfis_favorites', JSON.stringify(favs));

    // Refresh current view (if filtering by favs, item matches disappears)
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    const searchInput = document.getElementById('search-input');
    renderNotes(activeFilter, searchInput.value);
}

// 2. Command Palette
function setupCmdPalette() {
    const overlay = document.getElementById('cmd-overlay');
    const input = document.getElementById('cmd-input');
    const list = document.getElementById('cmd-items');
    let selectedIndex = 0;

    // Toggle
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            overlay.classList.add('active');
            input.focus();
            renderCmdItems('');
        }
        if (e.key === 'Escape') overlay.classList.remove('active');
    });

    // Close on click out
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    // Input Input
    input.addEventListener('input', (e) => {
        renderCmdItems(e.target.value);
        selectedIndex = 0;
    });

    // Keyboard Nav
    input.addEventListener('keydown', (e) => {
        const items = document.querySelectorAll('.cmd-item');
        if (e.key === 'ArrowDown') {
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        }
        else if (e.key === 'ArrowUp') {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection(items);
        }
        else if (e.key === 'Enter') {
            items[selectedIndex].click();
        }
    });

    function updateSelection(items) {
        items.forEach((item, i) => {
            if (i === selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            }
            else item.classList.remove('selected');
        });
    }

    function renderCmdItems(query) {
        list.innerHTML = '';
        const q = query.toLowerCase();

        // Actions
        const actions = [
            { type: 'Action', label: 'Go Home', action: () => document.querySelector('[data-filter="all"]').click() },
            { type: 'Action', label: 'Show Favorites', action: () => document.querySelector('[data-filter="favorites"]').click() },
            { type: 'Action', label: 'Focus Mode 🍅', action: () => toggleFocusMode() },
            { type: 'Action', label: 'Community Discussion', action: () => openCommentsModal() }, // [NEW] Separate Comments
        ];

        // Notes (Top 5 matches)
        const notes = notesConfig
            .filter(n => n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q))
            .slice(0, 5)
            .map(n => ({
                type: 'Note',
                label: n.title,
                sub: n.subject,
                action: () => { openPreview(n.pdfUrl, n.title, n.type); overlay.classList.remove('active'); }
            }));

        const all = [...actions.filter(a => a.label.toLowerCase().includes(q)), ...notes];

        if (all.length === 0) {
            list.innerHTML = '<div style="padding:1rem; color:grey;">No results found</div>';
            return;
        }

        all.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = `cmd-item ${i === 0 ? 'selected' : ''}`;
            el.innerHTML = `
                <div>
                    <b>${item.label}</b>
                    ${item.sub ? `<span style="font-size:0.8rem; opacity:0.6; margin-left:10px;">${item.sub}</span>` : ''}
                </div>
                <span style="font-size:0.7rem; opacity:0.5; border:1px solid #333; padding:2px 4px; border-radius:4px;">${item.type}</span>
            `;
            el.addEventListener('click', () => {
                item.action();
                overlay.classList.remove('active');
            });
            list.appendChild(el);
        });
    }
}

// 3. Focus Mode
let focusInterval;
let focusSeconds = 25 * 60;
let isFocusRunning = false;

function toggleFocusMode() {
    const body = document.body;
    const overlay = document.getElementById('focus-overlay');
    const controls = document.getElementById('focus-controls');

    if (body.classList.contains('focus-active')) {
        // Disable
        body.classList.remove('focus-active');
        overlay.style.background = 'transparent';
        controls.style.display = 'none';
        document.querySelector('.top-nav').style.opacity = '1';
        document.querySelector('.site-footer').style.opacity = '1';
        document.querySelector('.dashboard-grid').style.opacity = '1';
    } else {
        // Enable
        body.classList.add('focus-active');
        overlay.style.background = '#000'; // Dim out everything
        controls.style.display = 'flex';
        // Hide distractions
        document.querySelector('.top-nav').style.opacity = '0.1';
        document.querySelector('.site-footer').style.opacity = '0';
        document.querySelector('.dashboard-grid').style.opacity = '0';

        // Scroll to content
        document.getElementById('notes-grid').scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleTimer() {
    const btn = document.getElementById('timer-btn');

    if (isFocusRunning) {
        clearInterval(focusInterval);
        isFocusRunning = false;
        btn.innerText = 'Resume';
    } else {
        isFocusRunning = true;
        btn.innerText = 'Pause';

        // Initial tick
        focusInterval = setInterval(() => {
            focusSeconds--;
            if (focusSeconds <= 0) {
                clearInterval(focusInterval);
                new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
                alert('Focus Session Complete!');
                focusSeconds = 25 * 60;
                isFocusRunning = false;
                btn.innerText = 'Start Session';
                updateTimerDisplay();
            } else {
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function adjustTimer(minutes) {
    if (isFocusRunning) return; // Prevent changing while running
    focusSeconds += minutes * 60;
    if (focusSeconds < 60) focusSeconds = 60; // Min 1 min
    if (focusSeconds > 120 * 60) focusSeconds = 120 * 60; // Max 120 mins
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const m = Math.floor(focusSeconds / 60);
    const s = focusSeconds % 60;
    document.getElementById('focus-timer').innerText = `${m}:${s < 10 ? '0' + s : s}`;
}

// 4. Comments Module
function openCommentsModal() {
    const modal = document.getElementById('comments-modal');
    modal.classList.add('active');

    // Lazy load Giscus only when opened to save performance
    const container = document.getElementById('giscus-container');
    if (container.innerHTML.trim() === '') {
        const script = document.createElement('script');
        script.src = "https://giscus.app/client.js";
        script.setAttribute("data-repo", "SrirammananS/SrirammananS.github.io");
        script.setAttribute("data-repo-id", "R_kgDOOvV8vA");
        script.setAttribute("data-category", "General");
        script.setAttribute("data-category-id", "DIC_kwDOOvV8vM4C0SBI");
        script.setAttribute("data-mapping", "specific");
        script.setAttribute("data-term", "CFIS | WEB | General");
        script.setAttribute("data-strict", "1");
        script.setAttribute("data-reactions-enabled", "1");
        script.setAttribute("data-emit-metadata", "0");
        script.setAttribute("data-input-position", "bottom");
        script.setAttribute("data-theme", "dark_dimmed");
        script.setAttribute("data-lang", "en");
        script.setAttribute("crossorigin", "anonymous");
        script.async = true;
        container.appendChild(script);
    }
}

// Move this to global scope
window.openCommentsModal = openCommentsModal;
window.closeCommentsModal = function () {
    document.getElementById('comments-modal').classList.remove('active');
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
