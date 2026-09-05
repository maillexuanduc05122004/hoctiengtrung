# Mỗi Ngày 中文

Ứng dụng web học từ vựng **HSK 3.0 cấp 1 đến cấp 3** dành cho người Việt. Toàn bộ 2.245 từ
được chia sẵn thành **224 buổi học khoảng 10 từ**, học bằng bốn cách: lật thẻ, gõ đáp án,
nghe chép và luyện nói.

Không cần đăng nhập, không có backend. Tiến độ nằm trên máy người học (IndexedDB) và ứng dụng
dùng được khi ngoại tuyến sau lần tải đầu tiên.

## Cài đặt và chạy

Cần Node.js 20 trở lên.

```bash
npm install
npm run dev        # chạy ở http://localhost:5173
```

Các lệnh khác:

```bash
npm run build      # kiểm tra kiểu rồi đóng gói vào dist/
npm run preview    # xem thử bản đã đóng gói
npm run lint       # ESLint
npm run test       # Vitest
```

Kho đã kèm sẵn dữ liệu đã chuẩn hoá trong `public/data/`, nên chỉ cần `npm install` là chạy
được ngay, không phải tải gì thêm.

### Dựng lại dữ liệu từ nguồn gốc

```bash
npm run data:fetch       # tải hsk30.csv (đã ghim commit) và CC-CEDICT vào scripts/.cache/
npm run data:syllables   # sinh lại kho âm tiết pinyin từ CC-CEDICT
npm run data:tasks       # chia danh sách từ thành các tệp công việc chú giải
npm run data:import      # ghép mọi nguồn rồi ghi public/data/*.json
npm run data:verify      # kiểm tra bộ dữ liệu vừa sinh
npm run assets:icons     # sinh lại biểu tượng PWA
```

`scripts/.cache/` không được commit. Phần chú giải tiếng Việt nằm trong
`scripts/annotations/out/` và **có** được commit, nên `npm run data:import` cho ra kết quả
giống hệt nhau ở mọi máy.

## Nguồn dữ liệu và giấy phép

| Nguồn | Dùng cho | Giấy phép | Phiên bản đã ghim |
| --- | --- | --- | --- |
| [ivankra/hsk30](https://github.com/ivankra/hsk30) | Danh sách từ HSK 3.0, chữ phồn thể, pinyin chính thức, từ loại, cấp độ | MIT | commit `4ff9e3915ce87baaecd7ebe263085573a4ea3192` |
| [CC-CEDICT (MDBG)](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) | Nghĩa tiếng Anh, pinyin tách âm tiết, cách đọc từng chữ | CC BY-SA 4.0 | bản phát hành ghi trong `public/data/manifest.json` |
| [pinyin-pro](https://github.com/zh-lx/pinyin-pro) | Sinh pinyin cho câu ví dụ theo ngữ cảnh (chỉ chạy lúc nhập dữ liệu) | MIT | xem `package.json` |

Chi tiết đầy đủ nằm ở trang **Nguồn dữ liệu** trong ứng dụng và trong
`public/data/manifest.json`.

### Điều cần nói rõ về dữ liệu

- Đây là danh sách **HSK 3.0 công bố năm 2021**. Không phải "HSK 2026".
- Số từ: HSK 1 có 500 từ, HSK 2 có 772 từ, HSK 3 có 973 từ, tổng cộng 2.245 từ.
- **Nghĩa tiếng Việt và câu ví dụ là bản dịch máy, chưa qua kiểm duyệt của người bản ngữ.**
  Mỗi từ đều mang `translationStatus: "machine"` và ứng dụng nói rõ điều này ở trang Nguồn
  dữ liệu. Trường này chuyển thành `"reviewed"` khi có người kiểm duyệt thật.
- Nghĩa tiếng Anh lấy từ CC-CEDICT, được chọn lại theo đúng từ loại của từng mục từ (CC-CEDICT
  gộp mọi nghĩa của một chữ vào chung một mục, nên nếu lấy máy móc thì 白 dạng phó từ sẽ nhận
  nhầm nghĩa "white" thay vì "uổng công").
- Pinyin của câu ví dụ được sinh bằng pinyin-pro rồi đối chiếu lại với cách đọc mà CC-CEDICT
  ghi nhận cho từng chữ; những chỗ lệch được in ra khi chạy `npm run data:import`.

## Chức năng đã làm

### Bốn chế độ luyện tập

1. **Lật thẻ** — mặt trước là chữ Hán cỡ lớn; mặt sau có pinyin, nghĩa Việt, nghĩa Anh, từ
   loại và một câu ví dụ kèm pinyin, bản dịch. Có nút nghe, nghe chậm, ba mức tự đánh giá
   (chưa nhớ / gần nhớ / đã nhớ) và nút tra từ. Vuốt trái phải trên điện thoại, và vẫn có
   đủ nút bấm cho người dùng bàn phím.
2. **Gõ đáp án** — bốn dạng đề (nghĩa Việt → chữ Hán hoặc pinyin, nghĩa Anh → chữ Hán hoặc
   pinyin, chữ Hán → pinyin, pinyin → nghĩa). Thanh trợ giúp nằm ngay trên ô nhập. Chấm ba
   mức đúng / gần đúng / chưa đúng và chỉ rõ ký tự hoặc âm tiết nào sai. Enter để kiểm tra,
   Enter lần nữa để sang câu kế.
3. **Nghe chép** — ẩn chữ Hán, chỉ có nút phát. Trả lời bằng chữ Hán, pinyin hoặc chọn nghĩa.
   Có nghe lại, phát chậm, nghe từng âm tiết, hé dần pinyin, xem nghĩa, xem đáp án.
4. **Luyện nói** — nghe mẫu rồi đọc lại, dùng Web Speech Recognition với `zh-CN`.

### Học tập và tiến độ

- Thuật toán lặp lại ngắt quãng **FSRS 4.5** (`src/lib/srs/fsrs.ts`), có ghi rõ công thức và
  lý do trong chú thích.
- Lưu trên máy: từ đã học, số lần đúng sai, lỗi gần nhất, ngày cần ôn, mức ghi nhớ, chế độ
  hay sai, từ đã đánh dấu, chuỗi ngày học thật.
- Trang chủ: số từ cần ôn hôm nay, mục tiêu ngày, nút học tiếp, tiến độ từng cấp HSK, những
  từ hay sai, lịch sử bảy ngày gần nhất.
- **Người dùng mới bắt đầu từ trạng thái trống hoàn toàn.** Không có dữ liệu mẫu.

### Buổi học

Mỗi cấp được chia thành các buổi khoảng 10 từ: HSK 1 có 50 buổi, HSK 2 có 77 buổi, HSK 3 có
97 buổi. Mỗi buổi vào thẳng được cả bốn chế độ luyện tập.

### Tra từ

Tìm theo chữ Hán, pinyin có hoặc không dấu thanh, tiếng Việt có hoặc không dấu, và tiếng Anh.
Mở được ngay giữa lúc làm bài dưới dạng bottom sheet, có nút nghe và nút chèn vào ô nhập.

### Trải nghiệm

Giao diện tiếng Việt; chọn cách hiển thị Việt+Trung, Anh+Trung hoặc Việt+Anh+Trung; ẩn pinyin;
hiện thêm chữ phồn thể; chế độ tối (không dùng đen tuyệt đối); vùng chạm tối thiểu 2,75rem;
điều hướng bàn phím; aria-label cho nút chỉ có biểu tượng; tôn trọng `prefers-reduced-motion`;
không tự phát âm thanh; không xin quyền micro trước khi người dùng bấm nút luyện nói.

## Giới hạn của Web Speech API

Phần luyện nói dùng Web Speech API có sẵn của trình duyệt. Cần nói rõ:

- **Không có điểm phát âm.** `SpeechRecognition` chỉ trả về văn bản nó nghe được. Ứng dụng chỉ
  so văn bản đó với đáp án để biết máy có nghe ra đúng từ hay không. Đây **không phải** điểm
  thanh điệu hay điểm phát âm chuyên sâu, và ứng dụng không bịa ra con số nào.
- **Hỗ trợ không đồng đều.** Chạy tốt trên Chrome, Edge và Safari; Firefox mặc định chưa hỗ trợ.
  Khi không hỗ trợ, trang vẫn cho nghe mẫu và cho người học tự đánh giá, không bị lỗi.
- **Thường cần mạng.** Nhiều trình duyệt gửi âm thanh lên máy chủ của hãng để nhận dạng, nên
  phần này có thể không chạy khi ngoại tuyến, dù các phần còn lại vẫn chạy.
- **Cần quyền micro**, và chỉ hỏi khi người dùng bấm nút.
- **Từ đơn âm dễ bị nhận nhầm** vì thiếu ngữ cảnh; máy có thể trả về từ đồng âm khác chữ.
- Phần đọc mẫu (`speechSynthesis`) phụ thuộc giọng cài trên máy. Nếu thiết bị không có giọng
  tiếng Trung, ứng dụng báo rõ và hướng dẫn cài thêm gói giọng nói của hệ điều hành.

`src/lib/speech/pronunciation.ts` có sẵn `PronunciationProvider` để sau này nối một dịch vụ
chấm phát âm thật (ví dụ Azure Pronunciation Assessment) **qua backend riêng**. Không có và
không được đặt API key trong frontend.

## Cấu trúc mã nguồn

```text
src/
  components/      thành phần dùng chung và khung ứng dụng
    ui/            nút, bottom sheet, thanh tiến độ, biểu tượng
    providers/     cài đặt và dữ liệu từ vựng
  features/
    flashcards/    lật thẻ
    typing/        gõ đáp án
    listening/     nghe chép
    speaking/      luyện nói
    dictionary/    tra từ
    progress/      tiến độ
    lessons/       buổi học
    shared/        thành phần trình bày dùng chung
  hooks/           state của ứng dụng và bộ máy phiên học
  lib/
    answer-matcher/  chấm đáp án
    pinyin/          đọc và chuẩn hoá pinyin
    speech/          bọc Web Speech API
    srs/             thuật toán FSRS
    text/            chuẩn hoá tiếng Việt
    vocabulary/      nạp và tra cứu từ vựng
  pages/           các trang gắn với đường dẫn
  db/              Dexie và IndexedDB
  types/           kiểu dữ liệu dùng chung
  styles/          Tailwind và bảng màu
public/
  data/            dữ liệu từ vựng đã chuẩn hoá
scripts/
  import-hsk.ts    nhập dữ liệu
  verify-data.ts   kiểm tra dữ liệu
```

Ba thuật toán cốt lõi — chấm đáp án, FSRS và lớp bọc giọng nói — **không phụ thuộc React** và
được kiểm thử riêng.

## Quy ước giao diện

- Điện thoại dùng tiền tố `xsm:` (tối đa `40rem`); máy tính là mặc định, không tiền tố.
- Mọi kích thước tự viết bằng `rem`.
- `gap` chỉ dùng trong CSS Grid; Flexbox dùng `space-x-*` / `space-y-*` hoặc margin.
- Không dùng tiện ích `inset`.
- Mỗi thuộc tính `className` nằm trên một dòng riêng.

## Triển khai

Kho đã có `vercel.json` cấu hình sẵn cho SPA. Trên Vercel chỉ cần trỏ vào kho, build command
`npm run build`, thư mục xuất `dist`.
