const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'dcglearn',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
});

// Xử lý lỗi kết nối đột ngột
pool.on('error', (err) => {
    console.error('Lỗi Pool kết nối Postgres:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    // Hàm cực kỳ quan trọng để làm Transaction
    getClient: () => pool.connect() 
};