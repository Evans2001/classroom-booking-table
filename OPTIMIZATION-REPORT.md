# Local optimization and release readiness

## Verified improvements

- Phone APK: 164,695,684-byte universal debug build replaced with a 27,257,587-byte ARM64 AOT profile build, an 83.4% size reduction. Installed successfully on Samsung SM-A057F. Android reported a successful cold activity launch in 3,704 ms; this is one local observation, not a benchmark guarantee.
- Calendar: four refresh requests reduced to one; bookings are queried for the selected campus-local month. Unchanged snapshots return an empty 304 response. Hidden tabs skip refresh requests.
- Database: initialization/migrations execute once per connection instead of on every access. Room listing no longer performs seed inserts. Added indexes for room conflicts, lecturer booking history, month queries, issue history, and sessions. WAL and a bounded busy timeout are enabled.
- Mobile: lazy room-list construction, connection reuse, timeout aborts, foreground/push refresh, expired-session handling, and correction of stale constant page reuse. A 500-row widget test verifies that fewer than 30 rows are built initially.
- Admin: explicit build root, security response headers, an isolated production-build directory, and a repeatable `npm run check` gate.

## Validation

Admin tests, TypeScript checks, lint, and the optimized Next.js production build passed. A separate production process served `/login` with HTTP 200 and returned HTTP 401 for the unauthenticated calendar endpoint; that test process was stopped. Flutter analysis and widget tests passed. USB forwarding was restored for the installed profile APK.

## Deployment boundary

This remains the authorized local-testing setup. Before public distribution, configure the HTTPS API endpoint, permanent Android application ID and matching Firebase configuration, a release-signing keystore, production admin secrets, SMTP, and a durable database backup/deployment process. Build a signed release APK or app bundle and perform end-to-end acceptance and load testing against that deployment. The current profile APK is for local performance testing, not store distribution.
