# Validation

```sh
npm ci
npm run build:lib
npm test
npm run build:example
npm run pack
npm run check:package
npx playwright install chromium
npm run test:e2e
```

Library unit tests cover existing form controls, array initialization, config additions, options loading, choice presentations, actions, custom table cells, and row reordering. Additional extraction tests cover application adapters, conditional validation, submission locking, and disabled fields. The showcase unit test consumes `dist/ui` through `@harmolody/ui`; build the library first.

Browser tests exercise actual invalid and valid submissions, keyboard sorting, page changes, selection, row actions, themes, responsive layout, and computed Tailwind grid styles.

`scripts/check-package.mjs` creates a temporary consumer workspace outside this repository, installs the tarball using its own `node_modules`, and compiles an Angular app with Tailwind scanning the **installed npm package**. This catches exports, template compilation, peers, and theme/source packaging errors that workspace aliases can hide. The temporary consumer is retained and its path printed for inspection.

The package checker runs an installation and production build; it requires registry access and a supported Node version. It does not publish. Browser checks use Playwright Chromium; install it once with the command above. No backend credentials are needed.

On a machine with Google Chrome installed, you can skip the Playwright Chromium download and use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. The default uses Playwright's downloaded Chromium. In restrictive macOS sandboxes, Angular's native Tailwind compilation and headless browser launch may require running these checks in a normal terminal.
