const MONGOOSE = require('mongoose');
const FS = require('fs');
const PATH = require('path');

MONGOOSE.Promise = global.Promise;

module.exports = (config) => {
    MONGOOSE.connect(config.connectionString);

    let db = MONGOOSE.connection;

    db.once('open', (err) => {
        if (err) {
            throw err;
        }

        console.log('MongoDB is ready!');

        // Auto-seed books if database is empty
        const BOOK = MONGOOSE.model('Book');
        BOOK.countDocuments().then((count) => {
            if (count === 0) {
                console.log('Database is empty of books, seeding...');
                try {
                    const booksFilePath = PATH.join(__dirname, '../books.json');
                    const fileContent = FS.readFileSync(booksFilePath, 'utf8');
                    const books = fileContent
                        .split('\n')
                        .filter(line => line.trim())
                        .map(line => {
                            const parsed = JSON.parse(line);
                            if (parsed._id && parsed._id.$oid) {
                                parsed._id = parsed._id.$oid;
                            }
                            if (parsed.creationDate && parsed.creationDate.$date) {
                                parsed.creationDate = new Date(parsed.creationDate.$date);
                            }
                            return parsed;
                        });
                    
                    BOOK.insertMany(books)
                        .then(() => console.log('Successfully seeded books!'))
                        .catch((err) => console.error('Error seeding books:', err));
                } catch (err) {
                    console.error('Failed to read or parse books.json:', err);
                }
            }
        });
    });

    require('../models/Cart');
    require('../models/User');
    require('../models/Role').init();
    require('../models/Receipt');
    require('../models/Book');
    require('../models/Comment');
};