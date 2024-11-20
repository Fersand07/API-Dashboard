const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

process.on('SIGINT', () => {
    db.end(err => {
        if (err) console.error('Error closing MySQL connection:', err);
        else console.log('MySQL connection closed');
        process.exit();
    });
});

module.exports = { db };
