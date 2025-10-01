const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for backup uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `temp_${timestamp}_${originalName}`);
  }
});

// File filter for backup files
const fileFilter = (req, file, cb) => {
  // Allow .gz and .json files
  const allowedTypes = ['.gz', '.json'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('يُسمح فقط بملفات .gz و .json'), false);
  }
};

// Create multer instance for backup uploads
const uploadBackup = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 1 // Only one file at a time
  }
}).single('backup');

module.exports = {
  uploadBackup
};








