import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'pokemon-team-builder-settings';

export type AppSettings = {
  assistantEnabled: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  assistantEnabled: true,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) as Partial<AppSettings> };
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, updateSettings };
}
