const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.single('image'), userController.register);
router.post('/login', userController.login);

router.get('/profile', auth, userController.getProfile);
router.put('/update_profile', auth, upload.single('image'), userController.updateProfile);
router.get('/:id',auth, userController.getUserProfile);
router.get('/:id/articles',auth, userController.getUserArticles);

router.post('/refresh-token', userController.refreshToken);
router.post('/logout', auth, userController.logout);

module.exports = router; 