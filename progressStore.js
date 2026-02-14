// ==========================================
// 📊 Progress Store — localStorage persistence
// ==========================================
// State shape: { currentOrder, viewedIds, unlockedIds }

const progressStore = (() => {
    const STORAGE_KEY = "bizim-dunya-progress";

    const defaultState = () => ({
        currentOrder: 1,
        viewedIds: [],
        unlockedIds: [],
    });

    let state = defaultState();

    /** Load state from localStorage (or initialise) */
    function load(allLocations) {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                state = {
                    currentOrder: parsed.currentOrder ?? 1,
                    viewedIds: parsed.viewedIds ?? [],
                    unlockedIds: parsed.unlockedIds ?? [],
                };
            } else {
                state = defaultState();
            }
        } catch {
            state = defaultState();
        }

        // Ensure the first location is always unlocked
        if (allLocations && allLocations.length > 0) {
            const first = allLocations.find((l) => l.order === 1);
            if (first && !state.unlockedIds.includes(first.id)) {
                state.unlockedIds.push(first.id);
                save();
            }
        }

        return state;
    }

    /** Persist to localStorage */
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // Storage full or disabled — graceful degradation
        }
    }

    /** Mark a location as viewed */
    function markViewed(id) {
        if (!state.viewedIds.includes(id)) {
            state.viewedIds.push(id);
            save();
        }
    }

    /** Unlock the next location by order */
    function unlockNext(allLocations) {
        state.currentOrder++;
        const next = allLocations
            .sort((a, b) => a.order - b.order)
            .find((l) => l.order === state.currentOrder);
        if (next && !state.unlockedIds.includes(next.id)) {
            state.unlockedIds.push(next.id);
        }
        save();
        return next || null;
    }

    /** Check if a location is unlocked */
    function isUnlocked(id) {
        return state.unlockedIds.includes(id);
    }

    /** Check if a location has been viewed */
    function isViewed(id) {
        return state.viewedIds.includes(id);
    }

    /** Check if all locations have been viewed */
    function isAllViewed(allLocations) {
        return allLocations.every((l) => state.viewedIds.includes(l.id));
    }

    /** Get the current state (read‑only copy) */
    function getState() {
        return { ...state };
    }

    /** Reset all progress */
    function reset() {
        state = defaultState();
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore
        }
    }

    /** Unlock ALL remaining locations at once */
    function unlockAll(allLocations) {
        allLocations.forEach(l => {
            if (!state.unlockedIds.includes(l.id)) {
                state.unlockedIds.push(l.id);
            }
        });
        state.currentOrder = Math.max(...allLocations.map(l => l.order)) + 1;
        save();
    }

    return {
        load,
        save,
        markViewed,
        unlockNext,
        unlockAll,
        isUnlocked,
        isViewed,
        isAllViewed,
        getState,
        reset,
    };
})();
