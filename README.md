# wasi-worker

[![Current Version](https://img.shields.io/npm/v/wasi-worker.svg)](https://www.npmjs.org/package/wasi-worker)
![Dependencies](http://img.shields.io/david/cjihrig/wasi-worker.svg)
[![belly-button-style](https://img.shields.io/badge/eslint-bellybutton-4B32C3.svg)](https://github.com/cjihrig/belly-button)

Run [WASI](https://nodejs.org/api/wasi.html) code inside of a Node.js
[`Worker`](https://nodejs.org/api/worker_threads.html).

**Note:** WASI as a technology is still experimental. The WASI APIs in Node.js
are also considered experimental and subject to change. For best results, use
this module with the most recent version of Node.js.

## Usage

The following example demonstrates how `wasi-worker` is used to create Node.js
`Worker` threads executing WASI nanoprocesses.

```javascript
'use strict';
const { createWasiWorker } = require('wasi-worker');
// worker is a Worker instance from the Node.js worker_threads module.
const worker = createWasiWorker({
  args: ['foo', '-bar', '--baz=value'],
  env: { ...process.env },
  preopens: { '/sandbox': '/tmp' },
  timeout: 10000,
  wasmFile: 'app.wasm'
});

worker.on('exit', (code) => {
  console.log('wasi worker exited with code:', code);
});
```

## API

This section describes the complete `wasi-worker` API.

### `createWasiWorker([options])`

  - Arguments
    - `options` (object) - Optional configuration object supporting the
    following schema:
      - `args` (array) - An array of strings that the WebAssembly application
      will see as command line arguments. Optional. Defaults to `[]`.
      - `env` (object) - An object similar to `process.env` that the WebAssembly
      application will see as its environment. Optional. Defaults to `{}`.
      - `preopens` (object) - This object represents the WebAssembly
      application's sandbox directory structure. The string keys of `preopens`
      are treated as directories within the sandbox. The corresponding values in
      `preopens` are the real paths to those directories on the host machine.
      Optional. Defaults to `{}`.
      - `resourceLimits` - (object) - An object representing the resource limits
      imposed on the worker thread. This object is passed verbatim to the
      `Worker` constructor. Optional. Defaults to `{}`.
      - `timeout` (number) - The maximum number of milliseconds that the
      WebAssembly may execute for. If the thread has not exited before the
      timeout has elapsed, the thread is terminated. Optional. Defaults to no
      timeout.
      - `wasmFile` (string) - The path to the `.wasm` file to load and execute.
  - Returns
    - An instance of a Node.js `Worker` thread.

Executes a WASI application inside a Node.js `Worker` thread. The returned
thread has exactly the same API as one created via Node's `Worker` constructor.
