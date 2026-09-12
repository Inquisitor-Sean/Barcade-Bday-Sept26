export const defaultPalette = {
  background: "#000000",
  surface: "#071611",
  text: "#eefaf6",
  muted: "#b4cbc4",
  title: "#f0fff9",
  accent: "#62f5d5",
  dust: "#9ba8b8",
  rim: "#ffffff",
  glow: "#a4bed8",
  line: "#345e52",
  button: "#62f5d5",
  buttonText: "#03251c",
  level: "#ffffff",
  cyan: "#96dfff",
  violet: "#c7b1ff",
  amber: "#ffdb9b",
};

export type Palette = typeof defaultPalette;
export type ColorKey = keyof Palette;
export const colorKeys = Object.keys(defaultPalette) as ColorKey[];

export const contrastPalette: Palette = {
  ...defaultPalette,
  background: "#000000",
  surface: "#000000",
  text: "#ffffff",
  muted: "#eeeeee",
  title: "#ffffff",
  accent: "#ffffff",
  dust: "#cccccc",
  rim: "#ffffff",
  glow: "#ffffff",
  line: "#ffffff",
  button: "#ffffff",
  buttonText: "#000000",
  level: "#ffffff",
  cyan: "#ffffff",
  violet: "#ffffff",
  amber: "#ffffff",
};

export function savedAppearance() {
  const defaults = {
    colors: { ...defaultPalette },
    reduced: false,
    contrast: false,
  };

  try {
    const saved = JSON.parse(
      localStorage.getItem("after-hours-lock-appearance") || "{}",
    );
    for (const key of colorKeys) {
      const value = saved?.colors?.[key];
      if (typeof value === "string" && /^#[\da-f]{6}$/i.test(value)) {
        defaults.colors[key] = value;
      }
    }
    defaults.reduced = saved?.reduced === true;
    defaults.contrast = saved?.contrast === true;
  } catch {
    return defaults;
  }

  return defaults;
}
