import { defineConfig, presetWind3 } from 'unocss'

const loginControlFrame =
  'flex h-[var(--login-field-height)] items-center overflow-hidden rounded-[var(--login-field-radius)] border border-slate-200 bg-white shadow-[0_0_0_2px_rgba(203,213,225,0.4)] transition-all duration-200'
const loginControlActive =
  'hover:border-blue-600 hover:ring-2 hover:ring-blue-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-300'

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

    'login-dialog-layer':
      'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 py-6 backdrop-blur-[2px]',
    'login-dialog-shell': 'relative w-full max-w-[var(--login-dialog-width)]',
    'login-dialog':
      'relative w-full rounded-[var(--login-dialog-radius)] bg-white px-[var(--login-dialog-padding-x)] pb-[var(--login-dialog-padding-bottom)] pt-[var(--login-dialog-padding-top)] text-center shadow-[0_24px_70px_rgba(15,23,42,0.24)]',
    'login-dialog-close':
      'absolute right-[var(--login-close-right)] top-[var(--login-close-top)] flex h-[var(--login-close-size)] w-[var(--login-close-size)] items-center justify-center rounded-md border border-white/25 bg-white/10 text-3xl leading-none text-white shadow-[0_8px_20px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-colors duration-200 hover:bg-white/20',
    'login-dialog-logo':
      'mx-auto mb-[var(--login-logo-margin-bottom)] block w-[var(--login-logo-width)] translate-x-[var(--login-logo-offset-x)]',
    'login-dialog-tabs':
      'relative mx-auto grid w-fit grid-cols-[var(--login-tab-width)_var(--login-tab-width)] items-center gap-[var(--login-tab-gap)] text-[length:var(--login-tab-font-size)] font-medium',
    'login-dialog-tab':
      'relative flex w-[var(--login-tab-width)] items-center justify-center whitespace-nowrap pb-2.5 leading-none text-slate-400 transition-colors duration-200 hover:text-slate-900',
    'login-dialog-tab-active': 'font-bold text-slate-900',
    'login-tab-indicator':
      'pointer-events-none absolute bottom-0 left-[calc((var(--login-tab-width)-var(--login-tab-indicator-width))/2)] h-1 w-[var(--login-tab-indicator-width)] rounded-full bg-sky-400 transition-transform duration-300 ease-out',
    'login-tab-indicator-password':
      'translate-x-[calc(var(--login-tab-width)+var(--login-tab-gap))]',
    'login-form': 'mx-auto mt-8 max-w-[var(--login-form-width)] text-left',
    'login-field': 'mb-3.5 block',
    'login-control-input':
      'h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[length:var(--login-input-font-size)] text-slate-900 outline-none placeholder:text-slate-400',
    'login-text-control': `${loginControlFrame} ${loginControlActive}`,
    'login-phone-control': `${loginControlFrame} ${loginControlActive}`,
    'login-country-code':
      'border-r border-slate-200 px-3 text-[length:var(--login-input-font-size)] text-slate-900',
    'login-code-control': `${loginControlFrame} ${loginControlActive}`,
    'login-code-button':
      'h-full shrink-0 border-l border-slate-200 px-3 text-[length:var(--login-input-font-size)] text-sky-500 transition-colors duration-200 hover:text-sky-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:text-slate-300',
    'login-error': 'mt-2 block text-xs text-red-500',
    'login-tip': 'mb-8 mt-1 text-xs leading-5 text-slate-400',
    'login-submit-button':
      'flex h-[var(--login-field-height)] w-full items-center justify-center rounded-[var(--login-field-radius)] bg-slate-100 text-[length:var(--login-button-font-size)] font-semibold text-slate-400 transition-all duration-200 disabled:cursor-not-allowed',
    'login-submit-button-active':
      'bg-sky-500 text-white shadow-[0_12px_22px_rgba(14,165,233,0.24)] hover:bg-sky-600',
    'login-help-link':
      'mt-7 inline-block text-sm font-medium text-sky-500 transition-colors duration-200 hover:text-sky-600',
    'login-link-row': 'mb-7 mt-1 flex items-center justify-between',

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
    'platform-enter-button-disabled':
      'cursor-not-allowed bg-none bg-slate-300 text-slate-500 shadow-none hover:translate-y-0 hover:shadow-none',
    'platform-enter-icon':
      'text-3xl leading-none transition-transform duration-300 group-hover:translate-x-1',

    'platform-placeholder-page':
      'flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-slate-800',
    'platform-placeholder-title': 'text-4xl font-black sm:text-5xl',
    'platform-placeholder-desc': 'mt-4 text-base text-slate-500',

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
