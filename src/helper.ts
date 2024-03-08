export function includesInsensitive(value1: string, value2: string): boolean {
    return value1.toLowerCase().includes(value2.toLowerCase());
}

export async function closeWindow() {
    const currentPopup = await chrome.windows.getCurrent();
    await chrome.windows.remove(currentPopup.id!);
}

export function toBoolean(value: string | null): boolean {
    if (!value) {
        return false;
    }

    if (value === 'true') {
        return true;
    }

    if (value === 'false') {
        return false;
    }

    return false;
}