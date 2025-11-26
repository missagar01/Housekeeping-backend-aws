const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const { assignTaskController } = require('../controllers/assignTaskController');
const { validateBody } = require('../middleware/validate');
const {
  assignTaskSchema,
  assignTaskListSchema,
  updateAssignTaskSchema
} = require('../models/assignTask');

const uploadsDir = path.join(__dirname, '..', 'uploads');
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

const router = Router();

const normalizeItem = (item, file) => {
  if (item && item.delay !== undefined) {
    const n = Number(item.delay);
    if (!Number.isNaN(n)) {
      item.delay = n;
    } else {
      delete item.delay;
    }
  }

  if (file) {
    item.image = `/uploads/${file.filename}`;
  }
};

const normalizeBody = (req, _res, next) => {
  if (Array.isArray(req.body)) {
    req.body.forEach((item) => normalizeItem(item, req.file));
  } else {
    normalizeItem(req.body, req.file);
  }
  next();
};

router
  .route('/')
  .get(assignTaskController.list)
  .post(
    upload.single('image'), // handles multipart/form-data
    normalizeBody,
    validateBody(assignTaskSchema),
    assignTaskController.create
  );

router.post(
  '/bulk',
  upload.single('image'),
  normalizeBody,
  validateBody(assignTaskListSchema),
  assignTaskController.bulkCreate
);

router
  .route('/:id')
  .get(assignTaskController.getById)
  .put(
    upload.single('image'),
    normalizeBody,
    validateBody(updateAssignTaskSchema),
    assignTaskController.update
  )
  .delete(assignTaskController.remove);

module.exports = router;
