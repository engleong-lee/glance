import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type CopyBehavior = 'copyOnly' | 'copyAndClose';

export interface Settings {
    // Appearance
    theme: Theme;

    // Behavior
    rowLimit: number;
    copyBehavior: CopyBehavior;
    autoRefreshSchema: boolean;

    // Hotkey
    hotkey: string;

    // Groups
    groupsFilePath: string;
}

interface SettingsState extends Settings {
    // Actions
    setTheme: (theme: Theme) => void;
    setRowLimit: (limit: number) => void;
    setCopyBehavior: (behavior: CopyBehavior) => void;
    setAutoRefreshSchema: (enabled: boolean) => void;
    setHotkey: (hotkey: string) => void;
    setGroupsFilePath: (path: string) => void;
    resetToDefaults: () => void;
}

const defaultSettings: Settings = {
    theme: 'system',
    rowLimit: 100,
    copyBehavior: 'copyAndClose',
    autoRefreshSchema: false,
    hotkey: 'CommandOrControl+Shift+Space',
    groupsFilePath: '',
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...defaultSettings,

            setTheme: (theme) => {
                set({ theme });
                applyTheme(theme);
            },

            setRowLimit: (rowLimit) => set({ rowLimit }),

            setCopyBehavior: (copyBehavior) => set({ copyBehavior }),

            setAutoRefreshSchema: (autoRefreshSchema) => set({ autoRefreshSchema }),

            setHotkey: (hotkey) => set({ hotkey }),

            setGroupsFilePath: (groupsFilePath) => set({ groupsFilePath }),

            resetToDefaults: () => {
                set(defaultSettings);
                applyTheme(defaultSettings.theme);
            },
        }),
        {
            name: 'glance-settings',
            onRehydrateStorage: () => (state) => {
                // Apply theme on app load
                if (state?.theme) {
                    applyTheme(state.theme);
                }
            },
        }
    )
);

// Apply theme to document
function applyTheme(theme: Theme) {
    const root = document.documentElement;

    if (theme === 'system') {
        // Remove manual theme, let system preference take over
        root.classList.remove('light', 'dark');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const state = useSettingsStore.getState();
        if (state.theme === 'system') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(e.matches ? 'dark' : 'light');
        }
    });
}
