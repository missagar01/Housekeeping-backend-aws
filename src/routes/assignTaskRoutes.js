const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const { assignTaskController } = require('../controllers/assignTaskController');
const { validateBody } = require('../middleware/validate');
const { assignTaskSchema, updateAssignTaskSchema } = require('../models/assignTask');
const { requireAuth } = require('../middleware/auth');

// Use the project-level uploads directory (same as app.js)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Run multer only when the request is multipart; otherwise defer to body parsers.
const maybeMultipartFields = (req, res, next) => {
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (contentType.includes('multipart/form-data')) {
    return upload.none()(req, res, next);
  }
  return next();
};

const router = Router();
// Require a valid token for all assignment routes; per-role filtering is handled inside controllers
router.use(requireAuth);

const buildImageUrl = (req, file) => {
  if (!file) return undefined;
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const base = host ? `${proto}://${host}` : '';
  return `${base}/api/uploads/${file.filename}`;
};

const normalizeItem = (req, item, file) => {
  if (item && item.delay !== undefined) {
    const n = Number(item.delay);
    if (!Number.isNaN(n)) {
      item.delay = n;
    } else {
      delete item.delay;
    }
  }

  if (file) {
    item.image = buildImageUrl(req, file);
  }

  // Fix common key typos from clients
  if (item && item.sttaus !== undefined && item.status === undefined) {
    item.status = item.sttaus;
    delete item.sttaus;
  }
  if (item && item['remark:'] !== undefined && item.remark === undefined) {
    item.remark = item['remark:'];
    delete item['remark:'];
  }
};

const normalizeBody = (req, _res, next) => {
  if (Array.isArray(req.body)) {
    req.body.forEach((item) => normalizeItem(req, item, req.file));
  } else {
    normalizeItem(req, req.body, req.file);
  }
  next();
};

router
  .route('/generate')
  .get(assignTaskController.list)
  .post(
    upload.single('image'),
    normalizeBody,
    validateBody(assignTaskSchema),
    assignTaskController.generateFromWorkingDays
);

router.get('/generate/stats', assignTaskController.stats);

router.get('/generate/overdue', assignTaskController.overdue);

router.get('/generate/not-done', assignTaskController.notDone);

router.get('/generate/today', assignTaskController.today);

router.get('/generate/pending', assignTaskController.pending);

router.get('/generate/history', assignTaskController.history);

// Mark an assignment as confirmed (stores marker in attachment column)
router
  .route('/generate/:id/confirm')
  .post(
    upload.single('image'), // allow optional image upload along with remark/attachment
    assignTaskController.confirmAttachment
  )



router
  .route('/generate/:id')
  .get(assignTaskController.getById)
  .patch(
    upload.single('image'),
    normalizeBody,
    validateBody(updateAssignTaskSchema),
    assignTaskController.update
  )
  .delete(assignTaskController.remove);

module.exports = router;
