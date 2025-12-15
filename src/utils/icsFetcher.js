// src/utils/icsFetcher.js
const fetch = require('node-fetch');

const LOCAL_IP_PATTERNS = [
  /^localhost/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^::1$/,
  /^0\.0\.0\.0$/
];

function isLocalAddress(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    return LOCAL_IP_PATTERNS.some(re => re.test(host));
  } catch {
    return true;
  }
}

async function fetchCalendarICS(url) {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('URL must start with http:// or https://');
  }
  if (isLocalAddress(url)) {
    throw new Error('Refusing to fetch from local address');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (!res.ok) throw new Error('Failed to fetch ICS: ' + res.status);
    const text = await res.text();
    return text;
  } catch (err) {
    throw new Error('Failed to fetch ICS: ' + err.message);
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchCalendarICS };