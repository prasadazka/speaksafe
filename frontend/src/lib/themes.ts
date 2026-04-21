export type ThemeId = "arctic" | "midnight" | "ember" | "violet" | "forest";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  preview: string; // hex color for preview swatch
}

export const themes: ThemeConfig[] = [
  {
    id: "arctic",
    name: "Arctic Blue",
    description: "Corporate trust — clean, enterprise-grade",
    preview: "#3b5bdb",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark mode — security-focused, emerald accents",
    preview: "#34d399",
  },
  {
    id: "ember",
    name: "Ember",
    description: "Warm amber — approachable and human",
    preview: "#d97706",
  },
  {
    id: "violet",
    name: "Violet Edge",
    description: "Purple/indigo — modern tech startup feel",
    preview: "#8b5cf6",
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep teal — calm and natural trust",
    preview: "#0d9488",
  },
];
