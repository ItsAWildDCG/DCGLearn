const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

// Tự động kiểm tra và tạo file nếu chưa có
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [] }, null, 4));
}

const readData = () => {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { users: [] };
    }
};

const writeData = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 4), 'utf-8');
};

module.exports = { readData, writeData };