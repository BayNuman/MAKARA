# Security Policy — Makara Pro

## Reporting a Security Vulnerability

If you discover a security vulnerability within Makara Pro, please do **NOT** open a public issue. Instead, report it directly to the maintainers via security advisory or email.

---

## Security Model & Sandboxing

1. **Local Loopback Only (`127.0.0.1:8765`):** The embedded FastAPI sidecar process binds exclusively to `127.0.0.1` and is never exposed to external networks.
2. **CORS Validation:** Cross-Origin Resource Sharing is restricted strictly to local Tauri origin (`tauri://localhost`) and browser extensions (`chrome-extension://*`, `moz-extension://*`).
3. **Session Cookies Protection:** Local browser cookie imports are processed in read-only mode in memory and passed directly to local execution processes. No credentials or session tokens are logged to disk or sent to external endpoints.
