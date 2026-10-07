# Publishing @harmolody/ui

The public package name is `@harmolody/ui`; source is hosted at https://github.com/codibyte-co/harmolody-ui. npm and GitHub permissions are managed separately. The publishing npm account must have write access to the `@harmolody` scope.

The package keeps `UNLICENSED`, reserving rights rather than granting an open-source license. Repository links, declarations, partial Angular compilation, Tailwind theme exports, usage documentation, and an explicit package file list are included.

## Authenticate

```sh
npm login --registry https://registry.npmjs.org
npm whoami --registry https://registry.npmjs.org
```

Complete browser login or two-factor verification directly with npm when prompted. Do not commit npm tokens or credentials.

## Validate and preview a release

```sh
npm ci
npm run release:check
```

This runs unit tests, production builds, tarball generation, an independent consumer installation/build, and an npm publish dry run. It uploads nothing. For browser checks also run `npm run test:e2e`; install Chromium with `npx playwright install chromium`, or use `PLAYWRIGHT_CHANNEL=chrome` with installed Google Chrome.

## Publish

```sh
npm run publish:npm
```

The command validates first, then publishes only `dist/ui` with public access to https://registry.npmjs.org. The root workspace is private. npm may require two-factor/browser approval; complete the CLI prompt. Publishing a version is permanent: the same name/version cannot be published again.

## Next versions

```sh
npm version patch --prefix projects/ui --no-git-tag-version
# Update CHANGELOG.md, then validate and commit the source
npm run release:check
git add .
git commit -m "Release next version"
git push origin main
npm run publish:npm
```

Use minor/major increments intentionally for new features or breaking APIs. Choose a patch version higher than the registry version if a release already exists. The authoritative version is `projects/ui/package.json`; building copies it into `dist/ui`.

## Verify the published package

```sh
npm view @harmolody/ui version --registry https://registry.npmjs.org
npm install @harmolody/ui
```

Consumers must add the Tailwind theme import and source registration described in the README. The metadata links the npm package to GitHub; it does not configure GitHub Actions or automatic publishing. A future CI workflow can use npm trusted publishing after configuring the repository/workflow relationship on npm.

References: [scoped public publishing](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), [trusted publishing](https://docs.npmjs.com/trusted-publishers/).
