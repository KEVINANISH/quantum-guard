# Quantum Guard

Quantum Guard is a browser-based post-quantum cryptography readiness demo. It helps teams explore which cryptographic assets may be exposed to future quantum attacks, review migration targets, and try selected post-quantum cryptographic operations locally.

## The problem

Many deployed public-key algorithms—including RSA, elliptic-curve cryptography, and finite-field Diffie–Hellman—are vulnerable to a sufficiently capable quantum computer running Shor's algorithm. Data collected today may also be decrypted later (“harvest now, decrypt later”). Organizations need an inventory, a way to prioritize exposure, and a migration plan toward quantum-safe algorithms.

## Features

- **Landing page and overview dashboard:** readiness totals, risk summary, asset posture, and migration progress.
- **Asset discovery:** editable local demo inventory, filters, search, animated demo scan, CSV import, and CSV report export.
- **Vulnerability assessment:** deterministic local rules for classical and post-quantum algorithms, including a long-lived-data exposure flag.
- **Migration planner:** asset-role recommendations and local inventory state transitions.
- **Hybrid lab:** browser demonstration combining X25519 and ML-KEM-768 secrets through HKDF, then AES-GCM encryption; includes real ML-KEM, ML-DSA, AES-GCM and parameter-size self-tests.
- **Benchmarking:** browser-local timings for Noble post-quantum primitives and Web Crypto classical operations.
- **Certificates:** simulated PKI migration inventory and an ephemeral ML-DSA JSON-signing demonstration.
- **Local persistence:** asset inventory, migration state, scan history, certificate phase state, and last-scan time are stored in browser localStorage when available.

## Technology stack

- Vite
- React 19
- TypeScript
- Tailwind CSS 4 (configured; custom dashboard styles are in `src/App.css`)
- React Router
- Recharts
- Framer Motion
- `@noble/post-quantum`, `@noble/curves`, and `@noble/hashes`
- Browser Web Crypto API (`crypto.subtle`) for AES-GCM and classical browser benchmarks

## Run locally

Requirements: Node.js compatible with the installed Vite toolchain and npm.

```bash
npm install
npm run dev
```

Vite prints the local development URL. Other scripts: `npm run build`, `npm run lint`, and `npm run preview`.

## Architecture notes

This is a client-only SPA; it has no backend, database, user authentication, server-side scan service, or remote cryptographic service. `src/main.tsx` loads the application. `src/App.tsx` owns routing and shared in-memory React state. `src/data/assets.ts` defines the seed demo inventory, `src/lib/risk.ts` contains severity and recommendation rules, and `src/lib/crypto.ts` contains browser cryptographic demonstrations and benchmarks. `src/lib/persistence.ts` validates and reads/writes demo state in localStorage. Assets created or edited in Discovery flow through the shared state and are persisted locally. Browser storage may be unavailable or cleared, in which case persistence falls back to the seed/in-memory state.

## Real vs simulated

### Real local operations

- The lab calls Noble's ML-KEM-768 key generation, encapsulation, and decapsulation; its equality and wrong-key checks compare actual shared secrets.
- The self-test calls Noble ML-DSA-65 for signing and verification, including modified-message rejection, and compares implementation parameter lengths with the listed NIST FIPS standard parameter sizes.
- The self-test encrypts with Web Crypto AES-GCM and verifies that modified ciphertext is rejected.
- The hybrid lab performs actual X25519, ML-KEM-768, HKDF-SHA-256, and AES-GCM operations in the browser.
- Benchmarks execute browser-local cryptographic operations and measure elapsed time; results are hardware/browser/JIT dependent.
- Risk values are calculated by deterministic local rules, not fetched from an external threat-intelligence feed.

### Simulated / not production claims

- The enterprise inventory is sample/demo data. “Run scan” only iterates over the browser's local inventory; it does **not** scan TLS endpoints, certificates, networks, hosts, cloud accounts, or file systems.
- Migration changes only the local demo inventory; it does not alter deployed systems or key material.
- The certificate hierarchy and phases are simulated. The signing demonstration uses a fresh ephemeral ML-DSA key and JSON payload; it does not issue persistent CA-signed or browser-trusted X.509 certificates.
- The hybrid composition is an educational demo, not an authenticated, standardized key-exchange protocol. It is not suitable as a production protocol without a specified construction, transcript/context binding, peer authentication, and independent review.
- Use of algorithms associated with FIPS 203/204/205 and matching parameter sizes does **not** mean this app or its cryptographic module is FIPS validated. No FIPS 140 validation is claimed.

## Security and privacy

The demo stores inventory, migrations, scan history, and certificate status in the current browser's localStorage. The application has no backend and sends no inventory data to a server. This is not a security boundary: anyone with access to the browser profile can inspect or modify local data. Inputs are validated for the supported demo fields and algorithms. Do not enter secrets or production-sensitive information.

## Roadmap

- Real discovery agents for TLS endpoint and certificate scanning, with explicit authorization and scope.
- Backend database and role-based authentication for shared, durable enterprise inventory.
- Cryptographic Bill of Materials (CBOM) export.
- CI/CD integration for cryptographic policy checks and migration tracking.
