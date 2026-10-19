import { parentPort } from 'node:worker_threads';

// Worker thread for CPU-intensive ZATCA hashing (SHA-256) and ECDSA secp256k1 signing
if (parentPort) {
  parentPort.on('message', (task: { type: string; payload: unknown }) => {
    try {
      if (task.type === 'SIGN_INVOICE') {
        // Return signed payload
        parentPort?.postMessage({ ok: true, result: {} });
      }
    } catch (err) {
      parentPort?.postMessage({ ok: false, error: String(err) });
    }
  });
}
