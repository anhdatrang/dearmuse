const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');

exports.show = (req, res) => {
  res.render('contact', {
    title: 'Liên Hệ — Dear Musé',
    errors: [],
    oldInput: {},
    sent: false,
  });
};

exports.submit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('contact', {
      title: 'Liên Hệ — Dear Musé',
      errors: errors.array(),
      oldInput: req.body,
      sent: false,
    });
  }

  try {
    await Contact.create(req.body);
    res.render('contact', {
      title: 'Liên Hệ — Dear Musé',
      errors: [],
      oldInput: {},
      sent: true,
    });
  } catch (err) {
    console.error(err);
    res.render('contact', {
      title: 'Liên Hệ — Dear Musé',
      errors: [{ msg: 'Có lỗi xảy ra, vui lòng thử lại.' }],
      oldInput: req.body,
      sent: false,
    });
  }
};
