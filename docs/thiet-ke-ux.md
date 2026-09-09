# Thiết kế trải nghiệm — Mỗi Ngày 中文

Tài liệu này ghi lại **vì sao** giao diện được dựng như hiện nay, không phải mô tả lại
những gì đọc code cũng thấy. Mỗi mục nêu vấn đề thật đã quan sát được, quyết định đã
chọn, và cái giá phải trả của quyết định đó.

Phạm vi: ba việc người học làm nhiều nhất — **học**, **lưu**, và **chọn buổi học** —
cộng với **giữ dữ liệu khỏi mất**, vì cả ba việc kia đều vô nghĩa nếu tiến độ biến mất.

---

## 1. Ba câu hỏi mà giao diện phải trả lời

Ứng dụng này có đúng một vòng lặp hằng ngày. Mọi màn hình chỉ tồn tại để trả lời một
trong ba câu:

| Câu hỏi | Màn hình chịu trách nhiệm |
| --- | --- |
| Hôm nay học gì? | Hôm nay, Buổi học |
| Học như thế nào? | Buổi học chi tiết, bốn cách luyện |
| Những gì tôi muốn giữ lại đang ở đâu? | Sổ tay |

Một màn hình không trả lời được câu nào trong ba câu đó thì nó là màn hình thừa.

---

## 2. Nguyên tắc

### 2.1 Màu mang đúng một nghĩa

Trước đây đỏ son được dùng cho bảy việc khác nhau: hành động chính, buổi đang học, từ
cần ôn, câu trả lời sai, viền tiêu điểm, số liệu nổi bật, mục điều hướng đang mở. Khi
một màu nghĩa gì cũng được thì nó không còn là tín hiệu.

Quy tắc hiện nay:

| Màu | Nghĩa duy nhất |
| --- | --- |
| Đỏ son (`cinnabar`) | Việc cần làm bây giờ, và hành động chính của màn hình |
| Vàng đất (`partial`) | Đang dở dang, chưa xong nhưng chưa sai |
| Xanh ngọc (`teal`) | Đã xong, đã đạt |
| Xám (`neutral`) | Chưa đụng tới |

Cùng quy tắc đó áp cho nhãn trạng thái của buổi học và của từng từ, nên liếc qua một
lưới gần trăm buổi là biết ngay nên vào buổi nào.

### 2.2 Không màn hình nào là ngõ cụt

Mỗi trạng thái rỗng phải kèm đúng một lối ra, viết bằng câu nói được người học sắp làm
gì: "Mở trang tra từ", "Bỏ lọc", "Chuyển sang Từ mới". Trạng thái rỗng không có lối ra
là lỗi thiết kế, không phải chuyện nhỏ.

### 2.3 Mọi thao tác đều có phản hồi bằng chữ

Bấm ngôi sao chỉ đổi hình biểu tượng thì người dùng bàn phím và trình đọc màn hình
không nhận được gì. Mỗi thao tác lưu, bỏ lưu và chấm điểm đều đẩy một câu vào vùng
`aria-live` (`LiveMessage`), ví dụ *"Đã lưu 好 vào sổ tay"* hay *"Đã ghi: đã nhớ. Còn 12
thẻ."*

### 2.4 Con số phải nói thật

Không hiện phần trăm bịa, không huy hiệu, không lời khen chung chung. Nếu một phiên chỉ
lấy 20 trong 63 từ đã lưu thì màn hình phải nói *"20 trong 63 từ"* — đó là con số người
học không có cách nào khác để biết.

### 2.5 Ràng buộc kỹ thuật của giao diện

Được kiểm tra tự động bằng `npm run check:ui`:

- Chỉ dùng tiền tố `xsm:` (tối đa `40rem`) cho điện thoại; máy tính là mặc định.
- Mọi kích thước tự đặt viết bằng `rem`, không bao giờ `px`.
- `gap-*` chỉ dùng cùng `grid`; Flexbox dùng `space-x-*` / `space-y-*`.
- Không dùng tiện ích `inset-*`.
- Mỗi `className` nằm trên một dòng JSX riêng.
- Toàn bộ chữ hiển thị và chú thích code viết bằng tiếng Việt.

---

## 3. Kiến trúc thông tin

### 3.1 Thanh điều hướng mang đích đến, không mang công cụ

**Vấn đề.** Thanh dưới cùng trên điện thoại trước đây là bốn cách luyện tập: Lật thẻ,
Gõ, Nghe, Nói. Nhưng bốn thứ đó là *công cụ*, không phải *nơi đến*. Bấm thẳng vào "Gõ"
từ thanh điều hướng nghĩa là rơi vào một hàng đợi mà người học không hề chọn — không
biết đang học từ nào, từ đâu ra, dài bao nhiêu. Đồng thời "Hôm nay" không nằm trong bất
kỳ thanh điều hướng nào, còn "Buổi học", "Tra từ", "Tiến độ" bị đẩy lên đầu trang thành
các nút biểu tượng nhỏ không nhãn.

**Quyết định.** Thanh dưới cùng mang năm đích đến, xếp theo đúng nhịp một ngày học:

```
Hôm nay · Buổi học · Sổ tay · Tra từ · Tiến độ
```

Bốn cách luyện xuất hiện ở nơi đã biết mình luyện từ nào:

- trong trang một buổi học,
- trong sổ tay ("ôn các từ đã lưu"),
- và ở **hàng đổi cách luyện** ngay trong phiên (`ModeSwitch`).

**Cái giá.** Người quen bấm thẳng "Lật thẻ" từ thanh dưới phải đi qua một bước. Đổi lại
họ luôn biết mình đang học gì. Trang Hôm nay vẫn có lối tắt vào cả bốn cách, nhưng kèm
sẵn nguồn từ và cấp trên đường dẫn.

### 3.2 Đổi trang thì về đầu trang

React Router không tự cuộn lên đầu. Mở buổi 42 từ cuối một danh sách đã cuộn sâu thì
trang chi tiết cũng mở ra ở đúng độ cao đó, tức là ở giữa danh sách từ. Người dùng bàn
phím còn tệ hơn: tiêu điểm vẫn nằm ở liên kết vừa bấm, thuộc về một trang không còn tồn
tại.

`AppShell` nay cuộn về đầu và trả tiêu điểm về `<main>` sau mỗi lần đổi đường dẫn —
trừ khi địa chỉ có neo (`#buoi-42`), vì lúc đó chính trang đó sẽ cuộn tới neo.
`<main>` cũng nhận `tabIndex={-1}` để liên kết "Bỏ qua phần điều hướng" thật sự đưa
được tiêu điểm tới nội dung.

---

## 4. Chọn buổi học

Đây là màn hình bị dùng lại nhiều nhất và cũng dài nhất: HSK 3 có 97 buổi.

### 4.1 Ba đường trả lời cho một câu hỏi

Trang được dựng quanh đúng câu "vào buổi nào bây giờ", với ba đường trả lời xếp theo
mức thường dùng:

1. **Thẻ "Học tiếp"** ngay đầu trang — cho việc đi tiếp mạch học. Chiếm hết chiều
   ngang, viền và nền đỏ son, nói rõ đang dở bao nhiêu từ.
2. **Bộ lọc trạng thái** — `Tất cả · Cần ôn · Đang học · Chưa học · Đã lưu`, mỗi nhãn
   kèm số buổi thật.
3. **Ô nhảy thẳng tới buổi số N** — cho khi đã biết chính xác mình cần buổi nào.

Cấp đang xem, bộ lọc và neo cuộn đều nằm trên địa chỉ (`?cap=2&loc=can-on#buoi-42`),
nên quay lại từ một buổi học rơi đúng chỗ cũ thay vì bật lên đầu.

### 4.2 Mở ra đúng cấp đang học

**Vấn đề.** `activeLevels[0]` mặc định là `1`, nên người đang ở HSK 2 buổi 42 mỗi lần
bấm "Buổi học" lại nhìn thấy 50 thẻ HSK 1 đã xong, rồi phải tự bấm sang HSK 2. Lần mở
thứ 30 vẫn phải làm lại thao tác đó lần thứ 30.

**Quyết định.** Thêm `lastLessonId` vào cài đặt, ghi lại khi mở một buổi. Thứ tự lùi
khi chọn cấp để mở: **địa chỉ → cấp của buổi vừa mở → cấp đang chọn trong cài đặt →
HSK 1**. Lưu mã buổi chứ không lưu riêng số cấp, vì một giá trị thì không thể tự mâu
thuẫn với chính nó.

### 4.3 Thẻ buổi học: dòng gọn, có từ thật

**Vấn đề.** Thẻ cũ cao khoảng `11rem`; nhân với 97 buổi một cột trên điện thoại là hơn
mười màn hình cuộn. Nội dung nhận dạng là khoảng `从 → 你` (từ đầu và từ cuối) — vô
dụng, vì các buổi xếp theo thứ tự trong danh sách gốc chứ không theo chủ đề.

**Quyết định.** Dòng gọn còn khoảng một phần ba chiều cao, và hiện **bốn từ đầu của
buổi** thay cho khoảng đầu–cuối. Bốn chữ Hán thật thì nhận ra buổi ngay.

### 4.4 "Đã xong" không còn mâu thuẫn với "6 từ cần ôn"

**Vấn đề.** Trạng thái buổi học chỉ có ba mức và `done` được tính bằng
`learned === total`, nên một thẻ có thể vừa ghi "Đã xong" vừa ghi "6 từ cần ôn".

**Quyết định.** Bốn trạng thái: `new → doing → review → done`. Học hết một buổi không
có nghĩa là xong với nó; lịch ôn còn kéo dài nhiều tháng sau đó.

### 4.5 Trang chủ và danh sách buổi không còn mời vào hai buổi khác nhau

**Vấn đề.** Hai nơi cùng hỏi "đang học dở buổi nào" nhưng trả lời ngược nhau: danh sách
lấy buổi dở có số **nhỏ nhất**, trang chủ lấy số **lớn nhất**. Người từng bỏ dở buổi 5
rồi học tới buổi 42 được hai màn hình mời vào hai buổi khác nhau, cả hai đều nói chắc
như đinh.

**Quyết định.** Một hàm duy nhất — `pickNextLesson` — với quy tắc: **buổi dở dang có số
lớn nhất** (chỗ vừa rời đi), không có thì **buổi chưa đụng tới đầu tiên**. Buổi "đã học
hết nhưng tới hẹn ôn" không chen vào đây, vì đẩy người học lùi lại buổi cũ mỗi lần tới
hẹn thì họ không bao giờ đi tiếp được — phần ôn đã có nút riêng ở trang Hôm nay.

Hai phép đếm "đã học" cũng được gộp về một hàm `isLearned`, dùng đúng điều kiện của kho
dữ liệu (`reps === 0 && phase === 'new'` là từ mới). Nhờ vậy một từ được lưu vào sổ tay
trước khi học vẫn là từ mới ở cả ba nơi.

### 4.6 Trang một buổi: một hành động chính

**Vấn đề.** Trang bày bốn ô chế độ giống hệt nhau — cùng viền, cùng cỡ, cùng sắc độ.
Với người mới, bốn lựa chọn ngang bằng là bốn cách để dừng lại.

**Quyết định.** Một nút chính rộng hết dòng, nội dung đổi theo tình trạng thật:
**"Bắt đầu buổi này"** → **"Học tiếp buổi này"** → **"Ôn lại buổi này"**.

Con số nằm ở dòng phụ ngay dưới, không nằm trên nút: *"Cả buổi 10 từ, còn 4 từ bạn chưa
thuộc."* Lý do là phiên theo buổi luôn đi hết cả buổi, nên một nút ghi "Học 4 từ chưa
thuộc" sẽ hứa một điều phiên học không làm — người học bấm vào rồi gặp đủ 10 thẻ.

Ba cách luyện còn lại lùi xuống hàng phụ dưới nhãn "Luyện cách khác". Nút "Lưu buổi"
nằm ở góc trên bên phải.

---

## 5. Học

### 5.1 Đổi cách luyện mà không mất buổi đang học

**Vấn đề.** Đang ở `/the?lesson=L1-B03` và muốn gõ cùng buổi đó: thanh điều hướng trỏ
tới `/go` trần, không mang theo tham số, nên người học rơi vào một phiên hoàn toàn
khác. Đường đi đúng duy nhất là quay lại danh sách 97 buổi, tìm lại đúng buổi, rồi bấm
ô "Gõ đáp án".

**Quyết định.** `ModeSwitch` — hàng bốn chip ngay dưới tiêu đề phiên. Chế độ đang mở
dùng `aria-current="page"`.

Mỗi chip mang một chuỗi truy vấn **do trang dựng sẵn từ lựa chọn đã giải**, không phải
`location.search` thô. Lý do: mở `/the` trần thì địa chỉ chưa có tham số nào, mà bốn
trang lại có bốn nguồn từ mặc định khác nhau — thẻ và gõ lùi về "cần ôn", nghe và nói
lùi về "trộn". Chuyển một chuỗi rỗng sang trang khác là lặng lẽ đổi luôn nguồn từ giữa
chừng, đúng cái mà hàng chip này sinh ra để tránh.

### 5.2 Nguồn từ hiện ra và bấm được

**Vấn đề.** Lối vào duy nhất để đổi cấp hay nguồn từ là một nút bánh răng không nhãn ở
góc header, mặc định đóng. Bốn nhãn nguồn từ ("Cần ôn / Từ mới / Đã đánh dấu / Trộn")
không giải thích gì, và không nói nguồn nào còn bao nhiêu từ — nên cách duy nhất để
biết một nguồn rỗng là chọn nó rồi vấp vào màn hình trống.

**Quyết định.**

- Nguồn từ hiện thành một dòng bấm được ngay dưới tiêu đề: *"Từ đã lưu · 20 trong 63
  từ"* (`studySourceLabel`, dùng chung cho cả bốn chế độ — trước đây chế độ nói không
  hiện nguồn từ, chế độ gõ lại hiện hai lần).
- Bảng chọn nguồn thành danh sách radio, mỗi dòng có mô tả một câu và **số từ còn lại**
  (`usePoolCounts`). Nguồn rỗng bị khoá tại chỗ thay vì mời bấm.
- Nút chọn cấp HSK cuối cùng còn lại bị khoá rõ ràng kèm lời giải thích, thay vì im
  lặng không phản ứng.

### 5.3 Ba nút chấm nói ra hệ quả

Ba mức "Chưa nhớ / Gần nhớ / Đã nhớ" là dữ liệu đầu vào của cả thuật toán FSRS, nhưng
người học không thấy hệ quả nên bấm theo cảm tính. Mỗi nút nay có dòng thứ hai ghi
khoảng ôn dự kiến — `1 phút`, `3 ngày`, `2 tháng` — tính bằng `previewInterval`, một
phép tính thuần không ghi gì xuống kho.

### 5.4 Thanh tiến độ khớp với vị trí thẻ

**Vấn đề.** Thanh tiến độ đếm theo số câu đã trả lời, còn dòng dưới thẻ đếm theo vị trí
con trỏ. Bỏ qua ba thẻ là màn hình đồng thời nói "Tiến độ phiên 2/20" và "Thẻ 6/20",
rồi phiên kết thúc đột ngột ở mức 60%.

**Quyết định.** `skip()` được ghi nhận vào `stats.skipped`, và tiến độ tính theo
`done + skipped`. Thanh tiến độ có thêm `aria-valuetext` dạng "6 trên 20 thẻ" thay cho
"50 phần trăm".

### 5.5 "Học lại phiên này" giờ mới thật sự học lại

**Vấn đề.** Nút nổi bật nhất cuối phiên gọi `restart()`, mà hàm đó **dựng lại hàng đợi
từ kho** chứ không phát lại 20 từ vừa học. Với nguồn "từ mới", đúng 20 từ đó vừa có thẻ
nên bị loại; với nguồn "cần ôn", hạn ôn vừa bị đẩy sang tương lai. Nghĩa là hành động
nổi bật nhất cuối phiên gần như luôn dẫn thẳng vào một màn hình trống.

**Quyết định.** Tách hai khái niệm và gọi đúng tên:

| Nút | Việc thật sự làm |
| --- | --- |
| Học lại *N* từ chưa chắc | Phát lại riêng những từ trả lời chưa đúng |
| Học lại cả phiên này | Phát lại đúng mảng từ vừa học, không đọc kho |
| Phiên mới cùng nguồn từ | Dựng lại hàng đợi từ kho (hành vi cũ) |

Kèm theo lối ra đúng bối cảnh: học theo buổi thì có "Về buổi học", ôn sổ tay thì có
"Xem sổ tay".

---

## 6. Lưu

### 6.1 Lỗ hổng lớn nhất: dữ liệu vào một chiều

**Vấn đề.** `toggleStar` được gọi từ sáu màn hình — thẻ học, gõ, nghe, nói, trang buổi
học, hộp chi tiết từ. Nhưng **không có route nào liệt kê những từ đã lưu**. Cách duy
nhất để gặp lại chúng là: vào một chế độ luyện → mở bảng tuỳ chọn ẩn → chọn ô "Đã đánh
dấu" → bị ném thẳng vào một phiên luyện. Không bao giờ được xem danh sách.

Ngôi sao trở thành một nút không hậu quả.

**Quyết định.** Trang **Sổ tay** (`/da-luu`), có mặt trong thanh điều hướng chính, gom
ba thứ người học coi là "của mình":

| Mục | Nguồn gốc | Tuổi thọ |
| --- | --- | --- |
| Từ đã lưu | Người học tự chọn | Giữ đến khi chính họ bỏ |
| Buổi đã lưu | Người học tự chọn | Giữ đến khi chính họ bỏ |
| Vừa tra | Máy tự ghi | Chỉ 300 dòng gần nhất |

Sự khác nhau giữa hai loại đầu và loại thứ ba được **nói bằng chữ**, không để người học
tự đoán: trước đây khối "Vừa tra" trông y hệt một danh sách đã lưu — cùng kiểu dòng,
cùng đường kẻ — nên người học tưởng mình đã "lưu" bằng cách tra, rồi một hôm thấy từ
biến mất.

Trang có sẵn đường vào phiên ôn riêng cho sổ tay (`/the?pool=starred`) và ba cách luyện
còn lại, lọc theo cấp, và sắp xếp theo *Mới lưu · Cần ôn trước · Theo cấp*.

### 6.2 Nguồn từ "đã lưu" không còn giấu mất từ của bạn

Ba lỗi chồng lên nhau trong `useStudySession`:

1. Lọc theo cấp đang chọn — lưu một từ HSK 3 rồi quay về học HSK 1 thì từ đó biến mất,
   giống hệt cảm giác mất dữ liệu.
2. Cắt còn 20 từ mà không nói ra — lưu 63 từ thì mỗi phiên chỉ thấy 20.
3. Xáo trộn mỗi lần vào — không cách nào biết mình đã đi hết danh sách chưa.

Nay sổ tay **không lọc theo cấp** (đó là danh sách cá nhân, không phải một lát cắt của
bộ từ) và **nói rõ phần bị cắt** ngay trên tiêu đề phiên.

Thứ tự là **lâu chưa ôn nhất trước**, không phải "lưu lâu nhất trước". Khác biệt này
quan trọng hơn nó trông có vẻ: khoá sắp xếp phải là thứ *thay đổi sau mỗi lượt học*.
Bản sửa đầu tiên xếp theo mốc lưu — một giá trị bất biến — nên phiên nào cũng cắt ra
đúng 20 từ đầu danh sách và từ thứ 21 trở đi không bao giờ tới lượt; đổi từ ngẫu nhiên
sang cố định đã biến một khuyết điểm thành một lỗi. `lastReviewedAt` được ghi lại sau
mỗi lượt ôn nên nhóm vừa học tự tụt xuống cuối và cả sổ tay đi hết được một vòng. Từ
chưa ôn lần nào đứng đầu, đúng thứ tự người học mong đợi.

### 6.3 Lưu ở đúng lúc muốn lưu

Hộp tra từ mở giữa giờ học là khoảnh khắc có ý định lưu cao nhất trong cả ứng dụng —
mà trước đây nó không có nút lưu nào, và các lượt tra ở đó cũng không được ghi vào
lịch sử (tạo ra nghịch lý: hộp cho xem lịch sử nhưng không góp gì vào lịch sử).

Nay `WordRow` nhận thêm `saved` / `onToggleSave`, nên nút lưu nằm thẳng trên từng dòng
kết quả ở hộp tra từ giữa giờ học, ở trang Tra từ, và ở danh sách "Vừa tra" — bấm sao
ở đó là chuyển một từ vừa tra thành một từ giữ lâu dài, đúng một chạm. Lưu từ trong hộp
tra từ cũng ghi luôn một lượt tra, vì đó là bằng chứng rõ ràng nhất rằng từ đã được dùng.

### 6.4 Trạng thái "đã lưu" nhìn thấy được

Biến thể `pressed` cũ dùng nền `sunken`, chỉ chênh nền trang **1,09:1** — mắt thường
không phân biệt nổi đã lưu hay chưa. Nay có biến thể `saved` mang cả ba tín hiệu: màu
chữ, màu nền và màu viền. Sáu màn hình dùng chung một `SaveWordButton` nên hình thức và
nhãn giống hệt nhau ở mọi nơi.

Chữ cũng đổi: **"đánh dấu" → "lưu"**. Người học nghĩ về việc này như cất một từ vào sổ
tay, không như bật một lá cờ.

### 6.5 Lưu cả buổi học

Bảng `savedLessons` (Dexie phiên bản 3) giữ đúng ý định "để dành buổi này", tách khỏi
tiến độ học — tiến độ là hệ quả của việc trả lời, còn lưu là một lựa chọn. Trộn hai thứ
vào một bảng thì xoá tiến độ sẽ xoá luôn danh sách để dành.

Nút lưu có ở từng dòng trong danh sách buổi học và ở đầu trang chi tiết buổi; bộ lọc
"Đã lưu" cho xem riêng chúng ngay trong danh sách.

---

## 7. Giữ dữ liệu khỏi mất

Toàn bộ tiến độ nằm trong IndexedDB của chính máy người học. Mặc định trình duyệt xếp
kho đó vào loại **"xoá được khi cần chỗ"**: máy sắp đầy là nó dọn, không hỏi ai. Với
một ứng dụng không có backend thì đó là mất trắng nhiều tháng học — và trước đây giao
diện không hề nói ra rủi ro này; nút sao lưu thì nằm ở đáy trang Tiến độ.

Ba việc đã làm:

**1. Xin ghim kho dữ liệu.** `navigator.storage.persist()` đổi kho sang chế độ
persistent, lúc đó chỉ chính người dùng mới xoá được. Phần "Kho dữ liệu trên máy này"
nói đúng tình trạng thật và **không hứa hẹn gì hơn những gì trình duyệt trả lời**:
Chrome và Edge tự quyết theo mức độ gắn bó với trang, Firefox hỏi người dùng, Safari
cấp theo cách riêng. Chỉ gọi từ một cú bấm thật, vì vài trình duyệt bỏ qua lời xin
không đến từ thao tác người dùng và Firefox sẽ bật hộp thoại xin quyền.

**2. Nhắc sao lưu.** `lastBackupAt` được ghi ngay khi tệp sao lưu vừa được tạo — đó là
lúc cuối cùng ứng dụng còn biết chắc điều gì đang xảy ra, phần tải về là việc của trình
duyệt và không báo lại. Quá 30 ngày chưa sao lưu (hoặc chưa lần nào) thì hiện lời nhắc,
nhưng chỉ khi người học thật sự có tiến độ để mất.

**3. Tệp sao lưu mang đủ dữ liệu.** Bản xuất nay gồm cả `savedLessons` và `lookups`.
Hai mảng này **không bắt buộc** khi nạp, và số phiên bản tệp vẫn giữ nguyên là `1`:
đổi số phiên bản chỉ vì thêm phần không bắt buộc sẽ làm mọi tệp người dùng đã tải về
trước đó thành vô dụng.

---

## 8. Khả dụng

### 8.1 Tương phản màu — đo, không đoán

Các giá trị dưới đây tính bằng công thức tương phản của WCAG 2.1.

| Cặp màu | Trước | Sau | Ngưỡng |
| --- | --- | --- | --- |
| `ink-faint` trên `paper` (sáng) | 3,32 | **4,96** | 4,5 |
| `ink-faint` trên `surface` (sáng) | 3,68 | **5,49** | 4,5 |
| `ink-faint` trên `sunken` (sáng) | 3,04 | **4,54** | 4,5 |
| `ink-faint` trên `surface` (tối) | 4,17 | **4,77** | 4,5 |
| `partial` trên `partial-soft` (sáng) | 3,98 | **4,80** | 4,5 |
| `line-strong` trên `surface` (sáng) | 1,90 | **3,32** | 3,0 |
| `line-strong` trên `surface` (tối) | 1,77 | **3,14** | 3,0 |

`ink-faint` được dùng ở hơn một trăm chỗ và phần lớn ở cỡ chữ nhỏ, nên đây không phải
chuyện làm đẹp: đó là phần chữ khó đọc nhất của cả ứng dụng.

Ở chế độ tối, ba nền phụ (`teal-soft`, `cinnabar-soft`, `partial-soft`) trước đây chênh
nền trang chưa tới **1,2:1** — một khung thông báo trông y hệt một đoạn văn thường. Nay
chúng sáng hơn hẳn mà chữ trên chúng vẫn giữ trên 5,5:1.

`line` (đường phân cách trang trí) không có ngưỡng bắt buộc nhưng vẫn được làm đậm hơn,
vì cả giao diện dựa vào đường kẻ mảnh để phân khối.

### 8.2 Những chỗ khác

- **Vùng chạm** tối thiểu `2.75rem` (lớp `tap`) cho mọi thứ bấm được.
- **Thẻ buổi học** dùng một liên kết phủ cả dòng thay vì bọc cả dòng vào trong liên
  kết. Nút lưu nằm trong một liên kết là HTML không hợp lệ, và thanh tiến độ nằm trong
  liên kết thì bị đọc thành một phần của tên liên kết. Nhãn đọc màn hình nay kèm cả số
  từ cần ôn.
- **Thanh tiến độ trong thẻ buổi** là hình vẽ thuần (`aria-hidden`): số liệu đã nằm
  trong nhãn liên kết, thêm một `progressbar` nữa chỉ làm trình đọc nói hai lần.
- **Ô nhảy tới buổi số N** cố ý *không* đặt `min`/`max` lên chính ô nhập: trình duyệt
  sẽ chặn luôn việc gửi biểu mẫu và hiện lời nhắc mặc định của nó, nên câu "Cấp này chỉ
  có 97 buổi" không bao giờ tới được người học. Khoảng hợp lệ nằm trong nhãn. Vùng báo
  lỗi luôn nằm sẵn trong cây DOM, vì thêm một vùng `aria-live` cùng lúc với nội dung
  của nó thì trình đọc màn hình bỏ qua câu đầu tiên.
- **Danh sách buổi học không dùng `content-visibility`.** Nó bật containment sơn cho
  từng ô, mà vòng tiêu điểm được vẽ *bên ngoài* thẻ nên sẽ bị cắt trụi — người dùng bàn
  phím mất dấu hoàn toàn. Dòng gọn hiện nay nhẹ hơn thẻ cũ nhiều lần nên gần một trăm ô
  vẫn cuộn mượt mà không cần đến nó. Cùng lý do, hàng chip đổi cách luyện được đệm rồi
  kéo lại bằng margin âm để `overflow-x-auto` không cắt mất vòng tiêu điểm.

---

## 9. Những gì cố ý không làm

- **Không thêm thư viện.** Không toast, không animation library, không icon pack. Vùng
  `aria-live` một dòng làm đúng việc của toast mà không kéo theo gì.
- **Không gom thang cỡ chữ thành token.** Ứng dụng đang dùng khoảng 22 giá trị cỡ chữ
  rời rạc. Gom lại là việc đáng làm, nhưng nó chạm vào toàn bộ 140 tệp giao diện và
  không đổi được gì cho người học ngay lúc này. Ghi lại ở đây như một món nợ kỹ thuật.
- **Không thêm mức chấm thứ tư ("quá dễ").** FSRS có bốn mức, giao diện đang phơi ba.
  Thêm mức thứ tư đòi đổi `AnswerVerdict` — kiểu dùng chung của cả bốn chế độ luyện và
  của phần chấm đáp án — nên để lại cho một thay đổi riêng.
- **Không chấm phát âm.** Web Speech API chỉ trả về văn bản nó nghe được; ứng dụng
  không bịa ra điểm số nào. Xem README.

---

## 10. Kiểm chứng

```bash
npm run typecheck   # kiểm tra kiểu
npm run lint        # ESLint, gồm cả các quy tắc thuần khiết của React
npm run check:ui    # quy ước giao diện của dự án
npm test            # Vitest
npm run build       # đóng gói
```

Phần lõi có kiểm thử riêng, không phụ thuộc React: chọn buổi tiếp theo
(`next-lesson.test.ts`), câu mô tả nguồn từ (`study-source.test.ts`), sổ tay từ và sổ
tay buổi (`cards.test.ts`, `saved-lessons.test.ts`), vòng xuất–nạp tệp sao lưu
(`settings.test.ts`), ghim kho dữ liệu (`persist.test.ts`), và xem trước hạn ôn
(`fsrs.test.ts`).

Riêng hai màn hình mới được dựng thật trong `SavedPage.test.tsx` — không phải để soi
từng dòng chữ mà để bắt những lỗi chỉ lộ ra khi chạy, trên đúng đường đi mà người học
than phiền nhất: lưu xong rồi tìm lại ở đâu.

Bốn hành vi từng sai và đã được ghim lại bằng kiểm thử trong `useStudySession.test.tsx`:
sổ tay phải xoay vòng chứ không lặp mãi một nhóm, sổ tay không lọc theo cấp, "học lại"
phải phát lại đúng những từ vừa học, và bỏ qua một thẻ vẫn phải được tính vào tiến độ.
