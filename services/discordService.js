async function sendToDiscord(webhookUrl, payload) {
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Discord Webhook failed with status ${response.status}`);
    }
  } catch (err) {
    console.error('Error sending Discord Webhook:', err.message);
  }
}

exports.notifyBooking = async (booking, serviceName) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    content: "🎉 **CÓ LỊCH ĐẶT CHỤP MỚI!**",
    embeds: [
      {
        title: "Thông tin chi tiết",
        color: 0x28a745, // Green
        fields: [
          { name: "Khách hàng", value: booking.customer_name || "N/A", inline: true },
          { name: "Số điện thoại", value: booking.customer_phone || "N/A", inline: true },
          { name: "Email", value: booking.customer_email || "N/A", inline: false },
          { name: "Dịch vụ", value: serviceName || "Không xác định", inline: true },
          { name: "Ngày đặt", value: booking.booking_date || "N/A", inline: true },
          { name: "Ghi chú", value: booking.notes || "Không có", inline: false },
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  await sendToDiscord(webhookUrl, payload);
};

exports.notifyContact = async (contact) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    content: "💬 **CÓ LIÊN HỆ MỚI!**",
    embeds: [
      {
        title: "Thông tin chi tiết",
        color: 0x17a2b8, // Blue
        fields: [
          { name: "Khách hàng", value: contact.name || "N/A", inline: true },
          { name: "Số điện thoại", value: contact.phone || "N/A", inline: true },
          { name: "Email", value: contact.email || "N/A", inline: false },
          { name: "Tiêu đề", value: contact.subject || "N/A", inline: false },
          { name: "Nội dung", value: contact.message || "N/A", inline: false },
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  await sendToDiscord(webhookUrl, payload);
};

exports.notifyNewUser = async (user) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = {
    content: "👤 **CÓ TÀI KHOẢN ĐĂNG KÝ MỚI!**",
    embeds: [
      {
        title: "Thông tin chi tiết",
        color: 0xffc107, // Yellow
        fields: [
          { name: "Khách hàng", value: user.name || "N/A", inline: true },
          { name: "Email", value: user.email || "N/A", inline: true },
          { name: "Số điện thoại", value: user.phone || "N/A", inline: true },
        ],
        timestamp: new Date().toISOString()
      }
    ]
  };

  await sendToDiscord(webhookUrl, payload);
};
