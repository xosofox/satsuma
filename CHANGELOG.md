# Changelog

## 1.1.0

- Add an optional third `options` argument to the Satsuma constructor.
- Default `scrollRequiresCtrlKey` to `true`, allowing normal page scrolling over the viewport unless Ctrl is held.
- Set `{scrollRequiresCtrlKey: false}` to retain immediate wheel zoom from 1.0.0.
- Touch panning and pinch zoom remain unchanged.

## 1.0.0

### Interaction fixes

- Keep zoom anchored at the pointer after previous panning and zooming.
- Support simultaneous two-finger zoom and pan, then continue with one finger without a jump.
- Handle zero coordinates, wheel units and zoom limits consistently.
- Use Pointer Events for mouse and touch, preserve button clicks, and suppress clicks after dragging.
- Remove listeners and restore inline styles with `destroy()`.

### Modules and demos

- Export native ES modules for bundlers and Symfony AssetMapper, with no runtime dependencies.
- Retain the classic browser API: `new Satsuma.Satsuma(container, content)`.
- Provide English development and offline demos with usage instructions.
- Replace Webpack, Babel and Jest with Vite, ESLint, native Node tests and Playwright.

### Migration from 0.0.1

- CommonJS `require()` is no longer supported. Use `import {Satsuma} from 'satsuma'`.
- The classic browser bundle remains at `dist/Satsuma.js`; it is an IIFE rather than UMD.
- Package exports expose only the root ESM entry. Copy the browser bundle directly for classic script use.
- Development and Node tooling require Node.js 22.13 or newer.
- Content must be a direct child of the viewport, without an existing transform or scaled/rotated ancestors.
- Zoom is limited to 0.1–8; panning is unbounded.

### Validation limitations

- Physical Android/Safari testing remains outstanding.
- The development toolchain has a known moderate minimatch advisory (GHSA-g3hv-75wg-m249), affecting three development packages. There are no runtime dependencies.
