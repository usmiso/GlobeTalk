# Supply Chain Audit Report (Python)

Generated: 2025-09-30T11:30:39.622219Z

## Input (Compromised Packages)
- backslash (=0.2.1)
- chalk-template (=1.1.1)
- supports-hyperlinks (=4.1.1)
- has-ansi (=6.0.1)
- simple-swizzle (=0.2.3)
- color-string (=2.1.1)
- error-ex (=1.3.3)
- color-name (=2.0.1)
- is-arrayish (=0.3.3)
- slice-ansi (=7.1.1)
- color-convert (=3.1.1)
- wrap-ansi (=9.0.1)
- ansi-regex (=6.2.1)
- supports-color (=10.2.1)
- strip-ansi (=7.1.1)
- chalk (=5.6.1)
- debug (=4.4.2)
- ansi-styles (=6.2.2)
- @ctrl/tinycolor (=4.1.1 || =4.1.2)
- angulartics2 (=14.1.2)
- @ctrl/deluge (=7.2.2)
- @ctrl/golang-template (=1.4.3)
- @ctrl/magnet-link (=4.0.4)
- @ctrl/ngx-codemirror (=7.0.2)
- @ctrl/ngx-csv (=6.0.2)
- @ctrl/ngx-emoji-mart (=9.2.2)
- @ctrl/ngx-rightclick (=4.0.2)
- @ctrl/qbittorrent (=9.7.2)
- @ctrl/react-adsense (=2.0.2)
- @ctrl/shared-torrent (=6.3.2)
- @ctrl/torrent-file (=4.1.2)
- @ctrl/transmission (=7.3.1)
- @ctrl/ts-base32 (=4.0.2)
- encounter-playground (=0.0.5)
- json-rules-engine-simplified (=0.2.4 || =0.2.1)
- koa2-swagger-ui (=5.11.2 || =5.11.1)
- @nativescript-community/gesturehandler (=2.0.35)
- @nativescript-community/sentry (=4.6.43)
- @nativescript-community/text (=1.6.13)
- @nativescript-community/ui-collectionview (=6.0.6)
- @nativescript-community/ui-drawer (=0.1.30)
- @nativescript-community/ui-image (=4.5.6)
- @nativescript-community/ui-material-bottomsheet (=7.2.72)
- @nativescript-community/ui-material-core (=7.2.76)
- @nativescript-community/ui-material-core-tabs (=7.2.76)
- ngx-color (=10.0.2)
- ngx-toastr (=19.0.2)
- ngx-trend (=8.0.1)
- react-complaint-image (=0.0.35)
- react-jsonschema-form-conditionals (=0.3.21)
- react-jsonschema-form-extras (=1.0.4)
- rxnt-authentication (=0.0.6)
- rxnt-healthchecks-nestjs (=1.0.5)
- rxnt-kue (=1.0.7)
- swc-plugin-component-annotate (=1.9.2)
- ts-gaussian (=3.0.6)

## Findings
- No matches found in installed dependency graph.

## Recommendations
- Keep dependencies pinned and lockfile committed.
- Enable CI guardrails (see Measures below).

## Measures to avoid infection from upstream packages
- Pin exact versions; commit package-lock.json; use "npm ci".
- Enforce provenance/sig verification for npm publishes.
- Disable lifecycle scripts in CI: npm ci --ignore-scripts.
- Restrict registry to https://registry.npmjs.org/.
- Enable Dependabot/Snyk/Socket alerts.
- Use "overrides" to force safe transitive versions.

## Measures to avoid infection from source
- Code review and least-privilege on repo/CI tokens.
- Secret scanning and pre-commit hooks.
- Run dep scans on each PR.
- Sandbox builds; avoid prod secrets on dev machines.
- Verify integrity fields in lockfile.
