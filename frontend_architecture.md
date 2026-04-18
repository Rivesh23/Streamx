# StreamX Frontend Architecture - Technical Deep-Dive

This document provides a highly detailed breakdown of the StreamX frontend implementation, ranging from high-level architecture to granular component logic.

---

## 1. Technology Stack & Design Philosophy

The frontend is built as a modern Single Page Application (SPA) with a focus on high-end aesthetics and fluid animations.

*   **Framework**: [React](https://reactjs.org/) (Version 18+) with [TypeScript](https://www.typescriptlang.org/).
*   **Build Tool**: [Vite](https://vitejs.dev/) for extremely fast development and optimized production bundles.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling, combined with custom CSS for "Liquid" glassmorphism effects.
*   **Animations**: [Framer Motion](https://www.framer.com/motion/) for cinematic page transitions and interactive micro-animations.
*   **Icons**: [Lucide React](https://lucide.dev/) for a clean, consistent UI iconography.

### Design Principles: "Liquid Cinematic Glass"
1.  **Glassmorphism**: Extensive use of `backdrop-blur-3xl` and semi-transparent backgrounds (`bg-white/5`).
2.  **Liquid Flow**: Smooth, high-inertia scrolling and transitions using `cubic-bezier(0.22, 1, 0.36, 1)`.
3.  **Visual Hierarchy**: Deep blacks (`bg-dark`) contrasting with vibrant brand accents and high-quality hero imagery.

---

## 2. Core Architecture & Routing

The application entry point is `main.tsx`, which renders the `App.tsx` component wrapped in a `BrowserRouter`.

### Animated Routing (`App.tsx`)
Routing is managed by `react-router-dom`. To achieve "cross-fade" transitions between pages, we use `AnimatePresence`.

```tsx
<AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Home />} />
        <Route path="/tv" element={<Home category="tv" />} />
        <Route path="/movies" element={<Home category="movie" />} />
        <Route path="/my-list" element={<Home category="list" />} />
    </Routes>
</AnimatePresence>
```
*   **Key Mechanic**: The `location.pathname` is passed as a `key` to the `Routes` component. This forces Framer Motion to treat every navigation as a new mounting/unmounting event, triggering the `initial` and `exit` animations defined in `Home.tsx` or `Profile.tsx`.

---

## 3. Data & Communication Layer (`api.ts`)

The application communicates with a backend REST API using [Axios](https://axios-http.com/).

### Request Interceptor & User Identification
Every request is automatically enriched with authentication and tracking headers:
*   **UUID Generation**: If no `user_id` exists in `localStorage`, a new UUID is generated and persisted.
*   **Interceptor**:
    ```javascript
    client.interceptors.request.use(config => {
        const token = localStorage.getItem('auth_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        config.headers['X-User-ID'] = getUserId();
        return config;
    });
    ```

### API Methods
The `api` object encapsulates all network logic:
*   **Media Discovery**: `getTrending()`, `getPopularMovies()`, `getTopTV()`.
*   **Personalization**: `getLibrary()`, `getFavorites()`, `getContinueWatching()`.
*   **Playback Progress**: `saveProgress()` and `getProgress()` for cross-device sync.
*   **Search**: Server-side faceted search via `search(query)`.

---

## 4. Component Breakdown

### Home.tsx (The Orchestrator)
The `Home` component serves as the primary view logic.
*   **Data Fetching**: Uses `Promise.all` to fetch multiple categories (Trending, Popular, TV, etc.) in parallel on mount.
*   **State Management**: Tracks search queries, modal visibility, and currently playing items.
*   **Conditional Rendering**: Dynamically switches between Grid layouts (for Search/Categories) and Row layouts (for the Dashboard).

### MoreInfoModal.tsx (Information Depth)
A high-end glassmorphic overlay for media details.
*   **Interactive Hooks**: Automatically checks if an item is a favorite when opened (`checkFavorite`).
*   **Spring Animations**: Uses a spring-based scale animation for a "popping" effect.
*   **Library Sync**: Allows users to add items to their library or toggle favorites instantly.

### VideoPlayer.tsx (The Experience)
A sophisticated wrapper for various embeddable video sources.
*   **Source Switching**: Supports multiple providers (VidKing, VidSrc, 2Embed, etc.) to ensure high availability.
*   **TV Context**: Implements logic to fetch season/episode details and allow seamless switching within the player UI.
*   **Progress Heartbeat**: 
    ```javascript
    const heartbeat = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        api.saveProgress(item.tmdb_id, elapsed, false, item.type, item.title);
    }, 15000);
    ```
    Every 15 seconds, the player notifies the backend of the session duration to keep the "Continue Watching" row updated.

### Row.tsx & Poster.tsx (Content Delivery)
*   **Row**: Implements smooth carousel behavior using `scrollRef` and `scrollBy` with a `smooth` behavior.
*   **Poster**: Handles hover-scale effects and provides quick-access metadata.

---

## 5. Global Styles & Utilities (`index.css`)

Beyond Tailwind defaults, custom layers provide the "premium" feel:
*   **`.liquid-blur`**: A reusable utility for triple-strength backdrop blurs with GPU acceleration.
*   **`.auth-input`**: Custom input styling for authentication forms with focus rings and smooth transitions.
*   **Scrollbar Hiding**: Custom CSS to hide scrollbars while maintaining functionality on carousels.

---

## 6. Key Features Implementation

*   **Continue Watching**: Powered by the "Heartbeat" logic in the Video Player. The items are filtered locally and displayed as the top row on the Home page.
*   **Search**: Implemented with a `useCallback` debounce logic (effectively triggered on input) that filters the entire TMDB library via the backend.
*   **Library Management**: Persistent "Your List" that syncs directly to the backend database via the `addToLibrary` API call.
