const db = require('../data/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/pdf/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Tên file = Thời gian hiện tại + Tên gốc (để không bao giờ trùng)
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueSuffix);
    }
});

// Bộ lọc: Chỉ cho phép file PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận định dạng file PDF!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
}).single('pdf');

// API Xử lý Upload file PDF
exports.uploadPDF =  (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: "Vui lòng chọn 1 file PDF." });
        }
        try {
            // Lấy các thông tin bài học gửi kèm từ req.body
            const { courseId, title, description, order_index } = req.body;
            
            // Đường dẫn của file PDF vừa tạo
            const content_url = `/uploads/pdf/${req.file.filename}`;
            const content_type = 'PDF'; // Mặc định loại bài học là pdf
            const content_text = null;  // Bài học file thì không cần chữ nội dung dài

            const sql = `
                INSERT INTO "Lesson" (course_id, title, description, content_type, content_text, content_url, order_index)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
            `;
            
            const result = await db.query(sql, [
                courseId, title, description, content_type, content_text, content_url, order_index
            ]);

            // Trả về kết quả bài học hoàn chỉnh đã nằm trong database
            res.status(201).json({ 
                message: "Tạo bài học PDF và lưu vào Database thành công!", 
                lesson: result.rows[0] 
            });

        } catch (error) {
            console.error("Lỗi khi lưu bài học PDF vào DB:", error);
            if (req.file) {
                fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'pdf', req.file.filename));
            }
            res.status(500).json({ message: "Lỗi khi tạo bài học mới vào Database." });
        }
    });
};

// 1. Lấy tất cả bài học của một khóa học cụ thể
exports.getLessonsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        // Sử dụng ORDER BY order_index để đảm bảo thứ tự bài học luôn đúng
        const sql = 'SELECT * FROM "Lesson" WHERE course_id = $1 ORDER BY order_index ASC';
        const result = await db.query(sql, [courseId]);
        
        res.json({ lessons: result.rows });
    } catch (error) {
        console.error("Lỗi lấy bài học:", error);
        res.status(500).json({ message: "Lỗi lấy danh sách bài học từ Database." });
    }
};

// 2. Thêm bài học mới (Giảng viên/Admin)
exports.createLesson = async (req, res) => {
    try {
        const { courseId, title, description, content_type, content_text, content_url, order_index } = req.body;

        const sql = `
            INSERT INTO "Lesson" (course_id, title, description, content_type, content_text, content_url, order_index)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const result = await db.query(sql, [
            courseId, title, description, content_type, content_text, content_url, order_index
        ]);

        res.status(201).json({ message: "Thêm bài học thành công!", lesson: result.rows[0] });
    } catch (error) {
        console.error("Lỗi tạo bài học:", error);
        res.status(500).json({ message: "Lỗi khi tạo bài học mới." });
    }
};

// 3. Cập nhật bài học
exports.updateLesson = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, content_type, content_text, content_url, order_index } = req.body;

        const sql = `
            UPDATE "Lesson" 
            SET title = $1, description = $2, content_type = $3, content_text = $4, content_url = $5, order_index = $6
            WHERE lesson_id = $7 RETURNING *
        `;
        const result = await db.query(sql, [
            title, description, content_type, content_text, content_url, order_index, id
        ]);

        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy bài học để cập nhật." });

        res.json({ message: "Cập nhật bài học thành công!", lesson: result.rows[0] });
    } catch (error) {
        console.error("Lỗi cập nhật bài học:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật bài học." });
    }
};

// API: Cập nhật bài học PDF (Có xử lý đổi file và xóa file cũ)
exports.updatePDFLesson = (req, res) => {
    // 1. Chạy multer để hứng file PDF mới (nếu người dùng có chọn file mới)
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }

        try {
            const { id } = req.params; // Lấy lesson_id cần sửa
            const { title, description, order_index } = req.body;

            // 2. Tìm bài học cũ trong Database xem nó có tồn tại không và lấy link file cũ
            const findSql = 'SELECT content_url FROM "Lesson" WHERE lesson_id = $1';
            const oldLessonResult = await db.query(findSql, [id]);

            if (oldLessonResult.rows.length === 0) {
                // Nếu không tìm thấy bài học mà lỡ upload file mới lên thì xóa file mới đi ngay để tránh rác
                if (req.file) {
                    fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'pdf', req.file.filename));
                }
                return res.status(404).json({ message: "Không tìm thấy bài học để cập nhật." });
            }

            // Mặc định giữ lại đường dẫn file cũ nếu người dùng không upload file mới
            let content_url = oldLessonResult.rows[0].content_url;
            let absoluteOldPath = null;

            // 3. NẾU NGƯỜI DÙNG CÓ CHỌN FILE PDF MỚI
            if (req.file) {
                const oldRelativePath = oldLessonResult.rows[0].content_url; // Ví dụ: /uploads/pdf/abc.pdf

                if (oldRelativePath) {
                    // Chuyển đường dẫn tương đối thành đường dẫn tuyệt đối trên ổ cứng server
                    // Loại bỏ dấu '/' ở đầu nếu có để tránh lỗi path.join
                    const cleanPath = oldRelativePath.startsWith('/') ? oldRelativePath.substring(1) : oldRelativePath;
                    absoluteOldPath = path.join(__dirname, '..', cleanPath);
                }

                // Cập nhật đường dẫn là file mới vừa tải lên
                content_url = `/uploads/pdf/${req.file.filename}`;
            }

            // 4. Tiến hành cập nhật thông tin mới vào Database PostgreSQL
            const sql = `
                UPDATE "Lesson" 
                SET title = $1, description = $2, content_url = $3, order_index = $4
                WHERE lesson_id = $5 RETURNING *
            `;
            const result = await db.query(sql, [title, description, content_url, order_index, id]);

            // Tiến hành xóa file cũ đi
            if (absoluteOldPath && fs.existsSync(absoluteOldPath)) {
                fs.unlinkSync(absoluteOldPath);
                console.log(`🗑️ Đã xóa file cũ thành công: ${absoluteOldPath}`);
            }

            res.json({ 
                message: "Cập nhật bài học PDF thành công!", 
                lesson: result.rows[0] 
            });

        } catch (error) {
            console.error("Lỗi cập nhật bài học PDF:", error);
            //Xóa file vừa được thêm vào nếu như bị lỗi
            if (req.file) {
                fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'pdf', req.file.filename));
            }
            res.status(500).json({ message: "Lỗi hệ thống khi cập nhật bài học." });
        }
    });
};

// 4. Xóa bài học
exports.deleteLesson = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Tìm thông tin bài học trước khi xóa để lấy thông tin file
        const findSql = 'SELECT content_url, content_type FROM "Lesson" WHERE lesson_id = $1';
        const lessonResult = await db.query(findSql, [id]);

        if (lessonResult.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy bài học để xóa." });
        }

        const lesson = lessonResult.rows[0];

        // 2. Tiến hành xóa dữ liệu trong PostgreSQL
        await db.query('DELETE FROM "Lesson" WHERE lesson_id = $1', [id]);
        
        // 3. Nếu là bài học loại PDF và có đường dẫn, tiến hành xóa file vật lý trên ổ cứng server
        if (lesson.content_type === 'PDF' && lesson.content_url) {
            const cleanPath = lesson.content_url.startsWith('/') ? lesson.content_url.substring(1) : lesson.content_url;
            const absolutePath = path.join(__dirname, '..', cleanPath);

            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
                console.log(`🗑️ Đã xóa file PDF khỏi server do bài học bị xóa: ${absolutePath}`);
            }
        }

        res.json({ message: "Xóa bài học thành công!" });
    } catch (error) {
        console.error("Lỗi xóa bài học:", error);
        res.status(500).json({ message: "Lỗi khi xóa bài học." });
    }
};