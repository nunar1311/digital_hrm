type CardEntry = {
    id: string;
    title: string;
    content?: React.ReactNode;
    sidebarContent?: React.ReactNode;
};

const listeners = new Set<() => void>();
let cards: CardEntry[] = [];

function notify() {
    listeners.forEach((l) => l());
}

export const cardRegistry = {
    /**
     * Register a new card OR update an existing one.
     * Only notifies subscribers when a NEW card is added (structural change).
     * Content/sidebarContent updates are silent to prevent infinite loops.
     */
    register(entry: CardEntry) {
        const idx = cards.findIndex((c) => c.id === entry.id);
        if (idx === -1) {
            cards = [...cards, entry];
            notify(); // New entry → notify so provider picks up new card
        } else {
            // Update existing entry silently (no re-render loop)
            cards[idx] = entry;
        }
    },

    unregister(id: string) {
        cards = cards.filter((c) => c.id !== id);
        notify();
    },

    forceNotify() {
        notify();
    },

    getAll() {
        return cards;
    },

    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};
