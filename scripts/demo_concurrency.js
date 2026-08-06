/**
 * DEMO 1: Giả lập 5 request mượn sách gửi ĐỒNG THỜI trong cùng 1 milisecond (Concurrent Race Condition)
 * Mục đích: Chứng minh Redis Distributed Lock ngăn chặn hoàn toàn việc 2 người mượn cùng 1 cuốn sách vật lý.
 */

const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5210;

function sendBorrowRequest(userId, copyId, requestId) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      userId: userId,
      copyId: copyId,
      notes: `Request demo concurrency #${requestId}`
    });

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/borrowings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({
          requestId,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          status: res.statusCode === 201 || res.statusCode === 200 ? 'SUCCESS ✅' : 'BLOCKED BY REDIS LOCK ❌'
        });
      });
    });

    req.on('error', (e) => {
      resolve({ requestId, statusCode: 500, duration: '0ms', status: 'SERVER ERROR ❌' });
    });

    req.write(postData);
    req.end();
  });
}

async function runConcurrencyDemo() {
  console.log('\n================================================================');
  console.log('🚀 DEMO CONCURRENCY: Phát 5 requests MƯỢN CÙNG 1 SÁCH trong 0ms...');
  console.log('================================================================\n');

  const copyId = 'COPY-DEMO-001';
  const requests = [];

  for (let i = 1; i <= 5; i++) {
    requests.push(sendBorrowRequest(`USER-00${i}`, copyId, i));
  }

  const results = await Promise.all(requests);

  console.table(results);

  const successCount = results.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;
  const lockBlockedCount = results.filter(r => r.statusCode >= 400).length;

  console.log('----------------------------------------------------------------');
  console.log(`✅ Kết quả: ${successCount} mượn THÀNH CÔNG | ❌ ${lockBlockedCount} bị REDIS LOCK CHẶN ĐỨNG`);
  console.log('----------------------------------------------------------------\n');
}

runConcurrencyDemo();
