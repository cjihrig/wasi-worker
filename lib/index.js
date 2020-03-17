'use strict';
const { Worker } = require('worker_threads');


function createWasiWorker (options = {}) {
  const {
    args = [],
    env = {},
    preopens = {},
    resourceLimits,
    timeout,
    wasmFile
  } = options;

  if (!Array.isArray(args)) {
    throw new TypeError('args must be an array');
  }

  if (env === null || typeof env !== 'object') {
    throw new TypeError('env must be an object');
  }

  if (preopens === null || typeof preopens !== 'object') {
    throw new TypeError('preopens must be an object');
  }

  if (resourceLimits !== undefined &&
      (resourceLimits === null || typeof resourceLimits !== 'object')) {
    throw new TypeError('resourceLimits must be an object');
  }

  if (timeout !== undefined && typeof timeout !== 'number') {
    throw new TypeError('timeout must be a number');
  }

  if (typeof wasmFile !== 'string') {
    throw new TypeError('wasmFile must be a string');
  }

  const worker = new Worker(`
    const { setFlagsFromString } = require('v8');
    setFlagsFromString('--experimental-wasm-bigint');

    const { readFileSync } = require('fs');
    const { WASI } = require('wasi');
    const { workerData } = require('worker_threads');
    const { args, env, preopens, wasmFile } = workerData;
    const wasi = new WASI({ args, env, preopens, returnOnExit: true });
    const wasm = readFileSync(wasmFile);

    (async () => {
      const { instance } = await WebAssembly.instantiate(wasm, {
        wasi_snapshot_preview1: wasi.wasiImport
      });

      process.exitCode = wasi.start(instance);
    })();
  `, {
    eval: true,
    execArgv: ['--experimental-wasi-unstable-preview1', '--no-warnings'],
    workerData: { args, env, preopens, wasmFile },
    resourceLimits
  });

  if (typeof timeout === 'number') {
    setupTimeout(worker, timeout);
  }

  return worker;
}


function setupTimeout (worker, timeout) {
  const timer = setTimeout(() => {
    worker.terminate();
  }, timeout).unref();

  worker.once('exit', (code) => {
    clearTimeout(timer);
  });
}


module.exports = { createWasiWorker };
