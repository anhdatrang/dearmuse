const Portfolio = require('../models/Portfolio');

const allImages = {
  'ca-nhan': [
    { src: '/source/N%C3%A0ng%20th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.webp', category: 'ca-nhan', alt: 'Chân dung hướng dương', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20003.webp', category: 'ca-nhan', alt: 'Nàng thơ hướng dương', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20001.webp', category: 'ca-nhan', alt: 'Nàng thơ trong trẻo', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.webp', category: 'ca-nhan', alt: 'Chân dung nghệ thuật', album: 'Nàng Thơ' },
    { src: '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207836(1).webp', category: 'ca-nhan', alt: 'Concept nàng thơ', album: 'Concept Nghệ Thuật' },
    { src: '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207938(1).webp', category: 'ca-nhan', alt: 'Chân dung điện ảnh', album: 'Concept Nghệ Thuật' },
    { src: '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6389.webp', category: 'ca-nhan', alt: 'Áo dài truyền thống', album: 'Áo Dài' },
    { src: '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6415.webp', category: 'ca-nhan', alt: 'Áo dài trắng thướt tha', album: 'Áo Dài' },
    { src: '/source/C%C3%81%20NH%C3%82N/PROFILE/IMG_4925.webp', category: 'ca-nhan', alt: 'Profile nghệ thuật', album: 'Profile' },
    { src: '/source/C%C3%81%20NH%C3%82N/PROFILE/IMG_4933.webp', category: 'ca-nhan', alt: 'Chân dung tối giản', album: 'Profile' },
  ],
  'doanh-nghiep': [
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4316.webp', category: 'doanh-nghiep', alt: 'Toạ đàm doanh nghiệp', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8778.webp', category: 'doanh-nghiep', alt: 'Lễ ra mắt sản phẩm', album: 'Doanh Nghiệp Premium' },
  ],
  'mo-rong': [
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4613.webp', category: 'mo-rong', alt: 'Chụp ảnh sản phẩm', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4615.webp', category: 'mo-rong', alt: 'Lookbook thời trang', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4691.webp', category: 'mo-rong', alt: 'Sản phẩm tối giản', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4693.webp', category: 'mo-rong', alt: 'Chi tiết sản phẩm', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4695.webp', category: 'mo-rong', alt: 'Nghệ thuật sắp đặt', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_5582.webp', category: 'mo-rong', alt: 'Mỹ phẩm cao cấp', album: 'Sản Phẩm Thương Mại' },
  ]
};

const allPortfolioImages = [
  ...allImages['ca-nhan'],
  ...allImages['doanh-nghiep'],
  ...allImages['mo-rong'],
];

const groupMetadata = {
  'ca-nhan': {
    id: 'ca-nhan',
    title: 'CÁ NHÂN',
    englishTitle: 'PORTRAIT',
    subtitle: 'Nghệ thuật Chân dung & Độc bản',
    imprintTitle: 'CHÂN DUNG NGHỆ THUẬT',
    introText: 'Bộ sưu tập chân dung nghệ thuật được thiết kế nhằm lột tả chiều sâu tâm hồn và cá tính độc bản của mỗi cá nhân. Ánh sáng tự nhiên kết hợp góc máy đậm chất điện ảnh tạo nên những khung hình trường tồn với thời gian.',
    teaserCategory1: 'doanh-nghiep',
    teaserCategory2: 'mo-rong'
  },
  'doanh-nghiep': {
    id: 'doanh-nghiep',
    title: 'DOANH NGHIỆP',
    englishTitle: 'BUSINESS',
    subtitle: 'Nâng tầm Thương hiệu & Sự kiện',
    imprintTitle: 'DOANH NHÂN & SỰ KIỆN',
    introText: 'Ghi lại những khoảnh khắc đắt giá của các hội nghị cao cấp, lễ ký kết và hình ảnh chân dung doanh nhân chuyên nghiệp. Phong cách chụp hiện đại, chỉnh chu giúp khẳng định vị thế và hình ảnh thương hiệu.',
    teaserCategory1: 'ca-nhan',
    teaserCategory2: 'mo-rong'
  },
  'mo-rong': {
    id: 'mo-rong',
    title: 'MỞ RỘNG',
    englishTitle: 'COMMERCIAL',
    subtitle: 'Sản phẩm & Thời trang Lookbook',
    imprintTitle: 'SẢN PHẨM & LOOKBOOK',
    introText: 'Khám phá ngôn ngữ của các thiết kế thời trang và sản phẩm cao cấp dưới lăng kính nghệ thuật tối giản. Từng chi tiết, chất liệu đều được tôn vinh qua cách sắp đặt ánh sáng và bố cục chuẩn mực.',
    teaserCategory1: 'ca-nhan',
    teaserCategory2: 'doanh-nghiep'
  }
};

const editorialContents = [
  {
    ed1Title: "KỂ CHUYỆN BẰNG", ed1TitleSpan: "Khung Hình",
    ed1SubBanner: "THE LANGUAGE OF VISUAL METAPHORS",
    ed1Para1: "Bộ sưu tập chân dung nghệ thuật được thiết kế nhằm lột tả chiều sâu tâm hồn và cá tính độc bản của mỗi cá nhân. Ánh sáng tự nhiên kết hợp góc máy đậm chất điện ảnh tạo nên những khung hình trường tồn với thời gian.",
    ed1Para2: "Mỗi bức hình là một tác phẩm chứa đựng tâm hồn, ánh sáng chân thực và cảm xúc tự nhiên nguyên bản nhất. Hãy để chúng tôi kể lại câu chuyện của bạn bằng ngôn ngữ của nghệ thuật nhiếp ảnh hiện đại.",
    ed1Side: "Được định vị là biểu tượng của nhiếp ảnh chân dung ý niệm cao cấp, Dear Musé vượt qua giới hạn của những khung hình thông thường để điêu khắc nên những kiệt tác thị giác độc bản. Tại đây, chúng tôi tin rằng mỗi bản thể đều mang một mật mã duy mỹ riêng biệt, xứng đáng có một câu chuyện kể bằng ngôn ngữ của nghệ thuật thị giác.",
    ed1Decor: "Sự hoàn mỹ trong từng điểm ảnh. Nơi tôn vinh đẳng cấp của riêng bạn.",
    ed1DecorTitle: "KIỆT TÁC TRONG TỪNG ĐIỂM ẢNH",
    
    ed2SubBanner: "THE VISIONARY CHOICE",
    ed2Para: "Bằng sự giao thoa tài hoa giữa kỹ nghệ ánh sáng bậc thầy, tư duy tạo bối cảnh độc đáo và nhãn quan sắc sảo, Dear Musé đồng hành cùng bạn trên hành trình đánh thức và lưu giữ khoảnh khắc thăng hoa nhất. Từng thước phim tư liệu tinh tế không chỉ bắt trọn những ‘mảnh sáng’ cảm xúc vô giá, mà còn là lời tri ân gửi đến nàng — phiên bản rực rỡ, kiêu sa và nguyên bản nhất của chính mình.",
    ed2SideBanner: "VẺ ĐẸP TIỀM ẨN",
    ed2SideText: "Nơi những tạo tác nghệ thuật bắt nguồn từ chiều sâu tâm hồn, tôn vinh vị thế và vẻ đẹp độc bản của nàng thơ.",
    
    ed3Title: "NGÔN NGỮ", ed3TitleSpan: "Vẻ Đẹp",
    ed3SubBanner: "ĐIÊU KHẮC CẢM XÚC",
    ed3Para1: "Trong thế giới nhiếp ảnh, trang phục là một thực thể nghệ thuật cộng hưởng cùng biểu cảm của nàng thơ. Sự hòa quyện giữa phom dáng tối giản và các chi tiết cách điệu độc đáo tạo nên một cấu trúc thị giác mạnh mẽ, giúp tôn vinh trọn vẹn những đường nét tự nhiên và thần thái kiêu sa vốn có.",
    ed3Para2: "Từng vệt sáng đổ bóng mềm mại đổ dài lên cơ thể, kết hợp cùng nhãn quan nghệ thuật sắc sảo, tạo nên một thước phim tư liệu tinh tế - nơi lưu giữ trọn vẹn những 'mảnh sáng' thanh xuân rực rỡ nhất của riêng nàng.",
    ed3Side: "Mỗi chi tiết nhỏ trên trang phục đều góp phần kể câu chuyện riêng về phong cách của bạn. Từ cúc áo, đường may đến phụ kiện đi kèm.",
    ed3Decor: "Nơi những tạo tác nghệ thuật bắt nguồn từ chiều sâu tâm hồn.",
    ed3DecorTitle: "THE PORTRAIT STORY",
    
    letterRecipient: "Gửi những Nàng thơ của Dear Musé",
    letterText: "Dear Musé tin rằng chân dung của bạn không đơn thuần là một lát cắt diện mạo, mà là cả một câu chuyện tràn đầy cảm xúc được viết nên bởi chiều sâu vẻ đẹp tiềm ẩn và những trải nghiệm độc bản. Bằng sự giao thoa giữa nhãn quan nghệ thuật sắc sảo, kỹ nghệ điêu khắc ánh sáng bậc thầy và sự thấu cảm sâu sắc, mỗi tác phẩm tại Dear Musé đều là một lời hẹn ước: Giữ lại cho nàng một phiên bản rực rỡ nhất của chính mình.",
    creditsBottomText: "Cảm ơn bạn vì đã lựa chọn đồng hành, sẻ chia, tin tưởng và cho phép Dear Musé được là người lưu giữ những thước phim thanh xuân trường tồn cùng thời gian.",

    creditTitle1: "TRIẾT LÝ SÁNG TẠO",
    creditDesc1: "Dear Musé tin rằng mỗi cá nhân là một tác phẩm nghệ thuật độc bản. Chúng tôi không chỉ ghi lại hình ảnh, mà còn khơi gợi và tôn vinh vẻ đẹp sâu thẳm, thần thái tự nhiên và câu chuyện riêng biệt của bạn qua lăng kính nhiếp ảnh cao cấp.",
    creditTitle2: "DỊCH VỤ NỔI BẬT",
    creditDesc2: "• Chân dung Nghệ thuật & Ý niệm<br>• Chân dung Doanh nhân cao cấp<br>• Lookbook Thời trang & Sản phẩm"
  },
  {
    ed1Title: "VẺ ĐẸP", ed1TitleSpan: "Nguyên Bản",
    ed1SubBanner: "AUTHENTIC BEAUTY & GRACE",
    ed1Para1: "Vẻ đẹp thực sự không nằm ở những lớp trang điểm cầu kỳ, mà tỏa sáng từ sự tự tin và khí chất riêng biệt của mỗi người. Chúng tôi luôn mong muốn nắm bắt trọn vẹn nét duyên dáng độc nhất ấy trong từng cú bấm máy.",
    ed1Para2: "Không cần những kỹ xảo hào nhoáng, sự chân thực trong từng nét mặt và ánh mắt mới là ngôn ngữ mạnh mẽ nhất. Chúng tôi chú trọng vào việc bắt trọn những khoảnh khắc tự nhiên, nơi vẻ đẹp thật sự của bạn được tỏa sáng.",
    ed1Side: "Với triết lý tối giản và tinh tế, Dear Musé luôn tìm kiếm sự hoàn hảo trong những điều giản dị nhất. Đội ngũ của chúng tôi tin rằng, mỗi người đều sở hữu một nét quyến rũ riêng biệt không thể sao chép, và nhiệm vụ của chúng tôi là đánh thức nét quyến rũ ấy trên từng khung hình.",
    ed1Decor: "Vẻ đẹp thực sự đến từ sự tự tin và sự tự nhiên của chính bạn.",
    
    ed2SubBanner: "VẺ ĐẸP TIỀM ẨN TRONG MỌI KHUNG HÌNH",
    ed2Para: "Trong thế giới nhiễu loạn của màu sắc và xu hướng, sự tối giản lại trở thành một bản tuyên ngôn mạnh mẽ về phong cách. Một lớp nền mỏng nhẹ, một chút son nhạt và ánh nhìn chân thật đủ để tạo ra một bức chân dung đầy ám ảnh và sâu lắng.",
    ed2SideBanner: "STUDIO KỂ CHUYỆN BẰNG HÌNH ẢNH",
    ed2SideText: "Chúng tôi ưu tiên sử dụng ánh sáng tự nhiên để tôn vinh làn da và đường nét khuôn mặt. Sự kết hợp giữa ánh sáng mềm mại và bóng đổ khéo léo tạo nên chiều sâu cảm xúc cho bức ảnh.",
    brandQuoteText: "Dành cho nàng phiên bản rực rỡ nhất của chính mình",
    
    ed3Title: "DẤU ẤN", ed3TitleSpan: "Cá Nhân",
    ed3SubBanner: "KHẲNG ĐỊNH CÁ TÍNH",
    ed3Para1: "Đừng ngần ngại phá vỡ những quy tắc thông thường. Thời trang và phong cách cá nhân là cách tuyệt vời nhất để nói lên bạn là ai mà không cần cất lời. Hãy để trang phục là tấm gương phản chiếu nội tâm phong phú của bạn.",
    ed3Para2: "Sự tự tin khi diện lên mình những bộ trang phục yêu thích sẽ toát ra một năng lượng cuốn hút. Một bộ vest sắc sảo hay một chiếc váy lụa bồng bềnh – hãy chọn điều khiến bạn cảm thấy là chính mình nhất.",
    ed3Side: "Cách bạn phối hợp các item tưởng chừng không liên quan lại tạo nên một tổng thể đầy bất ngờ và thú vị.",
    ed3Decor: "Phong cách là tiếng nói không lời của tâm hồn.",
    
    letterRecipient: "Gửi những tâm hồn yêu cái đẹp,",
    letterText: "Chúng tôi hiểu rằng, mỗi lần đứng trước ống kính là một lần bạn dũng cảm đối diện và khám phá một phiên bản khác của bản thân. Hãy xem cuốn tạp chí này như một tấm gương phản chiếu những khoảnh khắc rực rỡ và ý nghĩa nhất trong hành trình trưởng thành của bạn.",
    creditsBottomText: "Nhiếp ảnh không chỉ là lưu giữ hình ảnh, mà là ngưng đọng dòng thời gian. Chúc bạn luôn giữ được nụ cười rạng rỡ và sự tự tin từ bên trong.",

    creditTitle1: "TẦM NHÌN NGHỆ THUẬT",
    creditDesc1: "Với khát vọng đưa nhiếp ảnh chân dung trở thành một trải nghiệm duy mỹ cao cấp, chúng tôi không ngừng tìm tòi những góc máy độc đáo, chất liệu bối cảnh sang trọng cùng kỹ nghệ kiểm soát ánh sáng chuẩn mực.",
    creditTitle2: "DỊCH VỤ ĐẶC TRƯNG",
    creditDesc2: "• Chụp ảnh chân dung Concept Nghệ thuật<br>• Ảnh Profile cá nhân tối giản phong cách ELLE<br>• Chụp ảnh phục vụ truyền thông cá nhân"
  },
  {
    ed1Title: "KHOẢNH KHẮC", ed1TitleSpan: "Trường Tồn",
    ed1SubBanner: "TIMELESS MASTERPIECES",
    ed1Para1: "Nhiếp ảnh là hành trình đi tìm những mảnh ghép cảm xúc chân thật nhất. Mỗi khung hình đều được chăm chút tỉ mỉ từ ánh sáng, bối cảnh cho đến góc chụp để tạo ra một tác phẩm nghệ thuật mang đậm dấu ấn cá nhân.",
    ed1Para2: "Có những bức ảnh chỉ để ngắm nhìn một lần, nhưng cũng có những tác phẩm càng chiêm ngưỡng càng thấy được nhiều tầng ý nghĩa. Chúng tôi hướng tới việc tạo ra những kiệt tác vượt thời gian, nơi cảm xúc được đọng lại mãi mãi.",
    ed1Side: "Studio của chúng tôi được thiết kế như một không gian nghệ thuật khép kín, nơi mọi người có thể rũ bỏ những lo âu thường nhật để thả lỏng và tận hưởng quá trình sáng tạo. Mọi chi tiết từ âm nhạc đến mùi hương đều được tính toán kỹ lượng để khơi nguồn cảm hứng.",
    ed1Decor: "Nghệ thuật không phải là điều gì xa vời, nó hiện diện trong chính câu chuyện của bạn.",
    
    ed2SubBanner: "PHONG THÁI TỰ TIN",
    ed2Para: "Khi bạn không còn e dè trước ống kính, đó là lúc phép màu xuất hiện. Hãy cứ là bạn, tự do thể hiện mọi cung bậc cảm xúc: một nụ cười sảng khoái, một ánh nhìn lơ đãng hay sự suy tư sâu lắng. Chúng tôi sẽ có mặt ở đó để bắt trọn từng khoảnh khắc đắt giá ấy.",
    ed2SideBanner: "CHI TIẾT NHỎ, ẤN TƯỢNG LỚN",
    ed2SideText: "Đôi khi, chỉ một lọn tóc buông lơi hay một cử động khẽ khàng của bàn tay cũng đủ để tạo nên một khung hình đầy chất thơ và sự lãng mạn.",
    
    ed3Title: "NÂNG TẦM", ed3TitleSpan: "Thương Hiệu",
    ed3SubBanner: "CHUYÊN NGHIỆP VÀ ĐẲNG CẤP",
    ed3Para1: "Hình ảnh cá nhân chuyên nghiệp là chìa khóa mở ra nhiều cơ hội mới. Việc đầu tư vào một bộ ảnh profile chất lượng không chỉ thể hiện sự tôn trọng đối tác mà còn phản ánh sự nghiêm túc của bạn đối với sự nghiệp.",
    ed3Para2: "Sự kết hợp hoàn hảo giữa trang phục lịch lãm, bối cảnh sang trọng và ngôn ngữ cơ thể tự tin sẽ giúp bạn ghi điểm tuyệt đối trong mắt mọi người. Một hình ảnh đáng tin cậy là bước đầu tiên để xây dựng thành công.",
    ed3Side: "Để bức ảnh thêm phần sinh động, đừng quên kết hợp với những đạo cụ phù hợp với ngành nghề và chuyên môn của bạn.",
    ed3Decor: "Hình ảnh của bạn là lời giới thiệu uy tín nhất.",
    
    letterRecipient: "Gửi người bạn đồng hành,",
    letterText: "Chúng tôi hy vọng qua những trang giấy này, bạn có thể nhìn lại và tự hào về những gì mình đã đạt được. Dear Musé rất vinh hạnh khi được đồng hành và ghi lại những dấu ấn rực rỡ nhất trong sự nghiệp cũng như cuộc sống của bạn.",
    creditsBottomText: "Những khoảnh khắc huy hoàng sẽ qua đi, nhưng giá trị và cảm xúc thì luôn còn mãi qua những bức ảnh. Tiếp tục tỏa sáng nhé!",

    creditTitle1: "CAM KẾT CHẤT LƯỢNG",
    creditDesc1: "Mỗi tác phẩm tại Dear Musé đều được hoàn thiện tỉ mỉ qua quy trình xử lý hậu kỳ chuẩn Art. Từ chi tiết nhỏ nhất trên trang phục, mái tóc đến tone màu tổng thể đều được cân chỉnh để đạt độ hoàn hảo và giữ được nét tự nhiên nguyên bản.",
    creditTitle2: "CÁC DỊCH VỤ CAO CẤP",
    creditDesc2: "• Gói chụp ảnh kỷ niệm doanh nghiệp premium<br>• Ảnh bìa tạp chí & chụp ảnh PR sự kiện<br>• Dịch vụ makeup và phục trang thiết kế riêng"
  },
  {
    ed1Title: "KHÔNG GIAN", ed1TitleSpan: "Cảm Xúc",
    ed1SubBanner: "THE ART OF CINEMATIC PORTRAITURE",
    ed1Para1: "Mỗi bức ảnh là một thước phim ngắn, nơi ánh sáng và bóng tối kể về những chương sâu lắng nhất trong cuộc đời bạn. Chúng tôi tìm kiếm sự kết nối tinh tế giữa nội tâm và ống kính.",
    ed1Para2: "Với ngôn ngữ hình ảnh giàu tính tự sự, mỗi góc máy đều được tính toán để tôn vinh sự trầm ấm, lắng đọng và chiều sâu trong phong thái của nhân vật.",
    ed1Side: "Không gian chụp được thiết kế tối giản, tập trung hoàn toàn vào việc khơi gợi những nét biểu cảm chân thật và dung dị nhất của bạn.",
    ed1Decor: "Nơi thời gian ngưng đọng và nghệ thuật bắt đầu.",
    ed1DecorTitle: "CINEMATIC ESSENCE",
    
    ed2SubBanner: "ÁNH SÁNG VÀ CHIỀU SÂU",
    ed2Para: "Sự tương phản nhẹ nhàng giữa vùng sáng và vùng tối tạo nên một chiều không gian đầy tính duy mỹ. Đôi khi chỉ một ánh mắt nhìn nghiêng hay cái ngoảnh đầu khẽ khàng cũng đủ vẽ nên bức họa chân dung đầy suy tư.",
    ed2SideBanner: "THẦN THÁI ĐỘC BẢN",
    ed2SideText: "Chúng tôi tôn trọng và nâng niu nét cá tính khác biệt của bạn. Không đi theo những khuôn mẫu rập khuôn, mỗi tác phẩm là một phiên bản duy nhất.",
    brandQuoteText: "Tôn vinh khí chất riêng biệt của chính bạn",
    
    ed3Title: "NÉT ĐẸP", ed3TitleSpan: "Thời Gian",
    ed3SubBanner: "LƯU GIỮ THANH XUÂN",
    ed3Para1: "Thanh xuân là món quà vô giá của thời gian. Một bộ ảnh chân dung nghệ thuật sẽ là cuốn nhật ký bằng hình ảnh giúp bạn lưu giữ lại những năm tháng rực rỡ nhất.",
    ed3Para2: "Sự kết hợp giữa phong cách cổ điển và hơi thở hiện đại mang lại giá trị nghệ thuật bền vững, không lỗi mốt theo thời gian.",
    ed3Side: "Từng chi tiết từ chất liệu ảnh đến tone màu đều được xử lý thủ công tỉ mỉ để đạt độ hoàn mỹ cao nhất.",
    ed3Decor: "Lưu giữ những khoảnh khắc quý giá nhất của cuộc đời.",
    ed3DecorTitle: "TIMELESS PORTRAIT",
    
    letterRecipient: "Gửi những tâm hồn đồng điệu,",
    letterText: "Dear Musé hy vọng rằng khi lật mở những trang tạp chí này, bạn sẽ tìm thấy một góc nhìn mới mẻ và đầy tự hào về chính mình. Chúc bạn luôn giữ được sự nhiệt huyết, đam mê và tỏa sáng rực rỡ trên con đường mình đã chọn.",
    creditsBottomText: "Mỗi tác phẩm là một lời tri ân sâu sắc gửi đến bạn vì đã cho phép chúng tôi lưu giữ khoảnh khắc này.",

    creditTitle1: "PHONG CÁCH ĐIỆN ẢNH",
    creditDesc1: "Chúng tôi theo đuổi trường phái nhiếp ảnh điện ảnh (Cinematic Portrait), nơi mỗi bức ảnh đều mang một sắc thái điện ảnh sâu lắng, có chiều sâu của bóng tối và sự rực rỡ của ánh sáng để kể câu chuyện trọn vẹn của bạn.",
    creditTitle2: "MẢNG DỊCH VỤ NỔI BẬT",
    creditDesc2: "• Chân dung điện ảnh nghệ thuật (Cinematic)<br>• Ảnh ngoại cảnh nghệ thuật & street style<br>• Lookbook thời trang & sản phẩm cao cấp"
  },
  {
    ed1Title: "NĂNG LƯỢNG", ed1TitleSpan: "Tối Giản",
    ed1SubBanner: "MINIMALISM & MODERN ELEGANCE",
    ed1Para1: "Tối giản không phải là thiếu thốn, mà là sự chắt lọc tinh tế nhất để tôn vinh những giá trị cốt lõi. Chúng tôi lược bỏ những chi tiết rườm rà để tập trung hoàn toàn vào thần thái của bạn.",
    ed1Para2: "Đường nét thanh lịch, bố cục gọn gàng và tone màu trung tính tạo nên một tổng thể sang trọng, hiện đại và vô cùng đẳng cấp.",
    ed1Side: "Chúng tôi tin rằng sự đơn giản là đỉnh cao của sự tinh tế. Hãy để bản thân bạn là điểm nhấn duy nhất và nổi bật nhất trong khung hình.",
    ed1Decor: "Sự tinh tế đến từ những điều giản đơn nhất.",
    ed1DecorTitle: "MINIMAL MASTERPIECE",
    
    ed2SubBanner: "GU THẨM MỸ TINH TẾ",
    ed2Para: "Phong cách tối giản đòi hỏi một tư duy thẩm mỹ cao và sự nhạy cảm với không gian. Từng đường nét, trang phục và ánh sáng phải hòa quyện để tạo nên sự cân bằng hoàn hảo nhất.",
    ed2SideBanner: "TƯ DUY KHÁC BIỆT",
    ed2SideText: "Đột phá khỏi những lối mòn cũ kỹ, chúng tôi mang đến góc nhìn thời thượng, khẳng định gu thẩm mỹ khác biệt và đẳng cấp của bạn.",
    brandQuoteText: "Khẳng định đẳng cấp qua sự tối giản",
    
    ed3Title: "KHÔNG GIAN", ed3TitleSpan: "Tự Do",
    ed3SubBanner: "BẢN TUYÊN NGÔN CÁ NHÂN",
    ed3Para1: "Đừng ngần ngại thể hiện cái tôi nghệ thuật của bạn. Mỗi bức ảnh là một bản tuyên ngôn tự tin về phong cách sống và cá tính độc lập.",
    ed3Para2: "Hãy tự do bay bổng, tự do thể hiện và tự do là chính mình trước ống kính nghệ thuật của Dear Musé.",
    ed3Side: "Chúng tôi tạo ra một không gian tự do tối đa để bạn thỏa sức sáng tạo và bộc lộ cảm xúc.",
    ed3Decor: "Hãy tự do tỏa sáng theo cách của riêng bạn.",
    ed3DecorTitle: "THE CREATIVE SOUL",
    
    letterRecipient: "Gửi những người bạn yêu tự do,",
    letterText: "Cảm ơn bạn đã mang đến nguồn cảm hứng bất tận cho đội ngũ Dear Musé. Hy vọng những khung hình này sẽ tiếp thêm năng lượng tích cực và sự tự tin để bạn luôn kiêu hãnh bước đi trên hành trình độc bản của mình.",
    creditsBottomText: "Tự do và tối giản chính là chiếc chìa khóa mở ra vẻ đẹp trường tồn.",

    creditTitle1: "XU HƯỚNG TỐI GIẢN",
    creditDesc1: "Giữa thế giới nhiễu loạn, Dear Musé tin rằng sự tối giản (Minimalism) là tuyên ngôn mạnh mẽ nhất. Bằng cách tập trung hoàn toàn vào biểu cảm và thần thái của nhân vật trên nền phông trơn trung tính, chúng tôi tạo nên những tác phẩm không bao giờ lỗi thời.",
    creditTitle2: "DỊCH VỤ TỐI GIẢN",
    creditDesc2: "• Chân dung tối giản phông trơn cao cấp<br>• Ảnh Profile doanh nhân chuẩn quốc tế<br>• Chụp ảnh sản phẩm decor phong cách Bắc Âu"
  }
];

exports.index = async (req, res) => {
  const category = req.query.category || 'all';

  // Decide which groups to render
  let activeGroups = [];
  if (category === 'all') {
    activeGroups = ['ca-nhan', 'doanh-nghiep', 'mo-rong'];
  } else if (allImages[category]) {
    activeGroups = [category];
  } else {
    return res.redirect('/portfolio');
  }

  // Construct structured data for view
  const magazineGroups = activeGroups.map(catKey => {
    return {
      ...groupMetadata[catKey],
      images: allImages[catKey].map(img => ({
        ...img,
        src: `/cdn/image?w=800&src=${encodeURIComponent(img.src)}`
      }))
    };
  });

  let catLabel = 'Tất cả';
  if (category === 'ca-nhan') catLabel = 'Cá Nhân';
  else if (category === 'doanh-nghiep') catLabel = 'Doanh Nghiệp';
  else if (category === 'mo-rong') catLabel = 'Mở Rộng';

  res.render('portfolio', {
    title: `Portfolio ${catLabel} — Dear Musé`,
    metaDescription: `Khám phá các tác phẩm nhiếp ảnh nghệ thuật nổi bật thuộc danh mục ${catLabel} của Dear Musé Studio. Lưu giữ trọn vẹn những khoảnh khắc và cảm xúc độc bản.`,
    images: category === 'all' ? allPortfolioImages : allImages[category],
    magazineGroups,
    allImages,
    activeCategory: category,
    editorialContents,
  });
};

exports.detail = async (req, res) => {
  try {
    const portfolio = await Portfolio.findBySlug(req.params.slug);
    if (!portfolio) return res.redirect('/portfolio');

    const descText = portfolio.description
      ? portfolio.description.replace(/<[^>]*>/g, '').substring(0, 155) + '...'
      : `Xem chi tiết bộ ảnh nghệ thuật "${portfolio.title}" được thực hiện bởi Dear Musé Studio.`;

    res.render('portfolio-detail', {
      title: `${portfolio.title} — Tác Phẩm Nghệ Thuật — Dear Musé`,
      metaDescription: descText,
      ogImage: portfolio.cover_image || '',
      portfolio,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/portfolio');
  }
};
