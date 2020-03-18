'use strict';
const Assert = require('assert');
const Path = require('path');
const Lab = require('@hapi/lab');
const { createWasiWorker } = require('../lib');
const { describe, it } = exports.lab = Lab.script();
const fixturesDir = Path.join(__dirname, 'fixtures');

describe('wasi-worker', () => {
  it('validates input', () => {
    function check (options, err) {
      Assert.throws(() => {
        createWasiWorker(options);
      }, err);
    }

    check({ args: 'foo' });
    check({ env: null });
    check({ env: 'foo' });
    check({ preopens: null });
    check({ preopens: 'foo' });
    check({ resourceLimits: null });
    check({ resourceLimits: 'foo' });
    check({ timeout: 'foo' });
    check({ wasmFile: Infinity });
  });

  it('properly passes args', () => {
    const wasmFile = Path.join(fixturesDir, 'main_args.wasm');
    const worker = createWasiWorker({
      wasmFile,
      args: ['foo', '-bar', '--baz=value']
    });
    return new Promise((resolve) => {
      worker.on('exit', (code) => {
        Assert.strictEqual(code, 0);
        resolve();
      });
    });
  });

  it('properly maps preopens', () => {
    const wasmFile = Path.join(fixturesDir, 'read_file.wasm');
    const worker = createWasiWorker({
      wasmFile,
      preopens: { '/sandbox': fixturesDir }
    });
    return new Promise((resolve) => {
      worker.on('exit', (code) => {
        Assert.strictEqual(code, 0);
        resolve();
      });
    });
  });

  it('forwards the WASI exit code out of the worker', () => {
    const wasmFile = Path.join(fixturesDir, 'exitcode.wasm');
    const worker = createWasiWorker({ wasmFile });
    return new Promise((resolve) => {
      worker.on('exit', (code) => {
        Assert.strictEqual(code, 120);
        resolve();
      });
    });
  });

  it('handles timeouts that do not expire', () => {
    const wasmFile = Path.join(fixturesDir, 'exitcode.wasm');
    const worker = createWasiWorker({ wasmFile, timeout: 1000000 });
    return new Promise((resolve) => {
      worker.on('exit', (code) => {
        Assert.strictEqual(code, 120);
        resolve();
      });
    });
  });

  it('handles timeouts that expire', () => {
    const wasmFile = Path.join(fixturesDir, 'infinite_loop.wasm');
    const worker = createWasiWorker({
      wasmFile,
      timeout: 1000,
      preopens: { '/sandbox': fixturesDir }
    });
    return new Promise((resolve) => {
      worker.on('exit', (code) => {
        Assert.strictEqual(code, 1);
        resolve();
      });
    });
  });

  it('properly passes resourceLimits to Worker constructor', () => {
    const wasmFile = Path.join(fixturesDir, 'exitcode.wasm');
    const worker = createWasiWorker({
      wasmFile,
      resourceLimits: { maxOldGenerationSizeMb: 1 }
    });
    let sawError = false;

    return new Promise((resolve) => {
      worker.on('error', (err) => {
        Assert.strictEqual(err.code, 'ERR_WORKER_OUT_OF_MEMORY');
        sawError = true;
      });

      worker.on('exit', (code) => {
        Assert.strictEqual(code, 1);
        Assert.strictEqual(sawError, true);
        resolve();
      });
    });
  });
});
