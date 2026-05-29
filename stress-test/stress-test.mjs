#!/usr/bin/env node
/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║         Core Media API — Comprehensive Stress Test            ║
 * ╠════════════════════════════════════════════════════════════════╣
 * ║  Tests all API endpoints for:                                 ║
 * ║   • Response time (p50, p95, p99, avg, min, max)              ║
 * ║   • Throttle detection (HTTP 429 Too Many Requests)           ║
 * ║   • Error rates under concurrent load                         ║
 * ║   • Connection stability                                      ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const API_PREFIX = '/api/v1';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '20', 10);
const REQUESTS_PER_ENDPOINT = parseInt(process.env.REQUESTS || '120', 10);
const THROTTLE_BURST_COUNT = parseInt(process.env.THROTTLE_BURST || '150', 10);

// ── Auth Token (obtained during test) ───────────────────────────────────────
let adminToken = '';

// ── Endpoint Definitions ────────────────────────────────────────────────────
const ENDPOINT_GROUPS = [
  {
    group: 'System / Health',
    endpoints: [
      { method: 'GET', path: '/health', auth: false, label: 'Health Check' },
      { method: 'GET', path: '/test-connection', auth: false, label: 'Test Connection', prefix: '/api' },
    ],
  },
  {
    group: 'Auth',
    endpoints: [
      { method: 'POST', path: '/admin/auth/login', auth: false, label: 'Login', body: { email: 'superadmin@gmail.com', password: 'admin@123' } },
      { method: 'POST', path: '/admin/auth/signup', auth: false, label: 'Signup (expected 409/400)', body: { name: 'StressTest User', email: `stress_${Date.now()}@test.com`, password: 'Test@123456' } },
      { method: 'POST', path: '/admin/auth/forgot-password', auth: false, label: 'Forgot Password', body: { email: 'nonexistent@test.com' } },
      { method: 'POST', path: '/admin/auth/refresh', auth: false, label: 'Refresh Token (invalid)', body: { refreshToken: 'invalid-token' } },
      { method: 'GET', path: '/admin/auth/me', auth: true, label: 'Get Current User' },
    ],
  },
  {
    group: 'Admin | System Users',
    endpoints: [
      { method: 'GET', path: '/admin/system-users', auth: true, label: 'List System Users' },
    ],
  },
  {
    group: 'Admin | Roles',
    endpoints: [
      { method: 'GET', path: '/admin/roles', auth: true, label: 'List Roles' },
    ],
  },
  {
    group: 'Admin | Sidebar Menus',
    endpoints: [
      { method: 'GET', path: '/admin/sidebar-menu', auth: true, label: 'Get User Sidebar Menus' },
      { method: 'GET', path: '/admin/sidebar-menu/all', auth: true, label: 'Get All Sidebar Menus' },
    ],
  },
  {
    group: 'Admin | Websites',
    endpoints: [
      { method: 'GET', path: '/admin/websites', auth: true, label: 'List Websites' },
    ],
  },
  {
    group: 'Admin | Blogs',
    endpoints: [
      { method: 'GET', path: '/admin/blogs', auth: true, label: 'List Blogs' },
    ],
  },
  {
    group: 'Admin | Sponsors',
    endpoints: [
      { method: 'GET', path: '/admin/sponsors', auth: true, label: 'List Sponsors' },
    ],
  },
  {
    group: 'Admin | Files',
    endpoints: [
      { method: 'GET', path: '/admin/files', auth: true, label: 'List Files' },
    ],
  },
  {
    group: 'Admin | Feature Flags',
    endpoints: [
      { method: 'GET', path: '/admin/feature-flags', auth: false, label: 'Get All Feature Flags' },
    ],
  },
  {
    group: 'Event Management',
    endpoints: [
      { method: 'GET', path: '/event-management', auth: false, label: 'List Events' },
    ],
  },
  {
    group: 'Website | Token',
    endpoints: [
      { method: 'POST', path: '/website/token', auth: false, label: 'Get Website Token', headers: { 'x-website-domain': 'localhost' } },
    ],
  },
];

// ── Utilities ───────────────────────────────────────────────────────────────

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function statusEmoji(code) {
  if (code >= 200 && code < 300) return '✅';
  if (code === 429) return '🚫';
  if (code >= 400 && code < 500) return '⚠️';
  if (code >= 500) return '❌';
  return '❓';
}

async function makeRequest(method, path, { body, headers = {}, auth = false, prefix = API_PREFIX } = {}) {
  const url = `${BASE_URL}${prefix}${path}`;
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth && adminToken) {
    reqHeaders['Authorization'] = `Bearer ${adminToken}`;
  }

  const opts = { method, headers: reqHeaders };
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    opts.body = JSON.stringify(body);
  }

  const start = performance.now();
  try {
    const res = await fetch(url, opts);
    const elapsed = performance.now() - start;
    let responseBody;
    try { responseBody = await res.json(); } catch { responseBody = null; }
    return { status: res.status, elapsed, error: null, body: responseBody };
  } catch (err) {
    const elapsed = performance.now() - start;
    return { status: 0, elapsed, error: err.message, body: null };
  }
}

// ── Run concurrency batch ───────────────────────────────────────────────────
async function runBatch(method, path, count, opts = {}) {
  const results = [];
  const batchSize = CONCURRENCY;

  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const thisSize = Math.min(batchSize, count - i);
    for (let j = 0; j < thisSize; j++) {
      batch.push(makeRequest(method, path, opts));
    }
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}

// ── Analyze results ─────────────────────────────────────────────────────────
function analyzeResults(results) {
  const latencies = results.map(r => r.elapsed);
  const statuses = {};
  let throttled = 0;
  let errors = 0;
  let success = 0;
  let connectionErrors = 0;

  for (const r of results) {
    statuses[r.status] = (statuses[r.status] || 0) + 1;
    if (r.status === 429) throttled++;
    if (r.status >= 500 || r.status === 0) errors++;
    if (r.status === 0) connectionErrors++;
    if (r.status >= 200 && r.status < 400) success++;
  }

  return {
    total: results.length,
    success,
    throttled,
    errors,
    connectionErrors,
    statuses,
    latency: {
      min: Math.min(...latencies).toFixed(1),
      max: Math.max(...latencies).toFixed(1),
      avg: avg(latencies).toFixed(1),
      p50: percentile(latencies, 50).toFixed(1),
      p95: percentile(latencies, 95).toFixed(1),
      p99: percentile(latencies, 99).toFixed(1),
    },
  };
}

// ── Throttle Burst Test ─────────────────────────────────────────────────────
async function runThrottleTest() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🚨  THROTTLE / RATE LIMIT BURST TEST                  ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Sending ${THROTTLE_BURST_COUNT} requests as fast as possible to /health      ║`);
  console.log(`║  Concurrency: ${CONCURRENCY}                                              ║`);
  console.log(`║  Throttle config: 100 req / 60s (from ThrottlerModule)       ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const testEndpoints = [
    { path: '/health', method: 'GET', label: 'GET /health (Public)', auth: false },
    { path: '/admin/auth/me', method: 'GET', label: 'GET /admin/auth/me (Auth)', auth: true },
    { path: '/admin/feature-flags', method: 'GET', label: 'GET /admin/feature-flags (Public)', auth: false },
  ];

  const throttleResults = [];

  for (const ep of testEndpoints) {
    console.log(`\n  🔥 Burst testing: ${ep.label}`);
    const results = await runBatch(ep.method, ep.path, THROTTLE_BURST_COUNT, { auth: ep.auth });
    const analysis = analyzeResults(results);

    const throttleRate = ((analysis.throttled / analysis.total) * 100).toFixed(1);
    const firstThrottleIdx = results.findIndex(r => r.status === 429);

    console.log(`     Total: ${analysis.total} | ✅ ${analysis.success} | 🚫 429: ${analysis.throttled} (${throttleRate}%) | ❌ Errors: ${analysis.errors}`);
    console.log(`     Latency → avg: ${analysis.latency.avg}ms | p95: ${analysis.latency.p95}ms | p99: ${analysis.latency.p99}ms`);
    if (firstThrottleIdx >= 0) {
      console.log(`     ⚡ First 429 at request #${firstThrottleIdx + 1}`);
    } else {
      console.log(`     ✅ No throttling detected (all requests passed)`);
    }

    throttleResults.push({
      endpoint: ep.label,
      path: ep.path,
      ...analysis,
      throttleRate: parseFloat(throttleRate),
      firstThrottleAt: firstThrottleIdx >= 0 ? firstThrottleIdx + 1 : null,
    });
  }

  return throttleResults;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        ⚡  Core Media API Stress Test Suite                   ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Target        : ${BASE_URL.padEnd(43)}║`);
  console.log(`║  Concurrency   : ${String(CONCURRENCY).padEnd(43)}║`);
  console.log(`║  Reqs/Endpoint : ${String(REQUESTS_PER_ENDPOINT).padEnd(43)}║`);
  console.log(`║  Throttle Burst: ${String(THROTTLE_BURST_COUNT).padEnd(43)}║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // ── Step 1: Auth ──────────────────────────────────────────────────────
  console.log('\n🔐 Authenticating...');
  const loginResult = await makeRequest('POST', '/admin/auth/login', {
    body: { email: 'superadmin@gmail.com', password: 'admin@123' },
  });

  if (loginResult.status === 200 && loginResult.body?.data?.access_token) {
    adminToken = loginResult.body.data.access_token;
    console.log(`   ✅ Authenticated successfully (token: ${adminToken.substring(0, 20)}...)`);
  } else if (loginResult.status === 200 && loginResult.body?.data?.accessToken) {
    adminToken = loginResult.body.accessToken;
    console.log(`   ✅ Authenticated successfully (token: ${adminToken.substring(0, 20)}...)`);
  } else {
    console.log(`   ⚠️  Auth failed (status: ${loginResult.status}). Some tests will fail.`);
    console.log(`   Response: ${JSON.stringify(loginResult.body)?.substring(0, 200)}`);
  }

  // ── Step 2: Stress Test All Endpoints ─────────────────────────────────
  console.log('\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  📊  ENDPOINT STRESS TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allResults = [];

  for (const group of ENDPOINT_GROUPS) {
    console.log(`\n  ┌── ${group.group} ${'─'.repeat(Math.max(0, 55 - group.group.length))}┐`);

    for (const ep of group.endpoints) {
      const prefix = ep.prefix || API_PREFIX;
      const results = await runBatch(ep.method, ep.path, REQUESTS_PER_ENDPOINT, {
        body: ep.body,
        headers: ep.headers,
        auth: ep.auth,
        prefix,
      });

      const analysis = analyzeResults(results);
      const throttleRate = ((analysis.throttled / analysis.total) * 100).toFixed(1);
      const mainStatus = Object.entries(analysis.statuses).sort((a, b) => b[1] - a[1])[0];

      console.log(`  │`);
      console.log(`  │ ${statusEmoji(parseInt(mainStatus[0]))} ${ep.method.padEnd(5)} ${ep.path}`);
      console.log(`  │   Label    : ${ep.label}`);
      console.log(`  │   Requests : ${analysis.total} | ✅ ${analysis.success} | 🚫 429: ${analysis.throttled} (${throttleRate}%) | ❌ ${analysis.errors}`);
      console.log(`  │   Latency  : avg=${analysis.latency.avg}ms | p50=${analysis.latency.p50}ms | p95=${analysis.latency.p95}ms | p99=${analysis.latency.p99}ms`);
      console.log(`  │   Range    : min=${analysis.latency.min}ms | max=${analysis.latency.max}ms`);
      console.log(`  │   Statuses : ${Object.entries(analysis.statuses).map(([k, v]) => `${k}:${v}`).join(', ')}`);

      allResults.push({
        group: group.group,
        label: ep.label,
        method: ep.method,
        path: ep.path,
        auth: ep.auth,
        ...analysis,
        throttleRate: parseFloat(throttleRate),
      });
    }

    console.log(`  └${'─'.repeat(60)}┘`);
  }

  // ── Step 3: Throttle Burst Test ───────────────────────────────────────
  const throttleResults = await runThrottleTest();

  // ── Step 4: Generate Report ───────────────────────────────────────────
  const report = {
    metadata: {
      testDate: new Date().toISOString(),
      targetUrl: BASE_URL,
      concurrency: CONCURRENCY,
      requestsPerEndpoint: REQUESTS_PER_ENDPOINT,
      throttleBurstCount: THROTTLE_BURST_COUNT,
      throttleConfig: {
        ttl: 60000,
        limit: 100,
        description: 'Global ThrottlerGuard: 100 requests per 60 seconds per IP',
      },
    },
    endpointResults: allResults,
    throttleBurstResults: throttleResults,
    summary: {
      totalEndpoints: allResults.length,
      totalRequests: allResults.reduce((s, r) => s + r.total, 0),
      totalSuccess: allResults.reduce((s, r) => s + r.success, 0),
      totalThrottled: allResults.reduce((s, r) => s + r.throttled, 0),
      totalErrors: allResults.reduce((s, r) => s + r.errors, 0),
      avgLatency: (allResults.reduce((s, r) => s + parseFloat(r.latency.avg), 0) / allResults.length).toFixed(1),
      slowestEndpoint: allResults.reduce((max, r) => parseFloat(r.latency.p95) > parseFloat(max.latency.p95) ? r : max, allResults[0]),
      fastestEndpoint: allResults.reduce((min, r) => parseFloat(r.latency.p50) < parseFloat(min.latency.p50) ? r : min, allResults[0]),
      throttledEndpoints: allResults.filter(r => r.throttled > 0).map(r => ({ label: r.label, throttled: r.throttled, rate: r.throttleRate })),
    },
  };

  // Save JSON report
  const reportPath = join(__dirname, 'stress-test-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 JSON report saved: ${reportPath}`);

  // ── Step 5: Print Summary ─────────────────────────────────────────────
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                📊  STRESS TEST SUMMARY                       ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Endpoints Tested    : ${String(report.summary.totalEndpoints).padEnd(38)}║`);
  console.log(`║  Total Requests      : ${String(report.summary.totalRequests).padEnd(38)}║`);
  console.log(`║  Total Success       : ${String(report.summary.totalSuccess).padEnd(38)}║`);
  console.log(`║  Total Throttled(429): ${String(report.summary.totalThrottled).padEnd(38)}║`);
  console.log(`║  Total Errors        : ${String(report.summary.totalErrors).padEnd(38)}║`);
  console.log(`║  Avg Latency         : ${(report.summary.avgLatency + 'ms').padEnd(38)}║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  ⚡ Fastest (p50)    : ${(report.summary.fastestEndpoint.label + ' (' + report.summary.fastestEndpoint.latency.p50 + 'ms)').padEnd(38)}║`);
  console.log(`║  🐢 Slowest (p95)    : ${(report.summary.slowestEndpoint.label + ' (' + report.summary.slowestEndpoint.latency.p95 + 'ms)').padEnd(38)}║`);
  console.log('╠════════════════════════════════════════════════════════════════╣');

  if (report.summary.throttledEndpoints.length > 0) {
    console.log('║  🚫 Throttled Endpoints:                                     ║');
    for (const te of report.summary.throttledEndpoints) {
      console.log(`║    - ${(te.label + ': ' + te.throttled + ' reqs (' + te.rate + '%)').padEnd(55)}║`);
    }
  } else {
    console.log('║  ✅ No endpoints were throttled during basic stress test      ║');
  }

  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║  🚨 THROTTLE BURST TEST RESULTS:                             ║');
  for (const tr of throttleResults) {
    const status = tr.throttled > 0 ? '🚫' : '✅';
    console.log(`║  ${status} ${(tr.endpoint).padEnd(40)} ${String(tr.throttled + '/' + tr.total + ' throttled').padEnd(18)}║`);
  }

  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Stress test completed!\n');

  return report;
}

main().catch(console.error);
