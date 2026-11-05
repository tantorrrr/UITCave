# Hang Chung (hangchung.top)

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
| Xabi Alonso | DONOSTIA KULTURA | CC BY-SA 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Los_Caminos_del_f%C3%BAtbol._Xabi_Alonso_(39666778464)_(cropped).jpg) |
| Sami Hyypiä | Дмитрий Неймырок/Dmitry Neymyrok/Dmitrij Nejmyrok | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sami_Hyypia_2012_(cropped).jpg) |
| Pepe Reina | Кирилл Венедиктов | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Pepe_Reina_2017.jpg) |
| Dirk Kuyt | User:Zafer | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Dirk_Kuyt_Fenerbah%C3%A7e_20261103_(2).JPG) |
| Jordan Henderson | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Jordan_Henderson_England_v_Ghana_23_June_2026-029_(cropped).jpg) |
| Roberto Firmino | Granada | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Roberto_Firmino_850_1557.jpg) |
| Sadio Mané | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sadio_Mane_France_v_Senegal_16_June_2026-450.jpg) |
| Alisson Becker | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Alisson_Becker_Brazil_V_Morocco_13_June_2026-117_(cropped).jpg) |
| Trent Alexander-Arnold | Антон Зайцев | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Trent_Alexander-Arnold_2018_(cropped).jpg) |
| Andy Robertson | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Andy_Robertson_Scotland_v_Bolivia_6_June_2026-43.jpg) |
| Ruud van Nistelrooy | Ardfern | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Ruud_van_Nistelrooy_2017.jpg) |
| Roy Keane | Irish Defence Forces from Ireland | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Roy_keane_2014.jpg) |
| Gary Neville | University of Salford Press Office | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Gary_Neville_2014_(cropped).jpg) |
| Nemanja Vidić | user:Biso | CC BY 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Vidi%C4%87_(cropped).jpg) |
| Patrice Evra | Web Summit | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Patrice_Evra_(52472689279)_(cropped).jpg) |
| Edwin van der Sar | Web Summit | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Edwin_van_der_Sar_2015.jpg) |
| Park Ji-sung | Korea.net / Korean Culture and Information Service | CC BY-SA 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Park_Ji-sung_G20_Seoul_Summit_Ambassador_(cropped).jpg) |
| Bruno Fernandes | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Bruno_Fernandes_USMNT_v_Portugal_Mar_31_2026-27_(cropped).jpg) |
| David de Gea | Кирилл Венедиктов | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:David_de_Gea_2017.jpg) |
| Darren Fletcher | @cfcunofficial (Chelsea Debs) London | CC BY-SA 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Darren_Fletcher_2017_(cropped).jpg) |
| Pablo Zabaleta | --Steindy (talk) 16:00, 29 August 2019 (UTC) | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Hertha_BSC_vs._West_Ham_United_20190731_(127).jpg) |
| Raheem Sterling | Антон Зайцев | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Raheem_Sterling_2018.jpg) |
| Rodri | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Rodri_Argentina_v_Spain_19_July_2026-187_(cropped).jpg) |
| Phil Foden | Steffen Prößdorf | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:2023-10-04_Fu%C3%9Fball,_M%C3%A4nner,_UEFA_Champions_League,_RB_Leipzig_-_Manchester_City_FC_1DX_2613,_Phil_Foden.jpg) |
| Joe Hart | Голубович Дмитрий | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Joe_Hart_69775.jpg) |
| Bernardo Silva | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Bernardo_Silva_Croatia_v_Portugal_2_July_2026-238.jpg) |
| Carlos Tevez | Egghead06 | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Carlos_Tevez_with_Argentina_November_2014_(cropped).jpg) |
| Rúben Dias | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Ruben_Dias_Croatia_v_Portugal_2_July_2026-228_(cropped).jpg) |
| Ashley Cole | Stanislav Vedmid | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:ACole.JPG) |
| Michael Essien | @cfcunofficial (Chelsea Debs) London from London, UK | CC BY-SA 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Chelsea_Legends_1_Inter_Forever_4_(28453496098)_(cropped).jpg) |
| Claude Makélélé | Web Summit Qatar | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Claude_Mak%C3%A9l%C3%A9l%C3%A9_(53557564951)_(cropped).jpg) |
| Arjen Robben | Sven Mandel | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:2019147183036_2019-05-27_Fussball_1.FC_Kaiserslautern_vs_FC_Bayern_M%C3%BCnchen_-_Sven_-_1D_X_MK_II_-_0196_-_B70I8495_(cropped).jpg) |
| César Azpilicueta | محمد امین انصاری | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:C%C3%A9sar_Azpilicueta,_Al_Hilal_SFC_vs_Chelsea_F.C.,_9_February_2022.jpg) |
| Branislav Ivanović | Darren Walsch | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Branislav_Ivanovi%C4%87_FC_Chelsea_Captain.jpg) |
| Diego Costa | Mahdi Zare/Fars News Agency | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Iran_and_Spain_match_at_the_FIFA_World_Cup_23.jpg) |
| Thiago Silva | Granada | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Thiago_Silva_850_1582.jpg) |
| Reece James | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Reece_James_England_v_Ghana_23_June_2026-248_(cropped).jpg) |
| Cole Palmer | The White House | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Cole_Palmer_2025_FIFA_Club_World_Cup_Final.jpg) |
| Robin van Persie | Елена Рыбакова | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Loco-Fener_(10).jpg) |
| Cesc Fàbregas | Web Summit | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:2023_-_Cesc_Fabregas_(cropped).jpg) |
| Jens Lehmann | Sven Mandel | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Jens_Lehmann_-_2019202184453_2019-07-21_Champions_for_Charity_-_3017_-_B70I3052_(cropped).jpg) |
| Freddie Ljungberg | Ludovic Péron | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Football_against_poverty_2014_-_Fredrik_Ljungberg.jpg) |
| Santi Cazorla | Ronnie Macdonald | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Santi_Cazorla,_2012-08-18_(cropped).jpg) |
| Mesut Özil | Amir Hosseini | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Mesut_%C3%96zil_at_Baku_before_2019_UEFA_Europe_League_Final.jpg) |
| Martin Ødegaard | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Martin_Odegaard_France_v_Norway_26_June_26-014.jpg) |
| Declan Rice | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Declan_Rice_England_v_Ghana_23_June_2026-150.jpg) |
| William Saliba | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:William_Saliba_France_v_Paraguay_4_July_2026-183.jpg) |
| Gabriel Martinelli | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Gabriel_Martinelli_Brazil_V_Morocco_13_June_2026-144.jpg) |
| Lionel Messi | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg) |
| Andrés Iniesta | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Andr%C3%A9s_Iniesta_Argentina_v_Spain_19_July_2026-034_(cropped).jpg) |
| Carles Puyol | Pedro J Pacheco | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Premios_Goya_2020_-_Carles_Pujol.jpg) |
| Ronaldinho | Marcos Corrêa/PR | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Ronaldinho_in_2019.jpg) |
| Sergio Busquets | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sergio_Busquets_NYCFC_Miami_24_Sep_2025-020_(cropped).jpg) |
| Gerard Piqué | Дмитрий Неймырок | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Gerard_Piqu%C3%A9_Euro_2012_vs_France_01.jpg) |
| Víctor Valdés | Own work | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:V%C3%ADctor_Vald%C3%A9s_(2010).jpg) |
| Samuel Eto'o | BACHELOR45 | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sammuel_Eto'o_Fils_02.jpg) |
| Neymar | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Neymar_Junior_Brazil_V_Morocco_13_June_2026-40.jpg) |
| Robert Lewandowski | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Robert_Lewandowski_NYCFC_v_Chicago_25_July_2026-383.jpg) |
| Pedri | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Pedri_France_v_Spain_7.24.26-245.jpg) |
| Lamine Yamal | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Lamine_Yamal_France_v_Spain_7.24.26-142.jpg) |
| Raúl | Barcex | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:25th_Laureus_World_Sports_Awards_-_Ra%C3%BAl_-_240422_132916-2_(cropped).jpg) |
| Iker Casillas | Web Summit | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Iker-Casillas-SportsTrade-2021-cropped.jpg) |
| Sergio Ramos | Real Madrid | CC BY 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sergio_Ramos_Interview_2021_(cropped).jpg) |
| Zinedine Zidane | Hadi Abyar | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Zinedine_Zidane_by_Tasnim_03.jpg) |
| Roberto Carlos | Web Summit | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:LS3_1288_(53332367864)_(cropped).jpg) |
| Luka Modrić | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Luka_Modric_Croatia_v_Portugal_2_July_2026-055.jpg) |
| Toni Kroos | https://www.youtube.com/@realmadrid | CC BY 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Toni_Kroos_Real_Madrid_2021.jpg) |
| Karim Benzema | Chris Deahr | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Karim_Benzema_vs._FC_Schalke_04_(16647992937).jpg) |
| Marcelo | Fotografías Archimadrid.es | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Marcelo_Vieira_in_2022.jpg) |
| Gareth Bale | حسین ظهروند | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:2022_FIFA_World_Cup_United_States_1%E2%80%931_Wales_-_(32)_(cropped).jpg) |
| Vinícius Júnior | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Vin%C3%ADcius_J%C3%BAnior_Brazil_V_Morocco_13_June_2026-207_(cropped).jpg) |
| Jude Bellingham | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Jude_Bellingham_England_v_Ghana_23_June_2026-061_(cropped).jpg) |
| Kylian Mbappé | Bryan Berlin | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Kylian_Mbappe_France_v_Senegal_16_June_2026-391_(cropped).jpg) |
| Luís Figo | Žan Kolman | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Luis_Figo_2023.jpg) |
| David Beckham | Soccer Aid for Unicef | CC BY 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:David_Beckham_UNICEF_(cropped2).jpg) |
