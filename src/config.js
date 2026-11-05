// Mọi thứ mang tính "thương hiệu" nằm ở đây để đổi nhanh.
export const BRAND = {
  name: 'Hang Uit',
  signTop: 'DI TÍCH LỊCH SỬ',
  signMain: 'HANG UIT',
  tagline: 'Nơi anh em trú sau mỗi lần thua, và cùng ra hang khi thắng.',
  disclaimer: 'Trang do người hâm mộ tự làm, phi thương mại.',
  roomName: 'Hang chung',
  // Màu áo đấu của nhân vật và áo treo ở cửa hang.
  jersey: { body: '#1e4fd8', trim: '#f2c230', number: '#ffffff' },
};

// Câu hỏi vui trước khi vào hang. `answer` là vị trí đáp án đúng (0-based).
export const QUIZ = [
  {
    q: 'Anh em vào hang khi nào?',
    options: ['Sau mỗi trận thua', 'Khi trời mưa', 'Khi đói bụng', 'Không bao giờ'],
    answer: 0,
  },
  {
    q: 'Giữa hang có gì để anh em ngồi quanh?',
    options: ['Hồ bơi', 'Đống lửa', 'Cây thông', 'Máy bán nước'],
    answer: 1,
  },
  {
    q: 'Muốn ăn mừng trong hang thì bấm phím gì?',
    options: ['F', 'H', 'G', 'M'],
    answer: 2,
  },
];

export const POLL = {
  question: 'Hôm nay đội nhà sẽ thắng, hoà hay thua?',
  options: ['Thắng 💪', 'Hoà 🤝', 'Thua 😢'],
};

// Bảng tin lớn trong hang.
export const SCOREBOARD = {
  home: 'NHÀ',
  away: 'KHÁCH',
  score: '0 - 0',
  note: 'Vào đây giao lưu võ thuật 👊',
  // Video YouTube chiếu dưới bảng tỉ số, phát ngẫu nhiên lần lượt. Để mảng rỗng = không chiếu.
  // Chỉ dùng video của kênh chính thức có cho nhúng (video chặn nhúng sẽ tự bị bỏ qua).
  youtubeIds: [
    '6Pn5qnuCVg8', // Highlights: Liverpool 1-1 Chelsea | Reds win on penalties!
    'hn3fpfByQCc', // Extended Highlights: Liverpool 1-1 Chelsea | Penalty shootout win!
    'XwZmyMvOtyw', // Liverpool vs Chelsea | Full penalty shootout | 6-5 | Carabao Cup
    'BORuDyEx8zI', // Extended Highlights: Brentford 1-2 Liverpool | Late Reds comeback!
    'iSPDVKdWoJU', // Highlights: Liverpool 4-3 Villarreal | Champions League comeback win!
    'oQ801H0LOT8', // Extended Highlights: Liverpool 2-0 Brighton
    '0GVEp6T5JIo', // Inside Anfield: Liverpool vs Chelsea
    'r9UcOBrPqPo', // Top 10: BEST Liverpool vs Arsenal Premier League games at Anfield
    'U9t2xbnyGOY', // Diogo Jota: Every Goal | Liverpool FC
  ],
};

// Chân dung treo tường. Có ảnh thì đặt vào public/images/legends/ và điền `img`.
export const LEGENDS = [
  { name: 'Huyền thoại 1' },
  { name: 'Huyền thoại 2' },
  { name: 'Huyền thoại 3' },
  { name: 'Huyền thoại 4' },
  { name: 'Huyền thoại 5' },
  { name: 'Huyền thoại 6' },
  { name: 'Huyền thoại 7' },
  { name: 'Huyền thoại 8' },
];
