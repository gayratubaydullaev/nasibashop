import * as net from 'node:net';
import Redis from 'ioredis';

function parseHostPort(addr: string): { host: string; port: number } {
  const idx = addr.lastIndexOf(':');
  if (idx <= 0) {
    throw new Error(`invalid address: ${addr}`);
  }
  const host = addr.slice(0, idx).replace(/^\[|\]$/g, '');
  const port = Number(addr.slice(idx + 1));
  if (!Number.isFinite(port) || port < 1) {
    throw new Error(`invalid port in: ${addr}`);
  }
  return { host, port };
}

/** TCP к хотя бы одному брокеру из CSV; пустая строка — без проверки. */
export function pingKafkaTCP(brokersCsv: string, timeoutMs = 2000): Promise<void> {
  const addrs = brokersCsv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (addrs.length === 0) {
    return Promise.resolve();
  }
  return tryBrokers(addrs, 0, timeoutMs);
}

function tryBrokers(addrs: string[], i: number, timeoutMs: number): Promise<void> {
  if (i >= addrs.length) {
    return Promise.reject(new Error('no kafka broker accepted TCP connection'));
  }
  let host: string;
  let port: number;
  try {
    ({ host, port } = parseHostPort(addrs[i]));
  } catch {
    return tryBrokers(addrs, i + 1, timeoutMs);
  }
  return tcpConnect(host, port, timeoutMs).catch(() => tryBrokers(addrs, i + 1, timeoutMs));
}

function tcpConnect(host: string, port: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`tcp timeout ${host}:${port}`));
    }, timeoutMs);
    socket.once('connect', () => {
      clearTimeout(timer);
      socket.destroy();
      resolve();
    });
    socket.once('error', (err) => {
      clearTimeout(timer);
      socket.destroy();
      reject(err);
    });
  });
}

export async function pingRedis(host: string, port: number): Promise<void> {
  const r = new Redis({
    host,
    port,
    connectTimeout: 2000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  try {
    await r.ping();
  } finally {
    r.disconnect();
  }
}
