type CardEntry = {
    id: string;
    title: string;
    content: React.ReactNode;
};

const listeners = new Set<() => void>();
let cards: CardEntry[] = [];

function notify() {
    listeners.forEach((l) => l());
}

export const cardRegistry = {
    register(entry: CardEntry) {
        if (!cards.find((c) => c.id === entry.id)) {
            cards = [...cards, entry];
            notify();
        }
    },
    unregister(id: string) {
        cards = cards.filter((c) => c.id !== id);
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
