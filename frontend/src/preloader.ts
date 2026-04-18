export const preloadMap = new Map<number, HTMLIFrameElement>();

export function getStreamUrl(tmdb_id: number, type: string) {
    return type === 'movie' 
        ? `https://www.2embed.cc/embed/${tmdb_id}`
        : `https://www.2embed.cc/embedtv/${tmdb_id}&s=1&e=1`;
}

export function preloadMovie(tmdb_id: number, type: string) {
    if (preloadMap.has(tmdb_id)) return;
    if (preloadMap.size > 3) {
        // Prevent destroying RAM - clear the oldest preload
        const firstKey = preloadMap.keys().next().value;
        if (firstKey !== undefined) {
            const oldIframe = preloadMap.get(firstKey);
            if (oldIframe && oldIframe.parentNode) {
                oldIframe.parentNode.removeChild(oldIframe);
            }
            preloadMap.delete(firstKey);
        }
    }

    const iframe = document.createElement("iframe");
    iframe.src = getStreamUrl(tmdb_id, type);
    iframe.style.display = "none";
    iframe.allowFullscreen = true;
    
    // Add to body to start loading silently
    document.body.appendChild(iframe);
    preloadMap.set(tmdb_id, iframe);
}
