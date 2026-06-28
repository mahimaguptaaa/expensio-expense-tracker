const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { chat, getChatHistory, clearChatHistory, getGroupInsights, scanReceipt } = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `receipt-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

router.post('/chat', chat);
router.get('/chat/history', getChatHistory);
router.delete('/chat/history', clearChatHistory);
router.get('/group/:groupId/insights', getGroupInsights);
router.post('/scan-receipt', upload.single('receipt'), scanReceipt);

module.exports = router;
