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

// Lịch thi đấu sắp tới trên bảng lớn trong hang. Lấy từ API công khai (không chính thức) của ESPN, mã đội theo ESPN.
export const FIXTURE_TEAMS = [
  { espnId: 364, name: 'Liverpool' },
  { espnId: 382, name: 'Man City' },
  { espnId: 360, name: 'Man Utd' },
  { espnId: 363, name: 'Chelsea' },
  { espnId: 359, name: 'Arsenal' },
];

// Chân dung treo tường. Có ảnh thì đặt vào public/images/legends/ và điền `img`.
// Tranh vẽ cách điệu (màu CLB + số áo), không dùng ảnh chụp để tránh vướng bản quyền.
export const CLUBS = {
  liverpool: { name: 'Liverpool', colors: ['#c8102e', '#5e0715'], accent: '#f6eb61' },
  manutd: { name: 'Man Utd', colors: ['#da291c', '#4a0a05'], accent: '#fbe122' },
  mancity: { name: 'Man City', colors: ['#6cabdd', '#1c2c5b'], accent: '#ffffff' },
  chelsea: { name: 'Chelsea', colors: ['#034694', '#011d40'], accent: '#dba111' },
  arsenal: { name: 'Arsenal', colors: ['#ef0107', '#5c0002'], accent: '#ffffff' },
};

// Huyền thoại từ những năm 2000 tới gần đây; số áo là số gắn liền với họ ở CLB đó.
export const LEGENDS = [
  { name: 'Steven Gerrard', club: 'liverpool', number: 8, years: '1998–2015' },
  { name: 'Jamie Carragher', club: 'liverpool', number: 23, years: '1996–2013' },
  { name: 'Fernando Torres', club: 'liverpool', number: 9, years: '2007–2011' },
  { name: 'Luis Suárez', club: 'liverpool', number: 7, years: '2011–2014' },
  { name: 'Mohamed Salah', club: 'liverpool', number: 11, years: 'từ 2017' },
  { name: 'Virgil van Dijk', club: 'liverpool', number: 4, years: 'từ 2018' },
  { name: 'Cristiano Ronaldo', club: 'manutd', number: 7, years: '2003–2009' },
  { name: 'Wayne Rooney', club: 'manutd', number: 10, years: '2004–2017' },
  { name: 'Paul Scholes', club: 'manutd', number: 18, years: '1994–2013' },
  { name: 'Ryan Giggs', club: 'manutd', number: 11, years: '1991–2014' },
  { name: 'Rio Ferdinand', club: 'manutd', number: 5, years: '2002–2014' },
  { name: 'Michael Carrick', club: 'manutd', number: 16, years: '2006–2018' },
  { name: 'Sergio Agüero', club: 'mancity', number: 10, years: '2011–2021' },
  { name: 'Vincent Kompany', club: 'mancity', number: 4, years: '2008–2019' },
  { name: 'David Silva', club: 'mancity', number: 21, years: '2010–2020' },
  { name: 'Yaya Touré', club: 'mancity', number: 42, years: '2010–2018' },
  { name: 'Kevin De Bruyne', club: 'mancity', number: 17, years: '2015–2025' },
  { name: 'Erling Haaland', club: 'mancity', number: 9, years: 'từ 2022' },
  { name: 'Frank Lampard', club: 'chelsea', number: 8, years: '2001–2014' },
  { name: 'John Terry', club: 'chelsea', number: 26, years: '1998–2017' },
  { name: 'Didier Drogba', club: 'chelsea', number: 11, years: '2004–2015' },
  { name: 'Petr Čech', club: 'chelsea', number: 1, years: '2004–2015' },
  { name: 'Eden Hazard', club: 'chelsea', number: 10, years: '2012–2019' },
  { name: "N'Golo Kanté", club: 'chelsea', number: 7, years: '2016–2023' },
  { name: 'Thierry Henry', club: 'arsenal', number: 14, years: '1999–2012' },
  { name: 'Dennis Bergkamp', club: 'arsenal', number: 10, years: '1995–2006' },
  { name: 'Patrick Vieira', club: 'arsenal', number: 4, years: '1996–2005' },
  { name: 'Robert Pirès', club: 'arsenal', number: 7, years: '2000–2006' },
  { name: 'Sol Campbell', club: 'arsenal', number: 23, years: '2001–2010' },
  { name: 'Bukayo Saka', club: 'arsenal', number: 7, years: 'từ 2018' },
];
