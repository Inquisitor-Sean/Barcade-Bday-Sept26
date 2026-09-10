export const defaultPalette = {
  background: '#14100d',
  surface: '#211a14',
  text: '#f4ead8',
  muted: '#c3b7a6',
  title: '#f3e9d7',
  accent: '#ffad59',
  dust: '#a8845c',
  rim: '#d8f1ff',
  glow: '#b86c35',
  line: '#b68b60',
  button: '#dcb788',
  buttonText: '#f4ead8',
  level: '#efc895',
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
  accent: '#ffe1a6',
  line: '#ddd1b9',
  button: '#fff1d4',
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
    for (const key of colorKeys)
      if (/^#[\da-f]{6}$/i.test(saved?.colors?.[key]))
        defaults.colors[key] = saved.colors[key]
    defaults.reduced = saved?.reduced === true
    defaults.contrast = saved?.contrast === true
  } catch {
    return defaults
  }
  return defaults
}
