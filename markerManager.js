// ==========================================
// 📍 Marker Manager — render & unlock markers
// ==========================================

const markerManager = (() => {
    let map = null;
    let allLocations = [];
    let markers = {}; // id → L.marker
    let finaleMarkerRef = null;

    /**
     * Initialise: create markers only for unlocked locations
     */
    function init(leafletMap, locs) {
        map = leafletMap;
        allLocations = locs;

        locs.forEach((loc) => {
            if (progressStore.isUnlocked(loc.id)) {
                createMarker(loc, !progressStore.isViewed(loc.id));
            }
        });
    }

    /**
     * Create a single marker on the map
     * @param {boolean} animate - pop-in animation
     */
    function createMarker(loc, animate) {
        const isViewed = progressStore.isViewed(loc.id);
        const className = isViewed
            ? "memory-marker discovered"
            : "memory-marker undiscovered";
        const emoji = isViewed ? getDiscoveredEmoji(loc) : "❓";
        const extraClass = animate ? " marker-pop-in" : "";

        const marker = L.marker([loc.x, loc.y], {
            icon: L.divIcon({
                className: className + extraClass,
                html: `<span class="marker-inner">${emoji}</span>`,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
            }),
            interactive: false,
        }).addTo(map);

        marker.bindPopup(
            `<div class="popup-content"><h3>${loc.title}</h3>${loc.date ? `<div class="popup-date">📅 ${loc.date}</div>` : ""}</div>`,
            { closeButton: true, maxWidth: 200, autoPan: false }
        );
        marker._locData = loc;
        markers[loc.id] = marker;
        return marker;
    }

    /**
     * Unlock and show the next marker (with pop-in animation)
     */
    function unlockNextMarker(loc) {
        if (!loc || markers[loc.id]) return null;
        const marker = createMarker(loc, true);
        return marker;
    }

    /**
     * Mark a marker as discovered (change icon)
     */
    function markDiscovered(id) {
        const marker = markers[id];
        if (!marker) return;
        const loc = marker._locData;
        const emoji = getDiscoveredEmoji(loc);
        marker.setIcon(
            L.divIcon({
                className: "memory-marker discovered",
                html: `<span class="marker-inner">${emoji}</span>`,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
            })
        );
    }

    /**
     * Spawn the finale marker with sparkle animation
     */
    function spawnFinaleMarker(finaleLoc) {
        if (finaleMarkerRef) return finaleMarkerRef;
        const marker = L.marker([finaleLoc.x, finaleLoc.y], {
            icon: L.divIcon({
                className: "memory-marker finale-marker",
                html: '<span class="marker-inner finale-glow">✨</span>',
                iconSize: [44, 44],
                iconAnchor: [22, 22],
            }),
            interactive: false,
        }).addTo(map);
        marker._locData = finaleLoc;
        marker._isFinale = true;
        finaleMarkerRef = marker;
        return marker;
    }

    /**
     * Get all active markers (array)
     */
    function getMarkers() {
        return Object.values(markers);
    }

    /** Get the finale marker */
    function getFinaleMarker() {
        return finaleMarkerRef;
    }

    /** Remove all markers (for reset) */
    function removeAll() {
        Object.values(markers).forEach((m) => map.removeLayer(m));
        markers = {};
        if (finaleMarkerRef) {
            map.removeLayer(finaleMarkerRef);
            finaleMarkerRef = null;
        }
    }

    function getDiscoveredEmoji(loc) {
        const emojis = { 1: "📍", 2: "🌅", 3: "🎨", 4: "🎭", 5: "🏰" };
        return emojis[loc.order] || "💫";
    }

    return {
        init,
        unlockNextMarker,
        markDiscovered,
        spawnFinaleMarker,
        getMarkers,
        getFinaleMarker,
        removeAll,
    };
})();
