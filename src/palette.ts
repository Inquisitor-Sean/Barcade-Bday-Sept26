export const defaultPalette = {
  background: '#050403',
  surface: '#17130e',
  text: '#f4ead8',
  muted: '#baac95',
  title: '#eee0c4',
  accent: '#d4b477',
  dust: '#a9844e',
  rim: '#ffedbd',
  glow: '#ad7945',
  line: '#69573d',
  button: '#ddc595',
  buttonText: '#18120a',
  level: '#e4c797',
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
      localStorage.getItem('after-hours-appearance') || '{}',
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
