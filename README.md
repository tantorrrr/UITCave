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

## Ghi công ảnh chân dung

Ảnh lấy từ Wikimedia Commons, giấy phép tự do (CC BY / CC BY-SA / CC0). Ảnh đã được thu nhỏ và cắt khung để làm tranh trong hang; tên tác giả và giấy phép cũng in ngay trên từng tranh.

| Cầu thủ | Tác giả | Giấy phép | Nguồn |
|---|---|---|---|
| Steven Gerrard | Эдгар Брещанов | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Steven_Gerrard_2018.jpg) |
| Jamie Carragher | Ludovic Péron | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Football_against_poverty_2014_-_Jamie_Carragher_(cropped).jpg) |
| Fernando Torres | cristina cifuentes | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Fernando_Torres_2017.jpg) |
| Luis Suárez | Какая то женщина | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Luis_Su%C3%A1rez_2018.jpg) |
| Mohamed Salah | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Mohamed_Salah_Argentina_v_Egypt_7_July_2026-163_(cropped).jpg) |
| Virgil van Dijk | Ailura | CC BY-SA 3.0 at | [Commons](https://commons.wikimedia.org/wiki/File:20160604_AUT_NED_8876_(cropped).jpg) |
| Cristiano Ronaldo | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_(cropped).jpg) |
| Wayne Rooney | All-Pro Reels from District of Columbia, USA | CC BY-SA 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Wayne_Rooney_(50121495731)_(cropped).jpg) |
| Paul Scholes | James Adams | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:P_Scholes.jpg) |
| Ryan Giggs | Дмитрий Голубович | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Ryan_Giggs_2015_(cropped).jpg) |
| Rio Ferdinand | Web Summit | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Web_Summit_2015_-_Dublin,_Ireland_-_22183056474_(cropped).jpg) |
| Michael Carrick | Timmy96 | CC0 | [Commons](https://commons.wikimedia.org/wiki/File:Michael_Carrick_12042025_(5)_(cropped).jpg) |
| Sergio Agüero | Кирилл Венедиктов | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Ag%C3%BCero_in_2018.jpg) |
| Vincent Kompany | ManuluxWiki | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Vincent_Kompany_Bayern_Munich_(cropped).jpg) |
| David Silva | Кирилл Венедиктов | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:David_Silva_2017.jpg) |
| Yaya Touré | Puma | CC BY 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Yaya_Tour%C3%A9_(cropped).jpg) |
| Kevin De Bruyne | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Kevin_De_Bruyne_USMNT_v_Belgium_Mar_28_2026-64_(cropped).jpg) |
| Erling Haaland | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Erling_Haaland_Morocco_v_Norway_7_June_2026-51.jpg) |
| Frank Lampard | Mehdi Bolourian | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Frank_Lampard_2019.jpg) |
| John Terry | ChristopherJClarke | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:John_Terry_at_pro-am_Wentworth_golf_course_September_2023_(cropped).jpg) |
| Didier Drogba | Y.Leclercq© | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Didier_Drogba_(2019)_(cropped2).jpg) |
| Petr Čech | Amir Hosseini | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Arsenal_players_training_before_2019_UEFA_Europa_League_final_07_(cropped).jpg) |
| Eden Hazard | Amir Hosseini | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Eden_Hazard_at_Baku_before_2019_UEFA_Europe_League_Final.jpg) |
| N'Golo Kanté | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:N'Golo_Kante_France_v_Senegal_16_June_2026-397.jpg) |
| Thierry Henry | Web Summit | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Thierry_Henry_(51649035951)_(cropped).jpg) |
| Dennis Bergkamp | Kieran Clarke | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Dennis_Bergkamp_2014_(cropped).jpg) |
| Patrick Vieira | Simon Heseltine | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Patrick_Vieira_NYCFC_(cropped).JPG) |
| Robert Pirès | Doha Stadium Plus Qatar | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Robert_Pires_2011.jpg) |
| Sol Campbell | Web Summit | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sol_Campbell_(54921202604)_(cropped).jpg) |
| Bukayo Saka | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Bukayo_Saka_England_v_Ghana_23_June_2026-057_(cropped).jpg) |
