const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Khách hàng không nên vào trang login/register nếu đã login
const redirectIfLoggedIn = (req, res, next) => {
  if (req.session.userId) {
    return res.redirect('/customer/my-albums');
  }
  next();
};

router.get('/login', redirectIfLoggedIn, authController.getLogin);
router.post('/login', redirectIfLoggedIn, authController.postLogin);

router.get('/register', redirectIfLoggedIn, authController.getRegister);
router.post('/register', redirectIfLoggedIn, authController.postRegister);

router.get('/logout', authController.logout);

module.exports = router;
