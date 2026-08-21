import path from 'node:path'

/**
 * Directory layout after the electron-vite build.
 *
 * ├─┬ out
 * │ ├─┬ main
 * │ │ └── index.cjs
 * │ ├─┬ preload
 * │ │ └── index.cjs
 * │ └─┬ renderer
 * │   └── index.html
 *
 * This module must be the first thing the main process imports: it seeds
 * `process.env.APP_ROOT` and `VITE_PUBLIC`, which later modules read.
 */

process.env.APP_ROOT = path.join(__dirname, '../..')

export const VITE_DEV_SERVER_URL = process.env['ELECTRON_RENDERER_URL'] || process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(__dirname)
export const RENDERER_DIST = path.join(__dirname, '../renderer')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

/** Root of the packaged/unpackaged app, used to locate bundled extensions. */
export const APP_ROOT = process.env.APP_ROOT
