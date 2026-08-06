/**
 * DEMO 2: Giả lập 500 Requests đọc dữ liệu (Load Test / Performance Benchmark)
 * Mục đích: Đo thời gian phản hồi (Latency) và số Request/giây (RPS)
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5210;
const TOTAL_REQUESTS = 500;
const CONCURRENCY = 20;

function sendHealthReq(id) {
  return new Promise((resolve) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/health',
      method: 'GET'
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({ id, statusCode: res.statusCode, duration });
      });
    });

    req.on('error', (e) => {
      resolve({ id, statusCode: 500, duration: 0, error: e.message });
    });

    req.end();
  });
}

async function runBenchmarkDemo() {
  console.log('\n================================================================');
  console.log(`🚀 DEMO BENCHMARK LOAD TEST: Giả lập ${TOTAL_REQUESTS} requests liên tục...`);
  console.log('================================================================\n');

  const startAll = Date.now();
  const durations = [];

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batch = [];
    for (let j = i; j < Math.min(i + CONCURRENCY, TOTAL_REQUESTS); j++) {
      batch.push(sendHealthReq(j + 1));
    }
    const results = await Promise.all(batch);
    results.forEach(r => durations.push(r.duration));
  }

  const totalTimeMs = Date.now() - startAll;
  const avgLatencyMs = (durations.reduce((a, b) => a + b, 0) / TOTAL_REQUESTS).toFixed(2);
  const minLatencyMs = Math.min(...durations);
  const maxLatencyMs = Math.max(...durations);
  const rps = ((TOTAL_REQUESTS / totalTimeMs) * 1000).toFixed(0);

  console.log('📊 BẢNG THỐNG KÊ HIỆU NĂNG (BENCHMARK RESULTS):');
  console.log(`- Tổng số Requests:           ${TOTAL_REQUESTS} reqs`);
  console.log(`- Xử lý hoàn tất trong:       ${totalTimeMs} ms (${(totalTimeMs/1000).toFixed(2)}s)`);
  console.log(`- Tốc độ xử lý (RPS):        ${rps} req/s`);
  console.log(`- Độ trễ trung bình (Avg):   ${avgLatencyMs} ms`);
  console.log(`- Độ trễ thấp nhất (Min):    ${minLatencyMs} ms`);
  console.log(`- Độ trễ cao nhất (Max):     ${maxLatencyMs} ms`);
  console.log('----------------------------------------------------------------\n');
}

runBenchmarkDemo();
