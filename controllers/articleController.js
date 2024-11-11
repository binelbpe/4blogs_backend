const Article = require('../models/articleModel');
const fs = require('fs');
const path = require('path');
const { ERROR_MESSAGES } = require('../constants/validation');
const { UPLOAD_CONFIG } = require('../constants/upload');

const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

exports.createArticle = async (req, res, next) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received file:', req.file);

    if (!req.file) {
      return res.status(400).json('Image is required')
    }

    if (!req.body.title || !req.body.description || !req.body.category) {
      return res.status(400).json( 'Title, description, and category are required')
    }

    const articleData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      image: `/uploads/${req.file.filename}`,
      author: req.user._id,
      tags: req.body.tags ? JSON.parse(req.body.tags) : []
    };

    console.log('Creating article with data:', articleData);

    const article = await Article.create(articleData);
    return res.status(201).json({success:true,data:{article},message:'Article created successfully'} )
  } catch (error) {
    console.error('Error creating article:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
    return res.status(400).json({message:error.message})
  }
};

exports.getArticles = async (req, res) => {
  try {
    const articles = await Article.find({ deleted: false })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserArticles = async (req, res) => {
  try {
    const articles = await Article.find({ 
      author: req.user._id,
      deleted: false 
    }).sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getArticleByUserAndId = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      deleted: false
    }).populate('author', 'firstName lastName');
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    } 
    res.json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      deleted: false
    }).populate('author', 'firstName lastName');
    
    if (!article) {
      return res.status(404).json({ message: ERROR_MESSAGES.ARTICLE.NOT_FOUND });
    }
    if (req.user && article.blocks.includes(req.user._id)) {
      return res.status(403).json({ message: ERROR_MESSAGES.ARTICLE.BLOCKED });
    }
    
    res.json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

  
    if (req.body.removeImage === 'true') {
      if (article.image) {
        await deleteFile(article.image);
        article.image = null;
      }
    } else if (req.file) {
      if (article.image) {
        await deleteFile(article.image);
      }
      article.image = `/uploads/${req.file.filename}`;
    }


    if (req.body.title) article.title = req.body.title;
    if (req.body.description) article.description = req.body.description;
    if (req.body.category) article.category = req.body.category;
 
    if (req.body.tags) {
      try {
        article.tags = JSON.parse(req.body.tags);
      } catch (error) {
        console.error('Error parsing tags:', error);
        article.tags = [];
      }
    }

    await article.save();
    res.json(article);
  } catch (error) {
    console.error('Error updating article:', error);
    if (req.file) {
      await deleteFile(`/uploads/${req.file.filename}`);
    }
    res.status(400).json({ message: error.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.id,
      author: req.user._id
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    article.deleted = true;
    await article.save();

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.blockArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
  

    const blockIndex = article.blocks.indexOf(req.user._id);
    if (blockIndex > -1) {
      article.blocks.splice(blockIndex, 1);
    } else {
      article.blocks.push(req.user._id);
    }

    await article.save();
    res.json(article);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.likeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const dislikeIndex = article.dislikes.indexOf(req.user._id);
    if (dislikeIndex > -1) {
      article.dislikes.splice(dislikeIndex, 1);
    }

 
    const likeIndex = article.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      article.likes.splice(likeIndex, 1); 
    } else {
      article.likes.push(req.user._id); 
    }

    await article.save();
    res.json({
      likes: article.likes.length,
      dislikes: article.dislikes.length,
      isLiked: article.likes.includes(req.user._id),
      isDisliked: article.dislikes.includes(req.user._id)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.dislikeArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const likeIndex = article.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      article.likes.splice(likeIndex, 1);
    }

    const dislikeIndex = article.dislikes.indexOf(req.user._id);
    if (dislikeIndex > -1) {
      article.dislikes.splice(dislikeIndex, 1); 
    } else {
      article.dislikes.push(req.user._id); 
    }

    await article.save();
    res.json({
      likes: article.likes.length,
      dislikes: article.dislikes.length,
      isLiked: article.likes.includes(req.user._id),
      isDisliked: article.dislikes.includes(req.user._id)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 