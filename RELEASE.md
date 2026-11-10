# Preparing Satsuma 1.1.0

Version 1.1.0 adds optional constructor settings and requires Ctrl for wheel zoom by default. Publication requires explicit maintainer approval.

## Version convention

Always prefix GitHub version tags with `v` (for example, `v1.1.0`), even when a release request says `1.1.0` without the prefix. Use `1.1.0` in package.json and npm, and `Satsuma 1.1.0` as the GitHub release title.

## Validation

Use Node.js 22.13 or newer (Node 24 recommended):

```sh
npm ci
npm run lint
npm test
npm run build
git diff --exit-code -- dist
npm exec -- playwright install --with-deps chromium
npm run test:browser
npm pack --dry-run
```

Review generated changes in `demo/` and verify a second build makes no further changes.
Open `demo/index.html` directly and check the development demo with `npm start`.
Review the CommonJS migration notes in `CHANGELOG.md` and complete physical Android/Safari checks.
The moderate development-only minimatch advisory remains documented; do not force an incompatible override.

## Publication after approval

1. Review and commit the release changes, complete CI and merge the pull request.
2. Verify `npm whoami` identifies an account with write access to `satsuma` and that version `1.1.0` is still unused.
3. From the reviewed release commit, run `npm publish --dry-run` and inspect the package contents.
4. Only with explicit publication approval, run `npm publish --access public`, completing npm's authentication/2FA challenge if requested.
5. After publication succeeds, create and push the `v1.1.0` tag for that commit. The GitHub release workflow reruns validation and creates the release with notes from `CHANGELOG.md`, the package archive and the offline demo. It does not publish to npm.

Do not commit npm credentials or authentication tokens.
