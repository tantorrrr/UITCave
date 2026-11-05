# Hang Uit

Sân chơi 3D nhiều người chơi trên trình duyệt: vào hang, đi lại, chat, đấm nhau, ăn mừng, bình chọn.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173 (web) + server 8787
```

Bản chạy thật (một cổng duy nhất, mặc định 8787 hoặc biến `PORT`):

```bash
npm run build
npm start
```

## Đưa lên mạng miễn phí (Render)

1. Đẩy thư mục này lên một repo GitHub.
2. Vào https://dashboard.render.com → **New** → **Blueprint** → chọn repo. Render đọc `render.yaml` và tạo web service gói Free.
3. Chờ build xong, mở link `https://<tên>.onrender.com`.

Gói Free: không cần thẻ; server ngủ sau 15 phút không có ai trong hang, người vào đầu tiên phải chờ khoảng 1 phút để server thức dậy.
Client tự gửi tín hiệu mỗi 30 giây nên server không ngủ khi còn người ở trong hang.

## Đổi nội dung

Mọi chữ, màu áo, câu hỏi vào hang, câu bình chọn, tỉ số, video YouTube và tên chân dung nằm ở `src/config.js`.
Ảnh chân dung: đặt vào `public/images/legends/` rồi điền `img: '/images/legends/ten.jpg'`.

## Cấu trúc

- `src/landing.js` — màn chào 3D, hộp nhập tên, câu hỏi vui.
- `src/cave.js` — trong hang: cảnh, HUD, điều khiển, đồng bộ người chơi.
- `src/avatar.js` — nhân vật, áo có số.
- `src/scenery.js` — đá low-poly, lửa trại, đuốc.
- `server/index.js` — HTTP + WebSocket (`/ws`), `/api/stats`.

Server giữ mọi thứ trong bộ nhớ: khởi động lại là mất chat và kết quả bình chọn.
