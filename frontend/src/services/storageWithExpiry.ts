interface ExpiringData<T> {
    value: T;       // The stored value
    expiry: number; // Expiry duration in milliseconds.
}

export function setItem<T>(key: string, value: T, expiry: number): void {
    const now = new Date().getTime();
    const cacheItem: ExpiringData<T> = {
        value,
        expiry: now + expiry, // Set expiry time
    };

    try {
        localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (e) {
        console.error('Error setting item in localStorage', e);
    }
}

export function getItem<T>(key: string): T | null {
    try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null; // Return null if the item doesn't exist

        const item: ExpiringData<T> = JSON.parse(itemStr);
        const now = new Date().getTime();

        // Check if the item is expired
        if (now > item.expiry) {
            localStorage.removeItem(key);
            return null; // Return null if expired
        }

        return item.value; // Return the valid stored value
    } catch (e) {
        console.error('Error parsing item from localStorage', e);
        return null;
    }
}
