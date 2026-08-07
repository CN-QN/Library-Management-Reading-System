db = db.getSiblingDB("libraryhub");
db.books.updateMany({}, { $set: { "stats.rating": 0, "stats.ratingCount": 0 } });
