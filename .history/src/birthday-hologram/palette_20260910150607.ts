export const defaultPalette = {
  background: '#000000',
  surface: '#101923',
  text: '#edf7ff',
  muted: '#bbcfde',
  title: '#f0f9ff',
  accent: '#94dfff',
  dust: '#70adc9',
  rim: '#e0f5ff',
  glow: '#559dce',
  line: '#739db8',
  button: '#94dfff',
  buttonText: '#edf7ff',
  level: '#d4efff',
}

export type Palette = typeof defaultPalette
export type ColorKey = keyof Palette

export const colorKeys = Object.keys(defaultPalette) as ColorKey[]

export const contrastPalette: Palette = {
  ...defaultPalette,
  background: '#000000',
  surface: '#080808',
  text: '#ffffff',
  muted: '#eeeeee',
  title: '#ffffff',
  accent: '#ffffff',
  dust: '#cccccc',
  rim: '#ffffff',
  line: '#ffffff',
  button: '#ffffff',
  buttonText: '#000000',
  level: '#ffffff',
}

export function savedAppearance() {
  const defaults = {
    colors: { ...defaultPalette },
    reduced: false,
    contrast: false,
  }

  try {
    const saved = JSON.parse(
      localStorage.getItem('after-hours-lock-appearance') || '{}',
    )

    for (const key of colorKeys) {
      if (/^#[\da-f]{6}$/i.test(saved?.colors?.[key])) {
        defaults.colors[key] = saved.colors[key]
      }
    }

    defaults.reduced = saved?.reduced === true
    defaults.contrast = saved?.contrast === true
  } catch {
    return defaults
  }

  return defaults
}