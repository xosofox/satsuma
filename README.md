# Satsuma

Satsuma is "the zoomer" said with a German accent—you can make web objects zoom, pan, drag and pinch...

Dependency-free pan and pinch zoom for HTML, images and SVG inside a viewport.

## Try it

Open **`demo/index.html` directly in your browser**. This generated, self-contained
file works offline and with `file://`; it includes a map, clickable marker, reset
button, gesture checklist and usage instructions below the example.

For development (Node.js 22.13+):

```sh
npm ci
npm start             # http://localhost:9123; --host exposes it to your LAN
npm run build         # rebuild dist/ and the offline demo
npm run preview       # built offline demo at http://localhost:9124
```

On a phone, open the development server at your computer's LAN IP on port 9123
(on a trusted network). Native ES modules need HTTP; use the generated offline
page when opening a file directly. All demo visuals use local HTML/CSS.

## Native ES modules

Copy `dist/satsuma.js` into your application and import it:

```html
<div id="viewport" style="width: 100%; height: 400px">
    <div id="content" style="width: 1200px; height: 800px">Your content</div>
</div>
<script type="module">
    import {Satsuma} from './satsuma.js';
    const viewer = new Satsuma(
        document.querySelector('#viewport'),
        document.querySelector('#content'),
    );
    // Call viewer.destroy() when removing it.
</script>
```

The sources in `src/` also work as native ES modules with explicit `.js` imports.
The package root exports `{Satsuma}` as ESM for bundlers/Node-aware tooling.
The historical `dist/Satsuma.js` path remains available as a classic browser
script, exposing `new Satsuma.Satsuma(container, content)`. It is now IIFE rather
than UMD: CommonJS `require()` is no longer supported.

## Options

The optional third constructor argument is an options object:

```js
const viewer = new Satsuma(container, content, {
    scrollRequiresCtrlKey: false,
});
```

`scrollRequiresCtrlKey` defaults to `true`: hold Ctrl while scrolling to zoom.
Without Ctrl, wheel events retain normal page scrolling. Set it to `false` to
zoom immediately with the wheel, as in 1.0.0. This option does not affect touch
panning or pinch zoom.

## Symfony AssetMapper

In an existing AssetMapper application, copy `dist/satsuma.js` to
`assets/lib/satsuma.js`, then:

```js
// assets/app.js
import {Satsuma} from './lib/satsuma.js';

const container = document.querySelector('#viewport');
if (container) {
    const viewer = new Satsuma(container, container.querySelector('#content'));
    // Store viewer if the element will be removed dynamically.
}
```

Load the entrypoint with `{{ importmap('app') }}` in your base Twig template.
AssetMapper handles versioned URLs; the consuming Symfony application needs no
Node/npm build. Alternatively map the source directory and import `Satsuma.js`
with its sibling `Translator.js` present.

With Stimulus, create the viewer in `connect()` and call `this.viewer.destroy()`
in `disconnect()` (important with Turbo). This repository does not publish an npm
release as part of building or opening a PR; an `importmap:require` package install
requires a separately published package under a verified available name.

## Interaction and constraints

- Primary mouse button / one finger: pan.
- Ctrl + mouse wheel / trackpad wheel gestures: zoom at the pointer.
- Two fingers: zoom and pan at their moving midpoint.
- Lift one finger: continue panning without a jump.
- Buttons/links remain clickable; drags suppress their click.
- Scale range: 0.1–8. Panning is unbounded.
- `destroy()` removes listeners and restores the original inline styles.

`content` must be a direct child of `container`. Give the viewport an explicit
height and the content its unscaled size. Satsuma owns the content's CSS transform
and transform origin. Existing content transforms and scaled/rotated ancestors
are unsupported. Current browsers with Pointer Events and ES2022 syntax are the
target; native page touch scrolling/zoom is disabled inside the viewport only.

## Tools and validation

Only three direct development dependencies: Vite, ESLint and Playwright.
No runtime dependencies, Babel, Webpack or Jest.

```sh
npm run lint          # checks only; does not rewrite files during build
npm test              # native Node test runner
npm run test:watch
npm run build
npx playwright install chromium
npm run test:browser   # offline demo, native ESM, mouse and real two-touch events
npm pack --dry-run
```

For an existing Chromium binary, set `CHROMIUM_EXECUTABLE_PATH`.
CI runs lint, tests, a reproducible build check, Chromium integration tests and a
package manifest check. It uploads the standalone demo as a workflow artifact.
Generated files in `dist/` and `demo/` are committed so a checkout is immediately
usable. Rebuild and commit them after source changes.

Chromium's touch input is exercised via CDP. Physical-device Android/Safari testing
is still needed before relying on the library in production.

### Dependency audit

The modern toolchain removes all previously reported high/critical findings.
ESLint 10 currently brings one known moderate minimatch advisory
(GHSA-g3hv-75wg-m249), reported against three development packages. It concerns
pathological glob patterns; there are no runtime dependencies. ESLint 9 is already
unsupported, so the maintained major is retained without forcing an incompatible
transitive major override. Re-evaluate on the next ESLint/config-array update.
