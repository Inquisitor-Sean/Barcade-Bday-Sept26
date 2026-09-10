export const defaultPalette = {
  background: '#000000',
  surface: '#101114',
  text: '#f1f2f4',
  muted: '#c5c8ce',
  title: '#ffffff',
  accent: '#c6e7ff',
  dust: '#9ba8b8',
  rim: '#ffffff',
  glow: '#a4bed8',
  line: '#8393a5',
  button: '#bcd9ee',
  buttonText: '#f5f7fa',
  level: '#ffffff',
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