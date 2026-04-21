"use client";

import { Palette } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { themes } from "@/lib/themes";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 w-64">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Theme</span>
        </div>
        <div className="space-y-1.5">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                theme === t.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <span
                className="h-4 w-4 rounded-full shrink-0 border border-border"
                style={{ backgroundColor: t.preview }}
              />
              <div>
                <div className="font-medium">{t.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
