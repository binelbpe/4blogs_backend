const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(auth);

router.post('/', upload.single('image'), articleController.createArticle);
router.get('/', articleController.getArticles);
router.get('/user', articleController.getUserArticles);
router.get('/:id', articleController.getArticleById);
router.get('/user/:id', articleController.getArticleByUserAndId);
router.put('/:id', upload.single('image'), articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);
router.post('/:id/block', articleController.blockArticle);
router.post('/:id/like', articleController.likeArticle);
router.post('/:id/dislike', articleController.dislikeArticle);

module.exports = router; 