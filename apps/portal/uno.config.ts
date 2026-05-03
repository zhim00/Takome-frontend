import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3()],
  shortcuts: {
    'site-header':
      'relative z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur-md sm:px-10 lg:px-12',
    'site-logo-link': 'flex items-center gap-3 transition-opacity duration-200 hover:opacity-75',
    'site-logo': 'h-9 w-auto',
    'site-nav': 'flex items-center gap-5 text-sm font-medium text-slate-500 sm:gap-8',
    'site-nav-link': 'transition-colors duration-200 hover:text-sky-500',
    'site-contact-menu': 'relative flex h-16 items-center',
    'site-contact-panel':
      'absolute left-1/2 top-full z-30 w-64 -translate-x-[34%] border border-slate-200 bg-white px-5 py-4 text-left shadow-[0_14px_28px_rgba(15,23,42,0.14)]',
    'site-contact-section': 'mb-4 last:mb-0',
    'site-contact-title': 'mb-2 text-xs font-medium text-slate-400',
    'site-contact-item': 'flex items-center gap-3 text-sm text-slate-800',
    'site-contact-link':
      'text-sm text-slate-800 transition-colors duration-200 hover:text-sky-500',
    'site-contact-icon': 'h-4 w-4 shrink-0 object-contain',
    'site-contact-value': 'min-w-0 truncate',
    'site-login-button':
      'rounded-xl border-2 border-slate-500 bg-white px-6 py-2.5 text-slate-800 shadow-[0_2px_6px_rgba(15,23,42,0.08),0_0_0_1px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-600 hover:shadow-md',

    'platform-page':
      'min-h-screen bg-white text-slate-800 [background-image:linear-gradient(rgba(148,163,184,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.13)_1px,transparent_1px)] [background-size:18px_18px]',
    'platform-layout':
      'grid min-h-[calc(100vh-4rem)] grid-cols-1 items-start gap-8 lg:grid-cols-[1.18fr_0.82fr]',
    'platform-art-section': 'min-w-0',
    'platform-art-frame':
      'relative aspect-[760/560] w-full max-w-[760px] overflow-hidden rounded-none bg-transparent lg:h-[560px] lg:max-w-none',
    'platform-art-image': 'absolute inset-0 h-full w-full object-cover object-left-top',
    'platform-info-section': 'relative min-h-[360px] overflow-hidden',
    'platform-info':
      'flex min-h-[calc(100vh-4rem)] flex-col justify-center px-6 py-10 sm:px-10 lg:items-end lg:pr-12 lg:text-right',
    'platform-subtitle': 'mb-2 text-sm font-semibold tracking-[0.08em] text-sky-500',
    'platform-title': 'text-5xl font-black leading-tight text-slate-800 sm:text-6xl lg:text-7xl',
    'platform-title-rule':
      'mt-3 h-px w-36 bg-gradient-to-r from-transparent via-sky-300 to-slate-400 lg:ml-auto',
    'platform-desc': 'mt-8 max-w-xl text-sm leading-8 text-slate-500 sm:text-base',
    'platform-socials':
      'mt-8 hidden flex-wrap gap-6 text-sm font-semibold text-slate-600 lg:justify-end',
    'platform-enter-button':
      'mt-10 inline-flex w-fit select-none items-center gap-4 rounded-[18px] bg-gradient-to-r from-sky-400 to-cyan-500 px-9 py-4 text-xl font-bold text-white caret-transparent shadow-[0_16px_30px_rgba(14,165,233,0.28)] outline-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(14,165,233,0.38)] focus:outline-none',
    'platform-enter-icon':
      'text-3xl leading-none transition-transform duration-300 group-hover:translate-x-1',

    'thumbnail-switcher':
      'flex items-center justify-center gap-3 overflow-x-auto pb-3 pt-2 outline-none',
    'thumbnail-switcher-offset': 'mt-1',
    'thumbnail-button':
      'h-14 w-14 shrink-0 select-none overflow-hidden rounded-lg border-2 border-white bg-white opacity-75 shadow-sm outline-none ring-1 ring-slate-200/80 caret-transparent transition-all duration-200 focus:outline-none',
    'thumbnail-button-active':
      'border-white opacity-100 ring-2 ring-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.95),0_4px_12px_rgba(59,130,246,0.35)]',
    'thumbnail-image': 'h-full w-full select-none object-cover',
  },
})
