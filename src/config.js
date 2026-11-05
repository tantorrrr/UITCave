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
  // Đã kiểm cho nhúng ngày 2026-11-05. Phần lớn highlight trận của Man Utd bị chặn nhúng.
  youtubeIds: [
    // Liverpool FC
    '6Pn5qnuCVg8', // Highlights: Liverpool 1-1 Chelsea | Reds win on penalties! (1.6M)
    'hn3fpfByQCc', // Extended Highlights: Liverpool 1-1 Chelsea (1.2M)
    'XwZmyMvOtyw', // Liverpool vs Chelsea | Full penalty shootout (989K)
    'BORuDyEx8zI', // Extended Highlights: Brentford 1-2 Liverpool (849K)
    'iSPDVKdWoJU', // Highlights: Liverpool 4-3 Villarreal (710K)
    // Man City
    'hgIaOCoVsDQ', // HIGHLIGHTS | Man City 5-3 Sunderland (3.7M)
    'VihHixlyZiM', // Man City 5-0 Norwich | Highlights (3.5M)
    'i_BqweuiZhg', // HIGHLIGHTS | Liverpool 0-3 Man City (3.4M)
    'SEtYQhJAMTA', // HIGHLIGHTS | Porto 0-2 Man City (3.1M)
    'dVFiXhUKXmI', // EXTENDED HIGHLIGHTS | Man City 5-3 Sunderland (2.6M)
    // Chelsea
    'mL-qGgJf6Ug', // Chelsea 5-1 Bournemouth | HIGHLIGHTS (3.5M)
    '06dvvp2ORLM', // Chelsea 5-1 Bournemouth | HIGHLIGHTS - Extended (2M)
    'OI58_-4ezU8', // Chelsea 2-0 Man Utd | HIGHLIGHTS (1.7M)
    'xt7v2R-ap_c', // Everton 0-2 Chelsea | HIGHLIGHTS (1.1M)
    // Arsenal
    'e3WsysMfn0Q', // HIGHLIGHTS | Arsenal vs Lille (3-0) (1.3M)
    'Zt1VugPdwFw', // HIGHLIGHTS | Liverpool vs Arsenal (0-1) (1.2M)
    'dx7x6C5-diY', // Bayern Munich vs Arsenal (2-2) | Champions League (1.2M)
    // Manchester United
    'ncVXv8kAOaA', // Michael Carrick's Powerful Statement | Press Conference (333K)
    'dTCA1UfrKkY', // Chelsea 2-0 Man Utd | Extended Highlights (287K)
    '1ByXkUgYQls', // Charging Up For Chelsea! | Inside Training (187K)
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
