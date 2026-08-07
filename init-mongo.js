// Tạo user và database cho ứng dụng
db = db.getSiblingDB('libraryhub');

// Tạo user
db.createUser({
  user: 'libraryhub_user',
  pwd: 'libraryhub_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'libraryhub'
    }
  ]
});

// Tạo collections
db.createCollection('books');
db.createCollection('authors');
db.createCollection('categories');
db.createCollection('chapters');
db.createCollection('bookCopies');
db.createCollection('borrowingRecords');
db.createCollection('fileAssets');
db.createCollection('inventoryTransactions');
db.createCollection('users');
db.createCollection('roles');

// Tạo indexes
db.books.createIndex({ slug: 1 }, { unique: true });
db.books.createIndex(
  { title: 'text', summary: 'text' },
  { default_language: "none", language_override: "none" }
);
db.authors.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ slug: 1 }, { unique: true });
db.chapters.createIndex({ bookId: 1, number: 1 }, { unique: true });
db.borrowingRecords.createIndex({ userId: 1, status: 1 });
db.borrowingRecords.createIndex({ bookCopyId: 1, status: 1 });

print('MongoDB initialization completed!');