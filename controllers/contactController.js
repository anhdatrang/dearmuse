const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');

exports.show = (req, res) => {
  res.render('contact', {
    title: 'Liên Hệ Tư Vấn & Đặt Lịch — Dear Musé',
    metaDescription: 'Liên hệ với Dear Musé Studio tại Hà Nội. Gửi tin nhắn chia sẻ ý tưởng, thắc mắc về các gói chụp chân dung nghệ thuật, sự kiện và thương hiệu để được hỗ trợ nhanh nhất trong vòng 24 giờ.',
    errors: [],
    oldInput: {},
    sent: false,
  });
};

exports.submit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('contact', {
      title: 'Liên Hệ Tư Vấn & Đặt Lịch — Dear Musé',
      metaDescription: 'Liên hệ với Dear Musé Studio tại Hà Nội. Gửi tin nhắn chia sẻ ý tưởng, thắc mắc về các gói chụp chân dung nghệ thuật, sự kiện và thương hiệu để được hỗ trợ nhanh nhất trong vòng 24 giờ.',
      errors: errors.array(),
      oldInput: req.body,
      sent: false,
    });
  }

  try {
    await Contact.create(req.body);
    res.render('contact', {
      title: 'Liên Hệ Tư Vấn & Đặt Lịch — Dear Musé',
      metaDescription: 'Liên hệ với Dear Musé Studio tại Hà Nội. Gửi tin nhắn chia sẻ ý tưởng, thắc mắc về các gói chụp chân dung nghệ thuật, sự kiện và thương hiệu để được hỗ trợ nhanh nhất trong vòng 24 giờ.',
      errors: [],
      oldInput: {},
      sent: true,
    });
  } catch (err) {
    console.error(err);
    res.render('contact', {
      title: 'Liên Hệ Tư Vấn & Đặt Lịch — Dear Musé',
      metaDescription: 'Liên hệ với Dear Musé Studio tại Hà Nội. Gửi tin nhắn chia sẻ ý tưởng, thắc mắc về các gói chụp chân dung nghệ thuật, sự kiện và thương hiệu để được hỗ trợ nhanh nhất trong vòng 24 giờ.',
      errors: [{ msg: 'Có lỗi xảy ra, vui lòng thử lại.' }],
      oldInput: req.body,
      sent: false,
    });
  }
};
