import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3()],
  shortcuts: {
    'layout-container': 'mx-auto w-full max-w-[var(--container)] px-5 sm:px-8',
    'reading-container': 'mx-auto w-full max-w-[var(--reading-well)] px-5 sm:px-8',
    'btn-primary':
      'inline-flex items-center justify-center gap-2 rounded bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,110,44,0.18)] transition hover:bg-[var(--color-primary-bright)]',
    'btn-secondary':
      'inline-flex items-center justify-center gap-2 rounded border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
    'section-title':
      "font-['Newsreader',Georgia,serif] text-3xl font-semibold leading-tight text-[var(--color-ink)]",
    'meta-label': 'text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]',
    'surface-panel': 'rounded-lg bg-white shadow-[var(--shadow-paper)]',
  },
})
