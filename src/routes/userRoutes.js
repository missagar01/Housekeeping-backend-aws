const { Router } = require('express');
const { userController } = require('../controllers/userController');
const { validateBody } = require('../middleware/validate');
const { userSchema, updateUserSchema } = require('../models/user');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();

// router.use(requireAuth);
router.use(requireAdmin);

router.get('/departments', userController.listDepartments);

router
  .route('/')
  .get(userController.list)
  .post(validateBody(userSchema), userController.create);

router
  .route('/:id')
  .get(userController.getById)
  .put(validateBody(updateUserSchema), userController.update)
  .delete(userController.remove);

module.exports = router;
