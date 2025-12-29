// Notes Configuration
// --- Configuration ---
const REPO_BASE = 'https://github.com/SrirammananS/SrirammananS.github.io/raw/main/CFIS/pdfs/';
const LIST_JSON_URL = 'https://raw.githubusercontent.com/SrirammananS/SrirammananS.github.io/main/CFIS/pdfs/list.json';
const SITE_CONFIG_URL = 'https://raw.githubusercontent.com/SrirammananS/SrirammananS.github.io/main/CFIS/pdfs/site_config.json';


// State
let notesConfig = [];
let newsData = [];
let linksData = [];
let galleryAssets = []; // [NEW] Global Store

// --- Dashboard Data (Loaded Dynamically) ---
// Defaults/Fallbacks in case fetch fails
newsData = [
    { date: 'Loading...', text: 'Fetching updates...', new: false }
];

linksData = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initApp();
    initPWAPrompt(); // PWA Install Prompt
});

async function initApp() {
    // Initial Render with dummy/loading data
    // Initial Render with Skeletons
    renderSkeletons();

    // UI Setup
    setupFilters();
    setupSearch();
    setupCmdPalette(); // [NEW] Command Palette
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initAnimations();
    setupMagneticHover();
    setupNavbarScroll(); // [NEW] Navbar Scroll Logic
    checkGlassPref(); // [NEW] Check Glass Preference

    // Parallel Data Fetch
    await Promise.all([
        fetchNotes(),
        fetchSiteConfig(),
        fetchGallery()
    ]);

    // Check Deep Links (Asset param)
    const params = new URLSearchParams(window.location.search);
    const assetParam = params.get('asset');
    if (assetParam && galleryAssets.length > 0) {
        const asset = galleryAssets.find(a => a.name === assetParam);
        if (asset) {
            const isImg = asset.type.startsWith('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(asset.name);
            const rawUrl = asset.url; // Or proxy if needed
            // Proxy logic from fetchGallery is needed here or standard raw
            const getProxyUrl = (u) => u.replace('raw.githubusercontent.com', 'raw.githack.com');
            const finalUrl = isImg ? rawUrl : getProxyUrl(rawUrl);
            openGalleryModal(finalUrl, asset.name, isImg ? 'image' : 'html');
        }
    }

    // Check Anchor Deep Links (News/Links)
    setTimeout(checkDeepLink, 1000);


    // Register PWA Service Worker
    // Wrap in a protocol check to prevent errors on file://
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw.js');
    }

    initChatWidget();
    renderReadingNow(); // Initial call
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

// Navbar Scroll Logic (Pin on Scroll Up)
function setupNavbarScroll() {
    const nav = document.querySelector('.top-nav');
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;

                // Show if scrolling up OR at the very top
                if (currentScrollY < lastScrollY || currentScrollY < 50) {
                    nav.classList.add('visible');
                } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                    // Hide if scrolling down and not at top
                    nav.classList.remove('visible');
                }

                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial check
    nav.classList.add('visible');
}

async function fetchSiteConfig() {
    try {
        // Try getting remote config first with cache-busting
        const response = await fetch(`${SITE_CONFIG_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Remote config not found');
        const data = await response.json();

        newsData = data.news || [];
        linksData = data.links || [];

        // Re-render
        renderNews();
        renderQuickLinks();
        renderNotes('all'); // Re-render notes to apply labels
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
            renderNotes('all');
        } catch (err) {
            console.error('Config load failed', err);
        }
    }
}

async function fetchNotes() {
    const grid = document.getElementById('notes-grid');
    renderSkeletons();

    try {
        const response = await fetch(`${LIST_JSON_URL}?t=${Date.now()}`);
        const data = await response.json();

        // Transform list.json to our config format
        notesConfig = data.map(item => ({
            id: item.filename.replace(/\.pdf$/i, '').replace(/[^a-z0-9]/gi, '_').toLowerCase(),
            semester: item.category === 'semester2' ? 'Sem 2' : 'Sem 1', // Simple inferred mapping
            subject: (item.tags && item.tags[0]) ? item.tags[0].charAt(0).toUpperCase() + item.tags[0].slice(1).toLowerCase() : 'General',
            title: item.title,
            description: item.description,
            pdfUrl: REPO_BASE + encodeURIComponent(item.filename),
            type: item.type || (item.filename.endsWith('.html') ? 'link' : 'pdf'),
            emoji: item.emoji || '',
            color: item.color || ''
        }));

        renderNotes('all');
    } catch (error) {
        console.error('Failed to load notes:', error);
        grid.innerHTML = '<p style="color:#ef4444; text-align:center;">Failed to load archive data. Please refresh.</p>';
    }
}

// Skeleton Loader
function renderSkeletons() {
    const newsFeed = document.getElementById('news-feed');
    const quickLinks = document.getElementById('quick-links');

    if (newsFeed) {
        newsFeed.innerHTML = Array(3).fill(0).map(() => `
            <div class="skeleton news-item" style="height: 100px; margin-bottom: 1rem;">
                <div class="skeleton skeleton-text" style="width: 40%; height: 20px;"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
            </div>
        `).join('');
    }

    if (quickLinks) {
        quickLinks.innerHTML = Array(12).fill(0).map(() => `
            <div class="skeleton" style="height: 100px; border-radius: 12px;"></div>
        `).join('');
    }
}

// 6. News Feed Render
function renderNews() {
    const container = document.getElementById('news-feed');
    // Removal of duplicate loop for manual scroll requirement
    const itemsHtml = newsData.map(item => createNewsItemHtml(item)).join('');

    container.innerHTML = `<div class="news-track">${itemsHtml}</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // GSAP ScrollTrigger Animation
}

// Render Helper for News Item
function createNewsItemHtml(item) {
    const anchorId = item.id ? `news-${item.id}` : '';
    const hasLink = item.url && item.url.trim() !== '';
    const clickAttr = hasLink ? `onclick="window.open('${item.url}', '_blank')"` : '';
    const cursorStyle = hasLink ? 'cursor: pointer; transition: transform 0.2s;' : '';

    return `
        <div class="news-item" ${anchorId ? `id="${anchorId}"` : ''} ${clickAttr} style="${cursorStyle}">
            <div class="news-content">
                <span style="display:flex; align-items:center; gap:0.5rem;">
                    ${item.text}
                    ${hasLink ? '<i data-lucide="external-link" style="width:14px; height:14px; color:var(--accent-color);"></i>' : ''}
                </span>
                
                ${item.new ? '<span class="news-badge">New</span>' : ''}
            </div>
            ${item.enableShare ? `
                <button onclick="shareNews('${item.id}', event)" class="icon-btn" aria-label="Share update">
                    <i data-lucide="share-2"></i>
                </button>
            ` : ''}
        </div>
    `;
}


// Render Links
function renderQuickLinks() { // 4. Quick Links (Vertical Ticker - Restored Style)
    const container = document.getElementById('quick-links');
    if (linksData && linksData.length > 0) {
        // Pad to multiple of 3 to ensure perfect grid rows for vertical ticker
        const paddedLinks = [...linksData];
        while (paddedLinks.length % 3 !== 0) {
            paddedLinks.push(linksData[paddedLinks.length % linksData.length]);
        }

        const createLink = (l) => `
            <a href="${l.url}" target="_blank" class="quick-link" ${l.id ? `id="link-${l.id}"` : ''}>
                <span class="link-icon" style="font-size:1.5rem;">${l.icon}</span>
                <span class="link-label" style="font-weight:500;">${l.title}</span>
                ${l.enableShare && l.id ? `
                    <button onclick="event.preventDefault(); copyAnchorLink('link-${l.id}')" class="share-icon-btn small">
                        🔗
                    </button>` : ''}
            </a>
        `;

        container.innerHTML = `
            <div class="quick-links-container">
                <div class="links-ticker-track">
                    ${paddedLinks.map(createLink).join('')}
                    <!-- Duplicate for infinite scroll -->
                    ${paddedLinks.map(createLink).join('')}
                </div>
            </div>
        `;
    } else {
        container.innerHTML = '<p class="text-secondary">No quick links available.</p>';
    }
}

// Render Skeleton State
function renderSkeletons() {
    const grid = document.getElementById('notes-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton';
        skeleton.innerHTML = `
            <div class="card-header">
                <div class="tags-group">
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-pill"></div>
                </div>
            </div >
            <div class="card-content">
                <div class="skeleton-label skeleton-text"></div>
                <div class="skeleton-title skeleton-text"></div>
                <div class="skeleton-text" style="width:100%;"></div>
                <div class="skeleton-text" style="width:100%;"></div>
            </div>
        `;
        grid.appendChild(skeleton);
    }
}

function trackReadingProgress(id) {
    if (!id) return;
    let recent = JSON.parse(localStorage.getItem('cfis_recent') || '[]');
    recent = recent.filter(i => i !== id);
    recent.unshift(id);
    recent = recent.slice(0, 3); // Roadmap V1: Store top 3
    localStorage.setItem('cfis_recent', JSON.stringify(recent));

    renderReadingNow();
}

function renderReadingNow() {
    const section = document.getElementById('reading-now-section');
    const grid = document.getElementById('reading-now-grid');
    if (!section || !grid) return;

    const recentIds = JSON.parse(localStorage.getItem('cfis_recent') || '[]');
    if (recentIds.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = '';

    recentIds.forEach(id => {
        const note = notesConfig.find(n => n.id === id);
        if (note) {
            const card = createThumbnailCard(note);
            grid.appendChild(card);
        }
    });

    // Animate entrance
    gsap.from('#reading-now-section .thumbnail-card', {
        x: -20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out'
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Helper: Create Minimal Thumbnail Card
function createThumbnailCard(note) {
    const card = document.createElement('div');
    card.className = 'thumbnail-card';
    card.onclick = (e) => openPreview(e, note.pdfUrl, note.title, note.type, note.id);

    // Icon
    const iconUrl = note.type === 'pdf' ? 'https://unpkg.com/lucide-static@latest/icons/file-text.svg' : 'https://unpkg.com/lucide-static@latest/icons/link.svg';

    card.innerHTML = `
        <div class="icon-wrapper">
            <img src="${iconUrl}" width="24" height="24" alt="Icon" style="filter: invert(1);">
        </div>
        <h3 title="${note.title}">${note.title}</h3>
    `;

    return card;
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
        grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1; text-align: center; padding: 2rem;">No results found.</p>';
        return;
    }

    // Determine if we should use STACKS (only when filter is a Semester and no active search)
    const useStacks = (filter.startsWith('Sem')) && searchQuery === '';
    const isMobile = window.innerWidth <= 768;

    if (useStacks) {
        // Group by subject
        const groups = {};
        filteredNotes.forEach(note => {
            const sub = note.subject || 'GENERAL';
            if (!groups[sub]) groups[sub] = [];
            groups[sub].push(note);
        });

        // Sorted Subjects
        const subjects = Object.keys(groups).sort((a, b) => {
            if (a === 'GENERAL') return 1;
            if (b === 'GENERAL') return -1;
            return a.localeCompare(b);
        });

        subjects.forEach(sub => {
            const groupNotes = groups[sub];
            if (groupNotes.length > 1 && sub !== 'GENERAL') {
                // Use folders on mobile, zones on desktop
                if (isMobile) {
                    renderMobileSection(sub, groupNotes, grid);
                } else {
                    renderZone(sub, groupNotes, grid);
                }
            } else {
                groupNotes.forEach(note => renderCard(note, grid));
            }
        });
    } else {
        // Render all as tiles (Grid view)
        filteredNotes.forEach(note => renderCard(note, grid));
    }

    // GSAP Entrance Animation
    gsap.from('.card, .zone-container, .mobile-subject-section', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all'
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function renderCard(note, container, isStackItem = false) {
    const card = document.createElement('article'); // Semantic HTML
    card.className = `card ${isStackItem ? 'stack-item' : ''} `;
    card.id = note.id;

    const favs = JSON.parse(localStorage.getItem('cfis_favorites') || '[]');
    const isFav = favs.includes(note.id);
    const recents = JSON.parse(localStorage.getItem('cfis_recent') || '[]');
    const isRecent = recents.includes(note.id);

    // Map emoji and color from list.json
    const emoji = note.emoji || (note.type === 'pdf' ? '📄' : '🔗');
    const labelColor = note.color || (note.type === 'pdf' ? '#3b82f6' : '#10b981');

    // Using Lucide icons for high reliability
    const lucideBase = 'https://unpkg.com/lucide-static@latest/icons/';
    const iconUrl = note.type === 'pdf' ? `${lucideBase}file-text.svg` : `${lucideBase}link.svg`;
    const typeLabel = note.type === 'pdf' ? 'Document' : 'Resource';

    card.className = `card note-card glass-panel ${note.type}`;
    card.setAttribute('data-note-id', note.id);

    card.innerHTML = `
            <div class="card-bg"></div>
        <div class="card-emoji-topleft" style="position: absolute; top: 1rem; left: 1rem; font-size: 1.2rem; z-index: 10;">${emoji}</div>
        <div class="card-header">
            <div class="card-actions-top">
                <button class="action-btn preview" onclick="openPreview(event, '${note.pdfUrl}', '${note.title.replace(/'/g, "\\'")}', '${note.type}', '${note.id}')" aria-label="Preview">
                    <img src="${lucideBase}eye.svg" width="20" height="20" alt="Preview icon" style="filter: invert(1);">
                </button>
                <button class="action-btn fav ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${note.id}')" aria-label="Favorite">
                    <img src="${lucideBase}heart.svg" width="20" height="20" alt="Favorite icon" style="filter: ${isFav ? 'none' : 'invert(1)'};">
                </button>
                <button class="action-btn share" onclick="shareNote(event, '${note.id}', '${note.title.replace(/'/g, "\\'")}')" aria-label="Share">
                    <img src="${lucideBase}share-2.svg" width="20" height="20" alt="Share icon" style="filter: invert(1);">
                </button>
            </div>
        </div>
        <div class="card-content">
            <div class="icon-wrapper" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 8px;">
                 <img src="${iconUrl}" width="20" height="20" alt="${typeLabel}" class="icon-3d" style="filter: invert(1); opacity: 0.8;">
            </div>
            <h3 class="card-title">${note.title}</h3>
        </div>
        <div class="card-footer">
            <div class="card-metadata">
                <div class="meta-item">
                    <span class="meta-label">Subject:</span>
                    <span class="meta-value">${note.subject}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Semester:</span>
                    <span class="meta-value">${note.semester}</span>
                </div>
                <div class="meta-item tags" style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px;">
                    <span class="meta-label">Tags:</span>
                    <span class="meta-value" style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <span class="tag-pill" style="background: ${labelColor}20; color: ${labelColor}; border: 1px solid ${labelColor}40;">${typeLabel}</span>
                        ${note.type && note.type.toLowerCase().includes('mam') ? `<span class="tag-pill" style="background: #eab30820; color: #eab308; border: 1px solid #eab30840;">Mam notes</span>` : ''}
                    </span>
                </div>
                ${isRecent ? `
                <div class="meta-item status">
                    <span class="meta-label">Status:</span>
                    <span class="meta-value highlight" style="color: var(--accent-color);">Reading</span>
                </div>` : ''}
            </div>
        </div>
        `;

    card.onclick = () => openPreview(null, note.pdfUrl, note.title.replace(/'/g, "\\'"), note.type, note.id);

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x} px`);
        card.style.setProperty('--mouse-y', `${y} px`);
    });

    container.appendChild(card);
}

// Mobile Section Renderer (Clean List View)
function renderMobileSection(subject, notes, container) {
    const section = document.createElement('div');
    section.className = 'mobile-subject-section';

    // Create section header
    const header = document.createElement('div');
    header.className = 'mobile-subject-header';
    header.innerHTML = `
        <div class="mobile-subject-title">
            <span>📚</span>
            <span>${subject}</span>
        </div>
        <div class="mobile-subject-count">${notes.length} file${notes.length > 1 ? 's' : ''}</div>
    `;

    // Create file list
    const fileList = document.createElement('div');
    fileList.className = 'mobile-file-list';

    // Render each file as a list item
    notes.forEach(note => {
        const item = document.createElement('div');
        item.className = 'mobile-file-item';

        // Icon
        const lucideBase = 'https://unpkg.com/lucide-static@latest/icons/';
        const iconUrl = note.type === 'pdf' ? `${lucideBase}file-text.svg` : `${lucideBase}link.svg`;
        const typeLabel = note.type === 'pdf' ? 'PDF' : 'Link';

        item.innerHTML = `
            <div class="mobile-file-icon">
                <img src="${iconUrl}" alt="${typeLabel}">
            </div>
            <div class="mobile-file-title">${note.title}</div>
            <div class="mobile-file-tag">${typeLabel}</div>
        `;

        // Click to open preview
        item.onclick = () => openPreview(null, note.pdfUrl, note.title, note.type, note.id);

        fileList.appendChild(item);
    });

    section.appendChild(header);
    section.appendChild(fileList);
    container.appendChild(section);
}

// Global state for Zone management
let activeZoneView = null;
const zoneExpansionMap = new WeakMap();

function renderZone(subject, notes, container) {
    const zone = document.createElement('div');
    zone.className = 'zone-container';

    // 3D Tilt Effect
    zone.addEventListener('mousemove', (e) => {
        const rect = zone.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        zone.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    zone.addEventListener('mouseleave', () => {
        zone.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });

    const stackArea = document.createElement('div');
    stackArea.className = 'zone-stack-area';

    // Simplified cards for the stack
    const cardLimit = Math.min(7, notes.length);
    for (let i = 0; i < cardLimit; i++) {
        const dummy = document.createElement('div');
        dummy.className = 'card zone-card';
        const isTop = (i === 0);

        // [NEW] Max 3 visible
        if (i >= 3) dummy.style.opacity = '0';

        dummy.innerHTML = `
            <div class="card-bg"></div>
                <div class="card-content" style="padding: 1rem; display: flex; align-items: center; justify-content: center; text-align: center; height: 100%; opacity: ${isTop ? 1 : 0}; pointer-events: ${isTop ? 'auto' : 'none'}; transition: opacity 0.3s;">
                    <h3 class="card-title" style="font-size: 0.8rem; opacity: 0.8; margin: 0;">${notes[i].title}</h3>
                </div>
        `;
        stackArea.appendChild(dummy);
    }
    zone.appendChild(stackArea);

    // Footer
    const zoneFooter = document.createElement('div');
    zoneFooter.className = 'zone-footer';
    zoneFooter.innerHTML = `
            <span class="zone-subject">${subject}</span>
                <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.05); padding:0.2rem 0.6rem; border-radius:12px;">
                    <span class="zone-count">${notes.length} Files</span>
                    <i data-lucide="chevron-down" class="zone-chevron" style="transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></i>
                </div>
        `;
    zone.appendChild(zoneFooter);

    // Click to Expand
    zone.onclick = (e) => {
        e.stopPropagation();
        expandZone(subject, notes, zone);
    };

    // Shuffle Logic
    let cardOrder = Array.from({ length: cardLimit }, (_, i) => i);
    let shuffleInterval = null;

    const performShuffle = () => {
        if (zone.classList.contains('active')) return;

        const cards = stackArea.querySelectorAll('.zone-card');
        if (cards.length < 2) return;

        const bottomCardIdx = cardOrder.pop();
        cardOrder.unshift(bottomCardIdx);

        cards.forEach((card, i) => {
            const pos = cardOrder.indexOf(i); // 0 is top
            const content = card.querySelector('.card-content');

            if (i === bottomCardIdx) {
                // Animation for card moving to top
                gsap.timeline()
                    .to(card, { x: 100, rotation: 20, duration: 0.3, ease: "power2.in" })
                    .set(card, { zIndex: 12 })
                    .to(card, {
                        x: 0, rotation: 0, y: 0, scale: 1, opacity: 1, // [FIX] Ensure visible
                        startAt: { yPercent: -150, scale: 1.1 }, yPercent: -50,
                        duration: 0.5, ease: "back.out(1.7)",
                        onStart: () => {
                            if (content) {
                                gsap.to(content, { opacity: 1, duration: 0.3, delay: 0.1 });
                                content.style.pointerEvents = 'auto';
                            }
                        }
                    });
                if (content) content.style.opacity = 0; // Hide initially
            } else {
                // Stack shuffle
                gsap.to(card, {
                    zIndex: 10 - pos,
                    yPercent: -50,
                    y: -(pos * 12),
                    scale: 1 - (pos * 0.04),
                    opacity: pos < 3 ? 1 : 0, // [NEW] visual max 3
                    duration: 0.4,
                    ease: "power2.out",
                    onUpdate: () => {
                        if (content) content.style.opacity = (pos === 0) ? 1 : 0;
                    }
                });
                if (content && pos !== 0) content.style.pointerEvents = 'none';
            }
        });
    };

    let hasHovered = false;
    zone.addEventListener('mouseenter', () => {
        if (!hasHovered) {
            hasHovered = true;
            // First-time "Peek" animation
            gsap.to(stackArea.querySelectorAll('.zone-card'), {
                y: (i) => -10 - (i * 5),
                duration: 0.2, yoyo: true, repeat: 1, stagger: 0.05
            });
        }
        if (cardLimit >= 2) {
            performShuffle();
            shuffleInterval = setInterval(performShuffle, 1200);
        }
    });

    zone.addEventListener('mouseleave', () => {
        if (shuffleInterval) {
            clearInterval(shuffleInterval);
            shuffleInterval = null;
        }
    });

    container.appendChild(zone);
}

function expandZone(subject, notes, zoneEl) {
    if (zoneEl.classList.contains('active')) {
        // --- COLLAPSE ---
        const injectedCards = zoneExpansionMap.get(zoneEl) || [];
        const zoneRect = zoneEl.getBoundingClientRect();

        // Animate cards back to stack
        injectedCards.forEach((card, i) => {
            const rect = card.getBoundingClientRect();
            gsap.to(card, {
                x: zoneRect.left - rect.left,
                y: zoneRect.top - rect.top,
                scale: 0.5, opacity: 0,
                duration: 0.4,
                delay: (injectedCards.length - 1 - i) * 0.03, // Reverse stagger
                ease: "power2.in",
                onComplete: () => card.remove()
            });
        });

        // Restore Stack
        gsap.to(zoneEl.querySelectorAll('.zone-card'), {
            scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: "back.out(1.2)"
        });

        // UI Updates
        const chevron = zoneEl.querySelector('.zone-chevron');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        const count = zoneEl.querySelector('.zone-count');
        if (count) count.textContent = `${notes.length} Files`;

        zoneEl.classList.remove('active');
        zoneExpansionMap.delete(zoneEl);
        return;
    }

    // --- EXPAND ---
    zoneEl.classList.add('active');

    // Empty Stack Animation
    gsap.to(zoneEl.querySelectorAll('.zone-card'), {
        scale: 0.5, opacity: 0, duration: 0.3, stagger: 0.02, ease: "power2.in"
    });

    // UI Updates
    const chevron = zoneEl.querySelector('.zone-chevron');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    const count = zoneEl.querySelector('.zone-count');
    if (count) count.textContent = `Close`;

    // Inject Cards ("Deal" Animation)
    const parentGrid = zoneEl.parentElement;
    const nextSibling = zoneEl.nextSibling;
    const newCards = [];
    const zoneRect = zoneEl.getBoundingClientRect();

    notes.forEach((note, index) => {
        const temp = document.createElement('div');
        renderCard(note, temp, true); // true = skip append
        const card = temp.firstElementChild;
        card.classList.add('zone-injected-card');

        // Insert into DOM to get layout
        if (nextSibling) parentGrid.insertBefore(card, nextSibling);
        else parentGrid.appendChild(card);

        newCards.push(card);

        // FLIP Animation: From Stack to Grid
        const cardRect = card.getBoundingClientRect();
        gsap.from(card, {
            x: zoneRect.left - cardRect.left,
            y: zoneRect.top - cardRect.top,
            scale: 0.5,
            opacity: 0,
            rotation: -10 + (Math.random() * 20),
            duration: 0.6,
            delay: index * 0.05,
            ease: "power3.out",
            clearProps: "all"
        });
    });

    zoneExpansionMap.set(zoneEl, newCards);
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

            // Liquid Transition (Subtle scale pop)
            gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });

            const filter = btn.getAttribute('data-filter');
            renderNotes(filter, searchInput.value);
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const readingSection = document.getElementById('reading-now-section');

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (query.length > 0) {
                if (readingSection) readingSection.style.display = 'none';
            } else {
                renderReadingNow();
            }
            const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
            renderNotes(activeFilter, query);
        }, 200); // Approximately 200ms as per requirements.
    });
}

// GSAP Animations
function initAnimations() {
    // Hero Text Scramble
    gsap.to('#scramble-text', {
        duration: 2,
        text: {
            value: "Academic Archive",
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
function openPreview(e, url, title, type, id = null) {
    if (e && e.stopPropagation) e.stopPropagation();

    // Track Progress
    if (id) trackReadingProgress(id);

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
function copyLink(e, id) {
    if (e && e.stopPropagation) e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!');
}

function checkDeepLink() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;

    // Check if it's a file anchor (format: file-{id})
    if (hash.startsWith('file-')) {
        const fileId = hash.replace('file-', '');

        // Wait for notes to be loaded
        setTimeout(() => {
            const note = notesConfig.find(n => n.id === fileId);
            if (note) {
                // First, scroll to the card
                const cardElement = document.querySelector(`[data-note-id="${fileId}"]`);
                if (cardElement) {
                    cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    cardElement.classList.add('highlight');

                    // Then open the preview after scroll animation
                    setTimeout(() => {
                        openPreview(null, note.pdfUrl, note.title, note.type, note.id);
                        showToast('📂 Opening shared file...');
                        cardElement.classList.remove('highlight');
                    }, 800);
                } else {
                    // If card not found, just open preview
                    openPreview(null, note.pdfUrl, note.title, note.type, note.id);
                    showToast('📂 Opening shared file...');
                }
            } else {
                showToast('⚠️ File not found');
            }
        }, 800);
        return;
    }

    // Original scroll-to-element behavior for other anchors
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

        if (isFocusRunning) toggleTimer();

        document.querySelector('.top-nav').style.opacity = '1';
        document.querySelector('.site-footer').style.opacity = '1';
        document.querySelector('.dashboard-grid').style.opacity = '1';
    } else {
        // Enable
        body.classList.add('focus-active');
        overlay.style.background = 'rgba(0,0,0,0.95)';
        controls.style.display = 'flex';

        // Persistence: Load focus note
        const savedNote = localStorage.getItem('cfis_focus_note');
        if (savedNote) document.getElementById('focus-note').value = savedNote;

        // Save note on change
        document.getElementById('focus-note').oninput = (e) => {
            localStorage.setItem('cfis_focus_note', e.target.value);
        };

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

// 5. Gallery (Horizontal Marquee)
async function fetchGallery() {
    const track = document.getElementById('gallery-track');
    if (!track) return;

    const REPO_OWNER = 'SrirammananS';
    const REPO_NAME = 'SrirammananS.github.io';
    const IMAGES_JSON_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/CFIS/images/images.json`;

    try {
        const response = await fetch(`${IMAGES_JSON_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error('No gallery config');
        let assets = await response.json();
        assets = assets.reverse(); // Newest first
        galleryAssets = assets; // Store global

        if (assets.length === 0) return;

        // Render helper with PROXY FIX
        const createItem = (asset) => {
            const isImg = asset.type.startsWith('image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(asset.name);
            const isPdf = asset.name.toLowerCase().endsWith('.pdf');

            // Proxy URL generator
            const getProxyUrl = (rawUrl) => {
                return rawUrl.replace('raw.githubusercontent.com', 'raw.githack.com');
            };

            const proxyUrl = getProxyUrl(asset.url);

            // Added .no-copy class for protection logic
            if (isImg) {
                return `
                <div class="gallery-item no-copy" onclick="openGalleryModal('${asset.url}', '${asset.name}', 'image')">
                    <img src="${asset.url}" alt="${asset.name}" class="gallery-img" loading="lazy">
                </div>`;
            } else if (isPdf) {
                return `
                <div class="gallery-item no-copy" onclick="openGalleryModal('${asset.url}', '${asset.name}', 'pdf')">
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:0.5rem; background:rgba(255,255,255,0.03); border:1px solid var(--glass-border); border-radius:12px;">
                        <span style="font-size:2.5rem;">📄</span>
                        <span style="font-size:0.7rem; opacity:0.6; text-align:center; padding:0 0.5rem; overflow:hidden; text-overflow:ellipsis; width:80%;">PDF: ${asset.name}</span>
                    </div>
                </div>`;
            } else {
                // For HTML, use iframe with PROXY URL
                return `
                <div class="gallery-item no-copy" onclick="openGalleryModal('${proxyUrl}', '${asset.name}', 'html')">
                    <div style="position:relative; width:100%; height:100%;">
                         <iframe src="${proxyUrl}" class="html-thumb-frame" sandbox="allow-scripts allow-same-origin"></iframe>
                         <div style="position:absolute; inset:0; z-index:2; background:transparent;"></div> <!-- Click shield -->
                    </div>
                </div>`;
            }
        };

        // Populate Track (Duplicate content for infinite scroll illusion)
        // Repeat items enough times to fill width + scroll area
        const itemsHtml = assets.map(createItem).join('');
        // Repeat at least 6 times to safe-guard wide screens
        track.innerHTML = itemsHtml.repeat(6);

    } catch (e) {
        console.warn('Gallery load failed', e);
    }
}

// Gallery Modal (Dynamic)
function openGalleryModal(url, title, type) {
    let modal = document.getElementById('gallery-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gallery-modal';
        modal.className = 'modal-search-overlay lightbox';
        modal.innerHTML = `
            <div class="glass-panel modal-content lightbox">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; width:100%; box-sizing:border-box;">
                    <h3 id="gallery-modal-title" style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:1rem; font-size:1.1rem; color:rgba(255,255,255,0.5);"></h3>
                     <div style="display:flex; gap:0.5rem; flex-shrink:0;">
                        <button class="btn-primary" id="gallery-share-btn" style="padding:0.3rem 0.8rem; font-size:0.8rem;">🔗 Share</button>
                        <button class="icon-btn" onclick="closeGalleryModal()">✕</button>
                    </div>
                </div>
                <!-- Action Bar injected via JS -->
                <div class="modal-body lightbox" id="gallery-modal-body" style="display:flex; align-items:center; justify-content:center; height:100%; padding:0;">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const body = document.getElementById('gallery-modal-body');
    const shareBtn = document.getElementById('gallery-share-btn');
    document.getElementById('gallery-modal-title').innerText = title;

    // Attach Share Logic
    shareBtn.onclick = () => shareItem(url, title);

    if (type === 'image') {
        body.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain;" class="no-copy" oncontextmenu="return false;">`;
    } else if (type === 'pdf') {
        const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
        body.innerHTML = `<iframe src="${viewerUrl}" style="width:100%; height:100%; border:none;" class="no-copy"></iframe>`;
    } else {
        // Protected Iframe
        body.innerHTML = `<iframe src="${url}" style="width:100%; height:100%; border:none;" sandbox="allow-scripts allow-forms allow-same-origin" class="no-copy"></iframe>`;
    }

    modal.classList.add('active');
    document.body.classList.add('lightbox-active');
}

window.closeGalleryModal = function () {
    const modal = document.getElementById('gallery-modal');
    if (modal) modal.classList.remove('active');
    document.body.classList.remove('lightbox-active');
};

// Share Function
async function shareItem(url, title) {
    const deepLink = window.location.origin + window.location.pathname + '?asset=' + encodeURIComponent(title);

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Admin Archives: ' + title,
                text: 'Check out this item from the archives:',
                url: deepLink
            });
        } catch (err) {
            // User cancelled or failed
            copyToClipboard(deepLink);
        }
    } else {
        copyToClipboard(deepLink);
    }
}


function copyAnchorLink(id) {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied!');
        // Highlight logic
        checkDeepLink();
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Link copied to clipboard!");
    }).catch(err => {
        prompt("Copy link manually:", text);
    });
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

function shareNote(event, id, title) {
    if (event) event.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#file-${id}`;

    if (navigator.share) {
        navigator.share({
            title: title,
            url: shareUrl
        }).catch(err => console.log('Error sharing', err));
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('🔗 Link copied to clipboard!');
        });
    }
}

// 12. Manual Scroll Control
function toggleMarquee(id) {
    const list = document.getElementById(id);
    if (!list) return;

    // Target the actual track with the animation
    const track = list.querySelector('.news-track') || list.querySelector('.marquee-content') || list;

    const isPaused = track.style.animationPlayState === 'paused';
    track.style.animationPlayState = isPaused ? 'running' : 'paused';

    // Update button text if possible
    const btn = event ? event.currentTarget : null;
    if (btn && btn.tagName === 'BUTTON') {
        btn.innerText = isPaused ? 'Toggle Auto-Scroll' : 'Manual Mode';
        btn.style.background = isPaused ? '' : 'rgba(255, 255, 255, 0.1)';
    }

    // Ensure manual scrollability
    if (!isPaused) {
        list.style.overflowY = 'auto';
        list.style.overflowX = 'hidden';
        showToast('🖱️ Manual scroll enabled');
    } else {
        list.style.overflow = 'hidden';
        showToast('🔄 Auto-scroll enabled');
    }
}

// Toggle Liquid Glass Effect (Performance Mode)
function toggleGlassEffect() {
    const body = document.body;
    body.classList.toggle('simple-mode');
    const isSimple = body.classList.contains('simple-mode');
    localStorage.setItem('cfis_simple_mode', isSimple);
    updateGlassBtnState(isSimple);
}

function updateGlassBtnState(isSimple) {
    const btn = document.getElementById('glass-toggle-btn');
    if (!btn) return;

    if (isSimple) {
        btn.querySelector('span:last-child').innerText = 'Normal';
        btn.style.opacity = '0.7';
        showToast('💧 Glass Effect Disabled');
    } else {
        btn.querySelector('span:last-child').innerText = 'Glass';
        btn.style.opacity = '1';
        showToast('✨ Glass Effect Enabled');
    }
}

// Mobile Menu Logic
function toggleMobileMenu() {
    const overlay = document.getElementById('mobile-menu-overlay');
    overlay.classList.toggle('active');

    if (overlay.classList.contains('active')) {
        // Populate if empty
        const newsContainer = document.getElementById('mobile-news-container');
        const linksContainer = document.getElementById('mobile-links-container');

        if (newsContainer.innerHTML.trim() === '') {
            // Clone News
            const newsSource = document.getElementById('news-feed');
            if (newsSource) {
                newsContainer.innerHTML = '<h4>Latest Updates</h4>' + newsSource.innerHTML;
            }

            // Render Links Specific for Mobile (No Duplicates)
            if (typeof linksData !== 'undefined' && linksData.length > 0) {
                const mobileLinksHtml = linksData.map(l => `
                    <a href="${l.url}" target="_blank" class="quick-link" style="padding: 0.8rem; margin-bottom: 0.5rem; background: rgba(255,255,255,0.03); border-radius: 8px; display: flex; align-items: center; gap: 0.8rem; text-decoration: none; color: inherit;">
                        <span style="font-size: 1.2rem;">${l.icon}</span>
                        <span style="font-weight: 500; font-size: 0.9rem;">${l.title}</span>
                    </a>
                 `).join('');
                linksContainer.innerHTML = '<h4>Quick Links</h4><div style="display:flex; flex-direction:column;">' + mobileLinksHtml + '</div>';
            }

            // Add Focus & Discussion Controls
            const controlsContainer = document.getElementById('mobile-controls-container');
            if (controlsContainer) {
                controlsContainer.innerHTML = `
                    <button onclick="toggleFocusMode(); toggleMobileMenu();" class="glass-panel" style="padding: 0.8rem 1.2rem; border-radius: 12px; display: flex; align-items: center; gap: 0.8rem; cursor: pointer; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); font-size: 0.95rem; font-weight: 500; width: 100%;">
                        <span>🧘</span>
                        <span>Focus Mode</span>
                    </button>
                    <button onclick="openCommentsModal(); toggleMobileMenu();" class="glass-panel" style="padding: 0.8rem 1.2rem; border-radius: 12px; display: flex; align-items: center; gap: 0.8rem; cursor: pointer; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); font-size: 0.95rem; font-weight: 500; width: 100%;">
                        <span>💬</span>
                        <span>Community Discussions</span>
                    </button>
                    <button onclick="toggleGlassEffect();" class="glass-panel" style="padding: 0.8rem 1.2rem; border-radius: 12px; display: flex; align-items: center; gap: 0.8rem; cursor: pointer; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.03); color: var(--text-secondary); font-size: 0.95rem; font-weight: 500; width: 100%;">
                        <span>💧</span>
                        <span>Glass Effect</span>
                    </button>
                `;
            }

            // Re-run icons
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
}

// Check saved preference
function checkGlassPref() {
    const isSimple = localStorage.getItem('cfis_simple_mode') === 'true';
    if (isSimple) {
        document.body.classList.add('simple-mode');
        // Wait for DOM
        setTimeout(() => updateGlassBtnState(true), 100);
    }
}
// PWA Install Prompt
let deferredPrompt;

function initPWAPrompt() {
    // Capture the install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Check if already installed or dismissed
        const dismissed = localStorage.getItem('cfis_pwa_dismissed');
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (!dismissed && !isStandalone) {
            // Show install prompt after 3 seconds
            setTimeout(showPWAPrompt, 3000);
        }
    });

    // Detect if app was installed
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        localStorage.removeItem('cfis_pwa_dismissed');
    });
}

function showPWAPrompt() {
    const toast = document.createElement('div');
    toast.className = 'glass-panel toast pwa-install-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 90%;
        animation: slideUp 0.3s ease-out;
    `;

    toast.innerHTML = `
        <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">📱 Install App</div>
            <div style="font-size: 0.85rem; opacity: 0.8;">Add to home screen for better experience</div>
        </div>
        <button onclick="installPWA()" class="btn-glass" style="background: var(--accent-color); color: #000; padding: 0.5rem 1rem; font-weight: 600; white-space: nowrap;">
            Install
        </button>
        <button onclick="dismissPWAPrompt()" class="icon-btn" style="opacity: 0.5;">
            ✕
        </button>
    `;

    document.body.appendChild(toast);

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translate(-50%, 100px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function installPWA() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('PWA installed');
        }
        deferredPrompt = null;
        dismissPWAPrompt();
    });
}

function dismissPWAPrompt() {
    const toast = document.querySelector('.pwa-install-toast');
    if (toast) {
        toast.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }
    localStorage.setItem('cfis_pwa_dismissed', 'true');
}
