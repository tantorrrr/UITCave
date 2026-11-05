// Mọi thứ mang tính "thương hiệu" nằm ở đây để đổi nhanh.
export const BRAND = {
  name: 'Hang Chung',
  signTop: 'DI TÍCH LỊCH SỬ',
  signMain: 'HANG CHUNG',
  badge: 'HC', // chữ trong huy hiệu tròn trên biển di tích
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

// Kích thước trong hang dùng chung cho client (src/cave.js) và server (server/index.js).
export const ARENA = {
  caveRadius: 21, // người chơi và bóng không ra khỏi vòng này
  fireRadius: 1.4, // đống lửa ở giữa
  screenZ: -17, // mặt màn hình lớn (phía -z)
  screenHalfW: 9.6, // nửa bề ngang khung màn hình
  walkSpeed: 5,
  knockSpeed: 9, // tốc độ bật lùi lúc bị đấm
};

// Quả bóng chung trong hang (server quyết định vị trí). enabled: false để tắt hẳn.
export const BALL = {
  enabled: true,
  radius: 0.35,
  start: { x: 0, z: 9 }, // gần chỗ người chơi xuất hiện
  friction: 1.1, // càng lớn bóng càng nhanh dừng
  dribbleSpeed: 4.5, // chạm vào bóng khi đi
  kickSpeed: 15, // bấm sút
  kickRange: 2.2,
  // Hai khung thành ở hai bên trái/phải (±x); vạch vôi ở |x| = goalLineX.
  goalLineX: 16.2,
  goalHalfWidth: 2.2,
  goalDepth: 1.6,
  goalHeight: 2.3,
  idleResetMs: 25000, // không ai chạm thì bóng tự về chỗ cũ
};

export const POLL = {
  question: 'Hôm nay đội nhà sẽ thắng, hoà hay thua?',
  options: ['Thắng 💪', 'Hoà 🤝', 'Thua 😢'],
};

// Bảng tin lớn trong hang.
export const SCOREBOARD = {
  // Video YouTube chiếu dưới bảng lịch thi đấu, phát ngẫu nhiên lần lượt. Để mảng rỗng = không chiếu.
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
    // FC Barcelona
    'ggebrRRq1Fg', // MATCH PREVIEW: PSG vs FC BARCELONA (2.8M)
    'UJpuIXIJAHM', // FC BARCELONA 6 vs 1 ALAVÉS | LALIGA (2.3M)
    'QIGNqxmBcIQ', // FC BARCELONA 1 vs 2 REAL MADRID | LALIGA (1.5M)
    '_LpzkLDdR6U', // HIGHLIGHTS | PSG 4 vs 2 FC BARCELONA (1.2M)
    'CXk8Er7Yf9w', // HIGHLIGHTS | FC BARCELONA 3 vs 0 ASTON VILLA (168K)
    // Real Madrid
    'T5B3ZVTvrhM', // HIGHLIGHTS | FC Barcelona 1-2 Real Madrid (5.3M)
    'zkgpyvjJl84', // HIGHLIGHTS | Roma 3-4 Real Madrid (3.2M)
    'SbGF1xglHh4', // HIGHLIGHTS | Real Madrid 4-1 RB Leipzig (1.7M)
    'I1yeLaFydjM', // HIGHLIGHTS | Real Madrid 4-1 Sevilla (1.5M)
    '6_lF0UJ00KM', // MBAPPÉ'S 100 GOALS! ALL HIS GOALS FOR REAL MADRID (1.2M)
  ],
};

// Nhạc cổ động viên phát ngẫu nhiên (âm thanh qua trình phát YouTube nhúng, không tải file nhạc).
// Đã kiểm cho nhúng ngày 2026-11-05; bài bị chặn nhúng sẽ tự bị bỏ qua.
export const FAN_SONGS = [
  { id: 'OV5_LQArLa0', club: 'liverpool', title: "You'll Never Walk Alone" },
  { id: 'HVmbMWUhEaw', club: 'liverpool', title: "You'll Never Walk Alone · Anfield" },
  { id: '9eWERM6QSys', club: 'liverpool', title: "You'll Never Walk Alone · The Kop" },
  { id: 'x00uRZoTiC0', club: 'mancity', title: 'Blue Moon & Boys in Blue' },
  { id: 'eRiDc2MetII', club: 'mancity', title: 'Blue Moon · Etihad' },
  { id: 'a1nDYrCxeig', club: 'manutd', title: 'Glory Glory Man United' },
  { id: 'JuRD8gSdmps', club: 'manutd', title: 'Glory Glory Manchester United' },
  { id: 'V02OibHkdCE', club: 'chelsea', title: 'Blue Is the Colour' },
  { id: '6tAaKqKUy20', club: 'chelsea', title: 'Blue Is the Colour · Munich 2012' },
  { id: '5gU277dBf8I', club: 'arsenal', title: 'The Angel (North London Forever)' },
  { id: 'QCPQpq83MKc', club: 'arsenal', title: 'North London Forever · Emirates' },
  { id: '9JdugskAcS0', club: 'barcelona', title: 'Cant del Barça' },
  { id: 'Yc-7IQqcqeM', club: 'realmadrid', title: 'Hala Madrid... y nada más' },
  { id: 'deCvdd2J5Qs', club: 'realmadrid', title: 'Hala Madrid... y nada más · Bernabéu' },
];

// Lịch thi đấu sắp tới trên bảng lớn trong hang. Lấy từ API công khai (không chính thức) của ESPN, mã đội theo ESPN.
export const FIXTURE_TEAMS = [
  { espnId: 364, name: 'Liverpool', club: 'liverpool' },
  { espnId: 382, name: 'Man City', club: 'mancity' },
  { espnId: 360, name: 'Man Utd', club: 'manutd' },
  { espnId: 363, name: 'Chelsea', club: 'chelsea' },
  { espnId: 359, name: 'Arsenal', club: 'arsenal' },
  { espnId: 83, name: 'Barcelona', club: 'barcelona' },
  { espnId: 86, name: 'Real Madrid', club: 'realmadrid' },
];

// CLB: màu tranh chân dung (colors/accent) và áo đấu nhân vật (kit).
// Áo đấu chỉ là màu truyền thống + nét đặc trưng (sọc Barca, tay áo trắng Arsenal…), không logo/nhà tài trợ.
// Ảnh thật cho tranh (giấy phép tự do từ Wikimedia) nằm ở src/legendPhotos.js.
export const CLUBS = {
  liverpool: {
    name: 'Liverpool', colors: ['#c8102e', '#5e0715'], accent: '#f6eb61',
    kit: { body: '#c8102e', sleeve: '#c8102e', trim: '#ffffff', shorts: '#c8102e', number: '#ffffff' },
  },
  manutd: {
    name: 'Man Utd', colors: ['#da291c', '#4a0a05'], accent: '#fbe122',
    kit: { body: '#da291c', sleeve: '#da291c', trim: '#111111', shorts: '#ffffff', number: '#ffffff' },
  },
  mancity: {
    name: 'Man City', colors: ['#6cabdd', '#1c2c5b'], accent: '#ffffff',
    kit: { body: '#6cabdd', sleeve: '#6cabdd', trim: '#ffffff', shorts: '#ffffff', number: '#1c2c5b' },
  },
  chelsea: {
    name: 'Chelsea', colors: ['#034694', '#011d40'], accent: '#dba111',
    kit: { body: '#034694', sleeve: '#034694', trim: '#ffffff', shorts: '#034694', number: '#ffffff' },
  },
  arsenal: {
    name: 'Arsenal', colors: ['#ef0107', '#5c0002'], accent: '#ffffff',
    kit: { body: '#ef0107', sleeve: '#ffffff', trim: '#ffffff', shorts: '#ffffff', number: '#ffffff' },
  },
  barcelona: {
    name: 'Barcelona', colors: ['#004d98', '#a50044'], accent: '#edbb00',
    kit: { body: '#004d98', stripe: '#a50044', sleeve: '#a50044', trim: '#edbb00', shorts: '#004d98', number: '#edbb00' },
  },
  realmadrid: {
    name: 'Real Madrid', colors: ['#e9ecf2', '#1c2c5b'], accent: '#febe10',
    kit: { body: '#f7f7f7', sleeve: '#f7f7f7', trim: '#febe10', shorts: '#f7f7f7', number: '#1c2c5b' },
  },
};
// Thứ tự hiện trong hộp chọn CLB khi vào hang.
export const CLUB_ORDER = ['liverpool', 'manutd', 'mancity', 'chelsea', 'arsenal', 'barcelona', 'realmadrid'];

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
  // Nhóm luân phiên: tranh trên vách tự đổi sang các cầu thủ này theo thời gian.
  { name: 'Xabi Alonso', club: 'liverpool', number: 14, years: '2004–2009' },
  { name: 'Sami Hyypiä', club: 'liverpool', number: 4, years: '1999–2009' },
  { name: 'Pepe Reina', club: 'liverpool', number: 25, years: '2005–2014' },
  { name: 'Dirk Kuyt', club: 'liverpool', number: 18, years: '2006–2012' },
  { name: 'Jordan Henderson', club: 'liverpool', number: 14, years: '2011–2023' },
  { name: 'Roberto Firmino', club: 'liverpool', number: 9, years: '2015–2023' },
  { name: 'Sadio Mané', club: 'liverpool', number: 10, years: '2016–2022' },
  { name: 'Alisson Becker', club: 'liverpool', number: 1, years: 'từ 2018' },
  { name: 'Trent Alexander-Arnold', club: 'liverpool', number: 66, years: '2016–2025' },
  { name: 'Andy Robertson', club: 'liverpool', number: 26, years: 'từ 2017' },
  { name: 'Ruud van Nistelrooy', club: 'manutd', number: 10, years: '2001–2006' },
  { name: 'Roy Keane', club: 'manutd', number: 16, years: '1993–2005' },
  { name: 'Gary Neville', club: 'manutd', number: 2, years: '1992–2011' },
  { name: 'Nemanja Vidić', club: 'manutd', number: 15, years: '2006–2014' },
  { name: 'Patrice Evra', club: 'manutd', number: 3, years: '2006–2014' },
  { name: 'Edwin van der Sar', club: 'manutd', number: 1, years: '2005–2011' },
  { name: 'Park Ji-sung', club: 'manutd', number: 13, years: '2005–2012' },
  { name: 'Bruno Fernandes', club: 'manutd', number: 8, years: 'từ 2020' },
  { name: 'David de Gea', club: 'manutd', number: 1, years: '2011–2023' },
  { name: 'Darren Fletcher', club: 'manutd', number: 24, years: '2003–2015' },
  { name: 'Pablo Zabaleta', club: 'mancity', number: 5, years: '2008–2017' },
  { name: 'Raheem Sterling', club: 'mancity', number: 7, years: '2015–2022' },
  { name: 'Rodri', club: 'mancity', number: 16, years: 'từ 2019' },
  { name: 'Phil Foden', club: 'mancity', number: 47, years: 'từ 2017' },
  { name: 'Joe Hart', club: 'mancity', number: 1, years: '2006–2018' },
  { name: 'Bernardo Silva', club: 'mancity', number: 20, years: 'từ 2017' },
  { name: 'Carlos Tevez', club: 'mancity', number: 32, years: '2009–2013' },
  { name: 'Rúben Dias', club: 'mancity', number: 3, years: 'từ 2020' },
  { name: 'Ashley Cole', club: 'chelsea', number: 3, years: '2006–2014' },
  { name: 'Michael Essien', club: 'chelsea', number: 5, years: '2005–2014' },
  { name: 'Claude Makélélé', club: 'chelsea', number: 4, years: '2003–2008' },
  { name: 'Arjen Robben', club: 'chelsea', number: 16, years: '2004–2007' },
  { name: 'César Azpilicueta', club: 'chelsea', number: 28, years: '2012–2023' },
  { name: 'Branislav Ivanović', club: 'chelsea', number: 2, years: '2008–2017' },
  { name: 'Diego Costa', club: 'chelsea', number: 19, years: '2014–2017' },
  { name: 'Thiago Silva', club: 'chelsea', number: 6, years: '2020–2024' },
  { name: 'Reece James', club: 'chelsea', number: 24, years: 'từ 2018' },
  { name: 'Cole Palmer', club: 'chelsea', number: 20, years: 'từ 2023' },
  { name: 'Robin van Persie', club: 'arsenal', number: 10, years: '2004–2012' },
  { name: 'Cesc Fàbregas', club: 'arsenal', number: 4, years: '2003–2011' },
  { name: 'Jens Lehmann', club: 'arsenal', number: 1, years: '2003–2008' },
  { name: 'Freddie Ljungberg', club: 'arsenal', number: 8, years: '1998–2007' },
  { name: 'Santi Cazorla', club: 'arsenal', number: 19, years: '2012–2018' },
  { name: 'Mesut Özil', club: 'arsenal', number: 11, years: '2013–2021' },
  { name: 'Martin Ødegaard', club: 'arsenal', number: 8, years: 'từ 2021' },
  { name: 'Declan Rice', club: 'arsenal', number: 41, years: 'từ 2023' },
  { name: 'William Saliba', club: 'arsenal', number: 2, years: 'từ 2019' },
  { name: 'Gabriel Martinelli', club: 'arsenal', number: 11, years: 'từ 2019' },
  { name: 'Lionel Messi', club: 'barcelona', number: 10, years: '2004–2021' },
  { name: 'Andrés Iniesta', club: 'barcelona', number: 8, years: '2002–2018' },
  { name: 'Carles Puyol', club: 'barcelona', number: 5, years: '1999–2014' },
  { name: 'Ronaldinho', club: 'barcelona', number: 10, years: '2003–2008' },
  { name: 'Sergio Busquets', club: 'barcelona', number: 5, years: '2008–2023' },
  { name: 'Gerard Piqué', club: 'barcelona', number: 3, years: '2008–2022' },
  { name: 'Víctor Valdés', club: 'barcelona', number: 1, years: '2002–2014' },
  { name: "Samuel Eto'o", club: 'barcelona', number: 9, years: '2004–2009' },
  { name: 'Neymar', club: 'barcelona', number: 11, years: '2013–2017' },
  { name: 'Robert Lewandowski', club: 'barcelona', number: 9, years: 'từ 2022' },
  { name: 'Pedri', club: 'barcelona', number: 8, years: 'từ 2020' },
  { name: 'Lamine Yamal', club: 'barcelona', number: 10, years: 'từ 2023' },
  { name: 'Raúl', club: 'realmadrid', number: 7, years: '1994–2010' },
  { name: 'Iker Casillas', club: 'realmadrid', number: 1, years: '1999–2015' },
  { name: 'Sergio Ramos', club: 'realmadrid', number: 4, years: '2005–2021' },
  { name: 'Zinedine Zidane', club: 'realmadrid', number: 5, years: '2001–2006' },
  { name: 'Roberto Carlos', club: 'realmadrid', number: 3, years: '1996–2007' },
  { name: 'Luka Modrić', club: 'realmadrid', number: 10, years: '2012–2025' },
  { name: 'Toni Kroos', club: 'realmadrid', number: 8, years: '2014–2024' },
  { name: 'Karim Benzema', club: 'realmadrid', number: 9, years: '2009–2023' },
  { name: 'Marcelo', club: 'realmadrid', number: 12, years: '2007–2022' },
  { name: 'Gareth Bale', club: 'realmadrid', number: 11, years: '2013–2022' },
  { name: 'Vinícius Júnior', club: 'realmadrid', number: 7, years: 'từ 2018' },
  { name: 'Jude Bellingham', club: 'realmadrid', number: 5, years: 'từ 2023' },
  { name: 'Kylian Mbappé', club: 'realmadrid', number: 10, years: 'từ 2024' },
  { name: 'Luís Figo', club: 'realmadrid', number: 10, years: '2000–2005' },
  { name: 'David Beckham', club: 'realmadrid', number: 23, years: '2003–2007' },
];

// Số tranh treo cùng lúc trên vách; phần còn lại của LEGENDS thay phiên.
export const POSTER_SLOTS = 30;
export const POSTER_SWAP_MS = 6000; // cứ ~6 giây một tranh đổi sang cầu thủ khác cùng CLB
