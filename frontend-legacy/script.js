const API_URL = "http://localhost:8000/api";
const STREAM_URL_TEMPLATE_MOVIE = "https://www.youtube.com/embed/";
const STREAM_URL_TEMPLATE_TV = "https://www.youtube.com/embed/";

// Demo IDs (YouTube Video IDs) mapped to TMDB IDs
const DEMO_STREAMS = {
    27205: "YoHD9XEInc0", // Inception
    603: "vKQi3bBA1y8", // Matrix
    157336: "zSWdZVtXT7E", // Interstellar
    1396: "HhesaQXLuRY", // Breaking Bad
    66732: "b9EkMc79ZSU" // Stranger Things
};

let allMedia = [];
let trendingMedia = [];
let popularMovies = [];
let topTVShows = [];
let filteredMedia = []; // For filtering
let currentFilter = 'all'; // Track current filter
let continueWatching = [];
let pendingPlayItem = null;
let currentSeasonData = null; // Store fetched season/episode data

// Auth Check
if (typeof getActiveProfile !== 'undefined' && !getActiveProfile()) {
    window.location.href = 'login.html';
}

// Initialize profile avatar
window.addEventListener('DOMContentLoaded', () => {
    if (typeof getActiveProfile !== 'undefined') {
        const profile = getActiveProfile();
        if (profile && document.getElementById('profile-avatar')) {
            document.getElementById('profile-avatar').textContent = profile.avatar;
        }
    }
});

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
});

// --- Search Logic ---
const searchInput = document.getElementById('search-input');
let searchTimeout = null;

searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    clearTimeout(searchTimeout);

    if (query.length < 2) {
        document.getElementById('search-row').style.display = 'none';
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
            const results = await res.json();
            renderSearchResults(results);
        } catch (e) {
            console.error("Search failed", e);
        }
    }, 500);
});

function renderSearchResults(results) {
    const row = document.getElementById('search-row');
    const list = document.getElementById('search-list');
    list.innerHTML = '';

    if (!results || results.length === 0) {
        row.style.display = 'none';
        return;
    }

    row.style.display = 'block';
    results.forEach(item => {
        list.appendChild(createPoster(item));
    });
}
// --- End Search Logic ---

async function fetchMedia() {
    try {
        // Fetch User Library
        const res = await fetch(`${API_URL}/media`);
        allMedia = await res.json();

        // Fetch Trending & Popular (Populate "Real" rows)
        const [trendRes, movieRes, tvRes] = await Promise.all([
            fetch(`${API_URL}/trending`),
            fetch(`${API_URL}/discover?media_type=movie`),
            fetch(`${API_URL}/discover?media_type=tv`)
        ]);

        trendingMedia = await trendRes.json();
        popularMovies = await movieRes.json();
        topTVShows = await tvRes.json();

        filteredMedia = [...allMedia];
        await updateContinueWatching();
        renderRows();

        // Choose hero from trending or library
        const heroItem = trendingMedia[0] || allMedia[0];
        if (heroItem) updateHero(heroItem);

        startHeroCarousel();
    } catch (e) {
        console.error("Failed to fetch media", e);
    }
}

async function updateContinueWatching() {
    continueWatching = [];
    for (let item of allMedia) {
        const progRes = await fetch(`${API_URL}/progress/${item.tmdb_id}`);
        const progData = await progRes.json();
        if (progData.watched) {
            // item.watched = true; 
        }
    }
}

function renderRows() {
    const listElements = {
        'library': document.getElementById('movies-list'),
        'trending': document.getElementById('trending-list'),
        'popular': document.getElementById('popular-movies-list'),
        'toptv': document.getElementById('top-tv-list')
    };

    const rowContainers = {
        'library': document.getElementById('library-row'),
        'trending': document.getElementById('trending-row'),
        'popular': document.getElementById('popular-movies-row'),
        'toptv': document.getElementById('top-tv-row')
    };

    // Clear all
    Object.values(listElements).forEach(el => el && (el.innerHTML = ''));

    if (currentFilter === 'all') {
        // Show everything in distinct rows
        Object.values(rowContainers).forEach(el => el && (el.style.display = 'block'));

        if (trendingMedia.length > 0) trendingMedia.slice(0, 15).forEach(item => listElements.trending.appendChild(createPoster(item)));
        if (popularMovies.length > 0) popularMovies.slice(0, 15).forEach(item => listElements.popular.appendChild(createPoster(item)));
        if (topTVShows.length > 0) topTVShows.slice(0, 15).forEach(item => listElements.toptv.appendChild(createPoster(item)));
        if (allMedia.length > 0) allMedia.forEach(item => listElements.library.appendChild(createPoster(item)));

        const libTitle = rowContainers.library.querySelector('.row-title');
        if (libTitle) libTitle.textContent = 'Your Library';
    } else {
        // Hide trending/popular rows, show combined results in library row
        Object.keys(rowContainers).forEach(key => {
            if (key !== 'library') rowContainers[key].style.display = 'none';
        });

        const displayList = currentFilter === 'movie' ? popularMovies : topTVShows;
        if (displayList.length > 0) displayList.forEach(item => listElements.library.appendChild(createPoster(item)));

        const libTitle = rowContainers.library.querySelector('.row-title');
        if (libTitle) libTitle.textContent = currentFilter === 'movie' ? 'Popular Movies' : 'Top Rated TV Shows';
    }
}

let heroInterval = null;
function startHeroCarousel() {
    if (heroInterval) clearInterval(heroInterval);
    let currentIndex = 0;

    heroInterval = setInterval(() => {
        if (allMedia.length === 0) return;
        currentIndex = (currentIndex + 1) % allMedia.length;
        updateHero(allMedia[currentIndex]);
    }, 10000); // Rotate every 10s
}


function createPoster(item) {
    const container = document.createElement('div');
    container.className = 'poster-container';
    container.onclick = () => playMedia(item);
    container.onmouseover = () => updateHero(item);

    const img = document.createElement('img');
    img.className = 'poster';
    img.src = item.poster || 'assets/placeholder.png';
    img.onerror = () => { img.src = 'https://via.placeholder.com/200x300?text=' + encodeURIComponent(item.title) };

    container.appendChild(img);
    return container;
}

function updateHero(item) {
    if (!item) return;
    document.getElementById('hero-title').innerText = item.title;
    document.getElementById('hero-desc').innerText = item.overview || "No description.";

    const bg = document.getElementById('dynamic-bg');
    const backdrop = item.backdrop || item.poster;
    if (backdrop) bg.style.backgroundImage = `url('${backdrop}')`;

    document.getElementById('hero-play').onclick = () => playMedia(item);
}

// Provider Configuration
const PROVIDERS = [
    { name: "VidSrc.vip", url: "https://vidsrc.vip/embed", type: "direct" },
    { name: "SuperEmbed", url: "https://multiembed.mov", type: "params" },
    { name: "AutoEmbed", url: "https://player.autoembed.cc/embed", type: "direct" },
    { name: "SmashyStream", url: "https://player.smashy.stream", type: "tmdb_param" },
    { name: "VidLink", url: "https://vidlink.pro", type: "movie_path" }
];

async function playMedia(item) {
    pendingPlayItem = item;

    // Add to library automatically if clicked from Search
    fetch(`${API_URL}/library/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_id: item.tmdb_id, type: item.type, title: item.title })
    });

    const playerOverlay = document.getElementById('player-overlay');
    const videoPlayer = document.getElementById('video-player');
    const select = document.getElementById('provider-select');

    // Setup Provider Select
    if (select) {
        select.innerHTML = '';
        PROVIDERS.forEach((prov, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = prov.name;
            select.appendChild(option);
        });
    }

    // TV Controls Logic
    const tvControls = document.getElementById('tv-controls');
    if (item.type === 'tv') {
        tvControls.style.display = 'flex';
        await loadTVDetails(item.tmdb_id);
    } else {
        tvControls.style.display = 'none';
    }

    // Initialize Iframe
    let iframe = document.getElementById('iframe-player');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'iframe-player';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
        iframe.setAttribute("allowfullscreen", "true");
        iframe.setAttribute("webkitallowfullscreen", "true");
        iframe.setAttribute("mozallowfullscreen", "true");
        playerOverlay.appendChild(iframe);
        if (videoPlayer) videoPlayer.style.display = 'none';
    }

    playerOverlay.style.display = 'block';

    // Default to VidSrc.vip (Index 0) - Best for TV Shows
    select.value = 0;
    switchProvider(0);
}

async function loadTVDetails(tmdb_id) {
    const seasonSelect = document.getElementById('season-select');
    seasonSelect.innerHTML = '<option>Loading...</option>';

    try {
        const res = await fetch(`${API_URL}/tv/${tmdb_id}/details`);
        const data = await res.json();
        currentSeasonData = data; // Store for episode updates

        seasonSelect.innerHTML = '';
        if (data.seasons) {
            data.seasons.forEach(season => {
                if (season.season_number === 0) return; // Skip specials usually
                const opt = document.createElement('option');
                opt.value = season.season_number;
                opt.text = `Season ${season.season_number}`;
                opt.dataset.count = season.episode_count;
                seasonSelect.appendChild(opt);
            });
            updateEpisodeList(); // Populate episodes for Season 1
        }
    } catch (e) {
        console.error("Failed to load TV details", e);
        seasonSelect.innerHTML = '<option value="1">Season 1</option>';
        updateEpisodeList();
    }
}

function updateEpisodeList() {
    const seasonSelect = document.getElementById('season-select');
    const episodeSelect = document.getElementById('episode-select');
    const seasonNum = seasonSelect.value;

    // Find episode count from stored data or selected option dataset
    let count = 24; // Fallback
    const selectedOpt = seasonSelect.options[seasonSelect.selectedIndex];
    if (selectedOpt && selectedOpt.dataset.count) {
        count = parseInt(selectedOpt.dataset.count);
    }

    episodeSelect.innerHTML = '';
    for (let i = 1; i <= count; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.text = `Ep ${i}`;
        episodeSelect.appendChild(opt);
    }

    // Only refresh if player is already open (iframe exists)
    const iframe = document.getElementById('iframe-player');
    if (iframe && iframe.src) {
        const providerIdx = document.getElementById('provider-select').value;
        switchProvider(providerIdx);
    }
}

function switchEpisode() {
    const providerIdx = document.getElementById('provider-select').value;
    switchProvider(providerIdx);
}

function switchProvider(index) {
    const item = pendingPlayItem;
    const provider = PROVIDERS[index];
    const iframe = document.getElementById('iframe-player');

    if (!item || !provider) return;

    let src = "";

    // Get S/E if TV with robust fallbacks
    let s = 1, e = 1;
    if (item.type === 'tv') {
        const seasonSelect = document.getElementById('season-select');
        const episodeSelect = document.getElementById('episode-select');

        if (seasonSelect && seasonSelect.value) {
            s = parseInt(seasonSelect.value) || 1;
        }
        if (episodeSelect && episodeSelect.value) {
            e = parseInt(episodeSelect.value) || 1;
        }

        console.log(`TV Show: Season ${s}, Episode ${e}`);
    }

    if (provider.name.includes("SuperEmbed")) {
        if (item.type === 'movie') src = `${provider.url}/?video_id=${item.tmdb_id}&tmdb=1`;
        else src = `${provider.url}/?video_id=${item.tmdb_id}&tmdb=1&s=${s}&e=${e}`;
    } else if (provider.name.includes("Smashy")) {
        if (item.type === 'movie') src = `${provider.url}/movie/${item.tmdb_id}`;
        else src = `${provider.url}/tv/${item.tmdb_id}?s=${s}&e=${e}`;
    } else if (provider.name.includes("VidLink")) {
        if (item.type === 'movie') src = `${provider.url}/movie/${item.tmdb_id}`;
        else src = `${provider.url}/tv/${item.tmdb_id}/${s}/${e}`;
    } else {
        // Standard /embed/movie/ID format (VidSrc, AutoEmbed)
        if (item.type === 'movie') src = `${provider.url}/movie/${item.tmdb_id}`;
        else src = `${provider.url}/tv/${item.tmdb_id}/${s}/${e}`;
    }

    console.log(`Switching to ${provider.name}: ${src}`);
    iframe.src = src;
}

function toggleFullscreen() {
    const iframe = document.getElementById('iframe-player');
    if (!iframe) return;

    if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) { /* Safari */
        iframe.webkitRequestFullscreen();
    } else if (iframe.msRequestFullscreen) { /* IE11 */
        iframe.msRequestFullscreen();
    }
}

function closePlayer() {
    const playerOverlay = document.getElementById('player-overlay');
    const iframe = document.getElementById('iframe-player');
    if (iframe) {
        iframe.src = "";
        iframe.remove();
    }
    playerOverlay.style.display = 'none';
}

function refreshLibrary() {
    fetchMedia();
}

window.onload = fetchMedia;

// Profile Menu Toggle
function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    if (menu) menu.classList.toggle('show');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.profile-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        const menu = document.getElementById('profile-menu');
        if (menu) menu.classList.remove('show');
    }
});

// Media Filtering
function filterMedia(type) {
    currentFilter = type;

    if (type === 'all') {
        filteredMedia = [...allMedia];
    } else {
        filteredMedia = allMedia.filter(item => item.type === type);
    }

    renderRows();
}