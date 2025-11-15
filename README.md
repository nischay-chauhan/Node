# PureNode

A "pure Node.js" learning and showcase project written in TypeScript. It demonstrates practical usage of core Node modules (fs, buffer, child_process), with tests using Node's built-in test runner—no external testing framework.

## Why this project
- Learn and teach core Node.js without framework noise.
- Clean, testable examples using only Node standard library + TypeScript.
- Resume-ready foundation to showcase systems/code quality skills.

## Tech stack
- Node.js 18+ (20+ recommended)
- TypeScript (CommonJS target)
- Node built-in test runner (`node --test`)
- Nodemon for local watch

## Quick start
```bash
# install deps
npm install

# build TypeScript to dist/
npm run build

# run (expects dist/index.js if you add an entrypoint)
npm start

# run tests (compiles then executes node --test)
npm test

# watch tests
npm run test:watch
```

## Scripts
- `build` — compile TS to `dist`
- `start` — `tsc && node dist/index.js` (add `src/index.ts` to use this)
- `dev` — watch TS and run the compiled entry
- `test` — compile then run Node's test runner on `dist/tests/**/*.test.js`
- `test:watch` — watch src and tests, then re-run

## Project structure
```
src/
  modules/
    buffer/
    child_process/
    fs/
      streamFs.ts

tests/
  fs/
    streamFs.test.ts

dist/                # build output (generated)
```

## Testing approach
- Uses `node:test` and `node:assert/strict`.
- TypeScript sources (including tests) compile to `dist/` and tests run from there.
- See `tests/fs/streamFs.test.ts` for an example verifying streaming read/write.

## Extend this project (resume-level roadmap)
- Phase 1: Core modules and quality
  - Add Promise-based APIs alongside current console-driven demos.
  - Improve error handling and typed results (Result/Either style or exceptions with codes).
  - Add more modules: `http`, `stream`, `crypto`, `zlib`, `worker_threads`.
  - Add examples/CLIs for each module demonstrating real scenarios.
  - Add code comments explaining tradeoffs and internals (no frameworks).
  - Add coverage (c8) and CI (GitHub Actions: Node 18/20 matrix).

- Phase 2: Tooling and docs
  - Add README sections per module with copy-pastable examples.
  - Optional: generate API docs (Typedoc) and publish to GitHub Pages.
  - Add CONTRIBUTING and simple issue templates.

- Phase 3: Showcase demos
  - Build a small CLI toolkit demonstrating:
    - File streaming and backpressure
    - Child process orchestration
    - Simple HTTP server with streaming responses
  - Provide performance notes and benchmarks where useful.

## Example learning paths
- Streams: read large files line-by-line; implement transform streams (uppercase, CSV parse).
- Child processes: spawn, exec, IPC; build a mini parallel worker.
- HTTP: range requests, piping streams, gzip compression.

## Contributing (for future)
- PRs should include tests and docs updates.
- Keep code purely Node stdlib + TS unless there is a strong reason otherwise.

## Requirements
- Node.js 18+ (20+ recommended)
- npm 8+

