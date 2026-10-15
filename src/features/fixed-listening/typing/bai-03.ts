/**
 * Câu dài tập gõ pinyin cho bài 3: mỗi câu ghép vài từ mới của bài (还是, 黑色,
 * 红茶, 红色 …) với từ HSK 1–2. Pinyin viết tay theo cách đọc thật (一 / 不 đã
 * biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '你想喝红茶还是喝咖啡？我经常喝红茶，所以今天想喝咖啡。',
    pinyin: 'Nǐ xiǎng hē hóngchá háishi hē kāfēi? Wǒ jīngcháng hē hóngchá, suǒyǐ jīntiān xiǎng hē kāfēi.',
    vi: 'Bạn muốn uống trà đen hay cà phê? Tôi thường uống trà đen, nên hôm nay muốn uống cà phê.',
  },
  {
    hanzi: '快要开学了，妈妈给我买了一条黑色的裤子和一件红色的衣服。',
    pinyin: 'Kuàiyào kāixué le, māma gěi wǒ mǎi le yì tiáo hēisè de kùzi hé yí jiàn hóngsè de yīfu.',
    vi: 'Sắp khai giảng rồi, mẹ mua cho tôi một chiếc quần màu đen và một chiếc áo màu đỏ.',
  },
  {
    hanzi: '我的电脑坏了，所以明天的考试我只能去图书馆准备。',
    pinyin: 'Wǒ de diànnǎo huài le, suǒyǐ míngtiān de kǎoshì wǒ zhǐ néng qù túshūguǎn zhǔnbèi.',
    vi: 'Máy tính của tôi hỏng rồi, nên bài thi ngày mai tôi chỉ có thể lên thư viện chuẩn bị.',
  },
  {
    hanzi: '你还记得我们第一次见面的时候，你穿的是什么颜色的衣服吗？',
    pinyin: 'Nǐ hái jìde wǒmen dì yī cì jiànmiàn de shíhou, nǐ chuān de shì shénme yánsè de yīfu ma?',
    vi: 'Bạn còn nhớ lần đầu chúng ta gặp nhau, bạn mặc áo màu gì không?',
  },
  {
    hanzi: '这间教室很大，老师让我们一个一个地进去考试。',
    pinyin: 'Zhè jiān jiàoshì hěn dà, lǎoshī ràng wǒmen yí ge yí ge de jìnqù kǎoshì.',
    vi: 'Phòng học này rất rộng, cô giáo bảo chúng tôi lần lượt từng người vào trong thi.',
  },
  {
    hanzi: '外面太冷了，请快点进来，我给你拿一杯热红茶。',
    pinyin: 'Wàimiàn tài lěng le, qǐng kuài diǎn jìnlái, wǒ gěi nǐ ná yì bēi rè hóngchá.',
    vi: 'Ngoài trời lạnh quá, mau vào đây đi, tôi lấy cho bạn một cốc trà đen nóng.',
  },
  {
    hanzi: '他经常去那家酒店旁边的饭馆吃饭，因为那里的菜很便宜。',
    pinyin: 'Tā jīngcháng qù nà jiā jiǔdiàn pángbiān de fànguǎn chīfàn, yīnwèi nàli de cài hěn piányi.',
    vi: 'Anh ấy thường đến quán ăn cạnh khách sạn đó ăn cơm, vì đồ ăn ở đó rất rẻ.',
  },
  {
    hanzi: '我已经买了机票，下个星期就要坐飞机回去看爸爸妈妈了。',
    pinyin: 'Wǒ yǐjīng mǎi le jīpiào, xià ge xīngqī jiù yào zuò fēijī huíqu kàn bàba māma le.',
    vi: 'Tôi đã mua vé máy bay rồi, tuần sau sẽ đi máy bay về thăm bố mẹ.',
  },
  {
    hanzi: '姐姐喜欢画画，她画的花有红色的，也有黑色的，都很好看。',
    pinyin: 'Jiějie xǐhuan huà huà, tā huà de huā yǒu hóngsè de, yě yǒu hēisè de, dōu hěn hǎokàn.',
    vi: 'Chị gái thích vẽ tranh, hoa chị vẽ có bông màu đỏ, cũng có bông màu đen, đều rất đẹp.',
  },
  {
    hanzi: '爸爸出去买东西了，他说一个小时以后就回来。',
    pinyin: 'Bàba chūqù mǎi dōngxi le, tā shuō yí ge xiǎoshí yǐhòu jiù huílai.',
    vi: 'Bố ra ngoài mua đồ rồi, bố nói một tiếng nữa sẽ về.',
  },
  {
    hanzi: '开学以后，我们班的同学经常在下课以后一起打篮球。',
    pinyin: 'Kāixué yǐhòu, wǒmen bān de tóngxué jīngcháng zài xiàkè yǐhòu yìqǐ dǎ lánqiú.',
    vi: 'Sau khi khai giảng, các bạn lớp tôi thường cùng nhau chơi bóng rổ sau giờ học.',
  },
  {
    hanzi: '你记得明天考汉语吗？我们今天晚上还是早点睡觉吧。',
    pinyin: 'Nǐ jìde míngtiān kǎo Hànyǔ ma? Wǒmen jīntiān wǎnshang háishi zǎo diǎn shuìjiào ba.',
    vi: 'Bạn có nhớ ngày mai thi tiếng Trung không? Tối nay chúng ta nên đi ngủ sớm thôi.',
  },
  {
    hanzi: '这条黑色的裤子太长了，我想换一条短一点的。',
    pinyin: 'Zhè tiáo hēisè de kùzi tài cháng le, wǒ xiǎng huàn yì tiáo duǎn yìdiǎn de.',
    vi: 'Chiếc quần đen này dài quá, tôi muốn đổi một chiếc ngắn hơn một chút.',
  },
  {
    hanzi: '这家酒店很干净，我住的那间房间里的床很大。',
    pinyin: 'Zhè jiā jiǔdiàn hěn gānjìng, wǒ zhù de nà jiān fángjiān lǐ de chuáng hěn dà.',
    vi: 'Khách sạn này rất sạch sẽ, giường trong căn phòng tôi ở rất to.',
  },
  {
    hanzi: '他进去看了一下，很快就回来了，说里面一个人也没有。',
    pinyin: 'Tā jìnqù kàn le yíxià, hěn kuài jiù huílai le, shuō lǐmiàn yí ge rén yě méiyǒu.',
    vi: 'Anh ấy vào xem một chút, rất nhanh đã quay lại, nói bên trong không có ai cả.',
  },
  {
    hanzi: '快要下雨了，我们还是快点回去吧，别在外面打篮球了。',
    pinyin: 'Kuàiyào xià yǔ le, wǒmen háishi kuài diǎn huíqu ba, bié zài wàimiàn dǎ lánqiú le.',
    vi: 'Sắp mưa rồi, chúng ta mau về thôi, đừng chơi bóng rổ ở ngoài nữa.',
  },
  {
    hanzi: '你下次考试以前记得多复习，这样就能考得更好。',
    pinyin: 'Nǐ xià cì kǎoshì yǐqián jìde duō fùxí, zhèyàng jiù néng kǎo de gèng hǎo.',
    vi: 'Lần sau trước khi thi nhớ ôn tập nhiều hơn, như vậy sẽ thi tốt hơn.',
  },
  {
    hanzi: '我想买去上海的机票，但是机票太贵了，还是坐火车吧。',
    pinyin: 'Wǒ xiǎng mǎi qù Shànghǎi de jīpiào, dànshì jīpiào tài guì le, háishi zuò huǒchē ba.',
    vi: 'Tôi muốn mua vé máy bay đi Thượng Hải nhưng vé đắt quá, thôi đi tàu hỏa vậy.',
  },
  {
    hanzi: '这个门坏了，打不开，你们从那边的门进来吧，我在里面等你们。',
    pinyin: 'Zhège mén huài le, dǎ bu kāi, nǐmen cóng nàbian de mén jìnlái ba, wǒ zài lǐmiàn děng nǐmen.',
    vi: 'Cái cửa này hỏng rồi, không mở được, các bạn vào bằng cửa bên kia nhé, tôi đợi các bạn ở trong.',
  },
  {
    hanzi: '他画的画上有一个穿红色衣服的女孩子和一只黑色的小狗。',
    pinyin: 'Tā huà de huà shàng yǒu yí ge chuān hóngsè yīfu de nǚ háizi hé yì zhī hēisè de xiǎo gǒu.',
    vi: 'Trong bức tranh anh ấy vẽ có một cô bé mặc áo đỏ và một con chó nhỏ màu đen.',
  },
];

export default sentences;
