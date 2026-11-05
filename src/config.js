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
  // Video YouTube chiếu dưới bảng tỉ số. Để trống = không chiếu.
  youtubeId: '27GHT7nAF8A',
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
