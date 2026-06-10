module.exports = {
    development: {
        connectionString: process.env.MONGODB_URI || 'mongodb://localhost:27017/BookStore'
    },
    production: {
        connectionString: process.env.MONGODB_URI
    }
};