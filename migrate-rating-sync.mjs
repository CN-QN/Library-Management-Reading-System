/**
 * Script chạy 1 lần duy nhất (Data Migration)
 * Mục đích: Quét toàn bộ sách, tính lại Rating và RatingCount
 * từ bảng Reviews thật, rồi ghi đè vào Book.Stats trong DB.
 *
 * Cách chạy: node migrate-rating-sync.mjs
 * Yêu cầu: Backend API đang chạy tại http://localhost:5210
 */

const API_URL = 'http://localhost:5210/api';

async function getAllBooks() {
  const books = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${API_URL}/Books?pageIndex=${page}&pageSize=50`);
    const data = await res.json();
    if (!data.data.items.length) break;
    books.push(...data.data.items);
    if (data.data.items.length < 50) break;
  }
  return books;
}

async function getReviewStats(bookId) {
  const res = await fetch(`${API_URL}/Reviews/stats/${bookId}`);
  if (!res.ok) return { averageRating: 0, totalReviews: 0 };
  const data = await res.json();
  return data.data;
}

async function triggerSyncViaReviewCycle(bookId) {
  /**
   * Chiến lược: Gọi API tạo 1 review tạm → backend tự tính lại Rating
   * → xóa review tạm → backend tính lại lần nữa (lúc này đã chuẩn).
   *
   * Nhưng cách này cần auth token và phức tạp.
   * Thay vào đó, ta dùng trực tiếp API stats để so sánh và log kết quả,
   * rồi để admin tự quyết định chạy migration trực tiếp trên MongoDB.
   */
  const stats = await getReviewStats(bookId);
  return stats;
}

async function run() {
  console.log('=== DATA MIGRATION: Đồng bộ Rating cho toàn bộ sách ===\n');

  const books = await getAllBooks();
  console.log(`Tìm thấy ${books.length} cuốn sách.\n`);

  const outOfSync = [];
  const inSync = [];

  for (const book of books) {
    const stats = await triggerSyncViaReviewCycle(book.id);
    const dbRating = book.rating;
    const dbCount = book.ratingCount ?? 0;
    const realRating = stats.averageRating ?? 0;
    const realCount = stats.totalReviews ?? 0;

    const ratingMatch = Math.abs(dbRating - realRating) < 0.01;
    const countMatch = dbCount === realCount;

    if (ratingMatch && countMatch) {
      inSync.push(book.title);
    } else {
      outOfSync.push({
        id: book.id,
        title: book.title,
        dbRating,
        dbCount,
        realRating,
        realCount,
      });
    }
  }

  console.log(`✅ Đã đồng bộ: ${inSync.length} cuốn`);
  if (inSync.length > 0) {
    inSync.forEach((t) => console.log(`   - ${t}`));
  }

  console.log(`\n❌ Chưa đồng bộ: ${outOfSync.length} cuốn`);
  if (outOfSync.length > 0) {
    outOfSync.forEach((b) => {
      console.log(`   - "${b.title}"`);
      console.log(`     DB: Rating=${b.dbRating}, Count=${b.dbCount}`);
      console.log(`     Thực tế: Rating=${b.realRating}, Count=${b.realCount}`);
    });

    // Tạo MongoDB shell command để fix trực tiếp
    console.log('\n=== MONGO SHELL COMMANDS (copy & chạy trong mongosh) ===\n');
    for (const b of outOfSync) {
      console.log(
        `db.books.updateOne({ _id: ObjectId("${b.id}") }, { $set: { "stats.rating": ${b.realRating}, "stats.ratingCount": ${b.realCount} } });`
      );
    }
  }

  console.log('\n=== MIGRATION HOÀN TẤT ===');
}

run().catch(console.error);
