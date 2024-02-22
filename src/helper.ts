export function includesInsensitive(value1: string, value2: string) {
    return value1.toLowerCase().includes(value2.toLowerCase());
}

export async function closeWindow() {
    const currentPopup = await chrome.windows.getCurrent();
    await chrome.windows.remove(currentPopup.id!);
}