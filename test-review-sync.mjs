import assert from 'node:assert';

const API_URL = 'http://localhost:5210/api';
// Thử đăng nhập hoặc tạo user mới để lấy token
let token = '';

import crypto from 'crypto';

function generateToken() {
  const randomId = crypto.randomBytes(12).toString('hex');
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: randomId,
    jti: crypto.randomUUID(),
    email: `test-user-${Date.now()}@example.com`,
    uid: randomId,
    role: 'User',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'LibraryHub',
    aud: 'LibraryHubUsers'
  };

  const base64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  
  const h = base64UrlEncode(header);
  const p = base64UrlEncode(payload);
  
  const secret = 'SuperSecretKeyForLibraryHubManagementSystem2026!';
  const signature = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  
  token = `${h}.${p}.${signature}`;
}

async function loginOrRegister() {
  generateToken();
}

async function runTest() {
  console.log('--- STARTING TDD SYNC TEST ---');
  await loginOrRegister();
  
  // 1. Get book details before review
  const slug = 'toi-thay-hoa-vang-tren-co-xanh';
  const bookRes = await fetch(`${API_URL}/Books/slug/${slug}`);
  const bookText = await bookRes.text();
  const bookData = JSON.parse(bookText);
  console.log("Book Data Structure:", JSON.stringify(bookData.data, null, 2));
  const bookId = bookData.data.id;
  const initialRating = bookData.data.stats ? bookData.data.stats.rating : bookData.data.rating;
  const initialCount = (bookData.data.stats ? bookData.data.stats.ratingCount : bookData.data.ratingCount) || 0;
  
  console.log(`Initial Book [${bookId}] Rating: ${initialRating}, Count: ${initialCount}`);
  
  // 2. Post a new 5-star review
  const reviewBody = {
    bookId: bookId,
    rating: 5,
    comment: 'Tuyệt vời, test đồng bộ data!'
  };
  
  const postRes = await fetch(`${API_URL}/Reviews`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reviewBody)
  });
  
  const postText = await postRes.text();
  let postData;
  try {
    postData = JSON.parse(postText);
  } catch (e) {
    throw new Error(`Failed to parse post response: Status=${postRes.status}, Body=${postText}`);
  }

  if (!postData.success) {
    console.log('Post failed, possibly already reviewed. Attempting to delete existing review...');
    if (postData.message && postData.message.includes('đã đánh giá')) {
      throw new Error('Please clear the review for test user manually before testing.');
    }
    throw new Error('Failed to post review: ' + postData.message);
  }
  
  const reviewId = postData.data.id;
  console.log(`Created Review ID: ${reviewId}`);
  
  // Wait a little bit just in case
  await new Promise(r => setTimeout(r, 500));
  
  // 3. Fetch book details again
  const newBookRes = await fetch(`${API_URL}/Books/slug/${slug}`);
  const newBookText = await newBookRes.text();
  const newBookData = JSON.parse(newBookText);
  const newRating = newBookData.data.stats ? newBookData.data.stats.rating : newBookData.data.rating;
  const newCount = newBookData.data.stats ? newBookData.data.stats.ratingCount : newBookData.data.ratingCount;
  
  console.log(`New Book Rating: ${newRating}, Count: ${newCount}`);
  
  // 4. Assert that the rating changed to reflect the new 5 star review!
  try {
    assert.strictEqual(newCount, initialCount + 1, 'Rating count did not increment!');
    console.log('✅ TEST PASSED: Book rating was successfully synchronized!');
  } catch (err) {
    console.error('❌ TEST FAILED: ', err.message);
    process.exit(1);
  }
}

runTest().catch(console.error);
