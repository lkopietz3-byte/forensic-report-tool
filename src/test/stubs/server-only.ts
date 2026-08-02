// Test stub for the `server-only` package, which throws if imported outside an
// RSC/server context. Aliased in vitest.config so server route modules can be
// imported and exercised in the node test runner. (Production builds still use
// the real package, so the server/client boundary is enforced where it matters.)
export {};
