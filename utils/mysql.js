const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the pool connection with a promise-based query
(async () => {
    try {
        const [rows] = await pool.promise().query('SELECT 1 + 1 AS solution');
        console.log('Connected to the MySQL database via connection pool.');
    } catch (err) {
        console.error('Error connecting to the MySQL database:', err);
    }
})();

// Export the promise-based pool for use with async/await
module.exports = pool.promise();
