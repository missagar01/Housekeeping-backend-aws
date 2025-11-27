const { Router } = require('express');
const { userController } = require('../controllers/userController');
const { validateBody } = require('../middleware/validate');
const { userSchema, updateUserSchema } = require('../models/user');

const router = Router();

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
