/**
 * Câu dài tập gõ pinyin cho bài 2: mỗi câu ghép vài từ mới của bài (啊, 白色,
 * 班, 包 …) với từ HSK 1–2. Pinyin viết tay theo cách đọc thật (一 / 不 đã
 * biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '下雨了，我们不坐公交车了，还是打车去饭馆吧。',
    pinyin: 'Xià yǔ le, wǒmen bú zuò gōngjiāochē le, háishi dǎchē qù fànguǎn ba.',
    vi: 'Trời mưa rồi, chúng ta không đi xe buýt nữa, thôi đi taxi đến quán ăn vậy.',
  },
  {
    hanzi: '我高中的时候个子不高，但是现在比我爸爸还高。',
    pinyin: 'Wǒ gāozhōng de shíhou gèzi bù gāo, dànshì xiànzài bǐ wǒ bàba hái gāo.',
    vi: 'Hồi cấp 3 tôi không cao, nhưng bây giờ còn cao hơn cả bố tôi.',
  },
  {
    hanzi: '他打开包，从里面拿出来一本白色的书，放在床上。',
    pinyin: 'Tā dǎkāi bāo, cóng lǐmiàn ná chūlái yì běn báisè de shū, fàng zài chuáng shàng.',
    vi: 'Anh ấy mở túi, lấy từ bên trong ra một cuốn sách màu trắng, đặt lên giường.',
  },
  {
    hanzi: '老师说的这个词我听过，但不知道是什么意思。',
    pinyin: 'Lǎoshī shuō de zhège cí wǒ tīng guo, dàn bù zhīdào shì shénme yìsi.',
    vi: 'Từ cô giáo nói tôi đã từng nghe, nhưng không biết nghĩa là gì.',
  },
  {
    hanzi: '啊，外面下大雪了，地上都是白色的，真好看！',
    pinyin: 'A, wàimiàn xià dà xuě le, dìshang dōu shì báisè de, zhēn hǎokàn!',
    vi: 'À, bên ngoài tuyết rơi dày rồi, mặt đất toàn màu trắng, đẹp thật!',
  },
  {
    hanzi: '你在那里别动，我马上过来帮你拿这个大包。',
    pinyin: 'Nǐ zài nàli bié dòng, wǒ mǎshàng guòlái bāng nǐ ná zhège dà bāo.',
    vi: 'Bạn cứ đứng yên ở đó, tôi qua ngay giúp bạn cầm cái túi to này.',
  },
  {
    hanzi: '我们班有三十个学生，大家都很高兴地学习汉语。',
    pinyin: 'Wǒmen bān yǒu sānshí ge xuésheng, dàjiā dōu hěn gāoxìng de xuéxí Hànyǔ.',
    vi: 'Lớp chúng tôi có ba mươi học sinh, mọi người đều vui vẻ học tiếng Trung.',
  },
  {
    hanzi: '飞机从北京飞过来要三个小时，我跟妈妈去机场接爸爸。',
    pinyin: 'Fēijī cóng Běijīng fēi guòlái yào sān ge xiǎoshí, wǒ gēn māma qù jīchǎng jiē bàba.',
    vi: 'Máy bay từ Bắc Kinh bay sang mất ba tiếng, tôi cùng mẹ ra sân bay đón bố.',
  },
  {
    hanzi: '他早上常常打车去公司，因为坐公交车太慢了。',
    pinyin: 'Tā zǎoshang chángcháng dǎchē qù gōngsī, yīnwèi zuò gōngjiāochē tài màn le.',
    vi: 'Buổi sáng anh ấy thường đi taxi đến công ty, vì đi xe buýt chậm quá.',
  },
  {
    hanzi: '妈妈打电话问我在哪里，我说我跟同学在饭馆吃饭。',
    pinyin: 'Māma dǎ diànhuà wèn wǒ zài nǎlǐ, wǒ shuō wǒ gēn tóngxué zài fànguǎn chīfàn.',
    vi: 'Mẹ gọi điện hỏi tôi đang ở đâu, tôi nói tôi đang ăn cơm ở quán với bạn học.',
  },
  {
    hanzi: '下课以后，同学们都从教室里走出来，慢慢地回家。',
    pinyin: 'Xiàkè yǐhòu, tóngxuémen dōu cóng jiàoshì lǐ zǒu chūlái, mànmàn de huí jiā.',
    vi: 'Tan học, các bạn đều từ trong lớp đi ra, thong thả về nhà.',
  },
  {
    hanzi: '我的床很小，但房间很大，所以我想买大一点的床。',
    pinyin: 'Wǒ de chuáng hěn xiǎo, dàn fángjiān hěn dà, suǒyǐ wǒ xiǎng mǎi dà yìdiǎn de chuáng.',
    vi: 'Giường của tôi rất nhỏ, nhưng phòng rất rộng, nên tôi muốn mua giường to hơn một chút.',
  },
  {
    hanzi: '这个词很难，老师说了很多次，我还是写不出来。',
    pinyin: 'Zhège cí hěn nán, lǎoshī shuō le hěn duō cì, wǒ háishi xiě bu chūlái.',
    vi: 'Từ này rất khó, cô giáo đã nói nhiều lần, tôi vẫn không viết ra được.',
  },
  {
    hanzi: '他的个子很高，喜欢打篮球，但是不太喜欢游泳。',
    pinyin: 'Tā de gèzi hěn gāo, xǐhuan dǎ lánqiú, dànshì bú tài xǐhuan yóuyǒng.',
    vi: 'Anh ấy dáng người cao, thích chơi bóng rổ, nhưng không thích bơi lắm.',
  },
  {
    hanzi: '请你过来一下，帮我打开这个门，我的手里有很多东西。',
    pinyin: 'Qǐng nǐ guòlái yíxià, bāng wǒ dǎkāi zhège mén, wǒ de shǒu lǐ yǒu hěn duō dōngxi.',
    vi: 'Bạn qua đây một chút, giúp tôi mở cánh cửa này, tay tôi đang cầm nhiều đồ.',
  },
  {
    hanzi: '我高中的同学下个月要从上海飞到北京来看我。',
    pinyin: 'Wǒ gāozhōng de tóngxué xià ge yuè yào cóng Shànghǎi fēi dào Běijīng lái kàn wǒ.',
    vi: 'Bạn học cấp 3 của tôi tháng sau sẽ bay từ Thượng Hải đến Bắc Kinh thăm tôi.',
  },
  {
    hanzi: '公交车上人太多了，动也不能动，下次我们还是打车吧。',
    pinyin: 'Gōngjiāochē shàng rén tài duō le, dòng yě bù néng dòng, xià cì wǒmen háishi dǎchē ba.',
    vi: 'Trên xe buýt đông người quá, không nhúc nhích được, lần sau chúng ta đi taxi thôi.',
  },
  {
    hanzi: '啊，你的包是白色的？我的也是白色的，我们的一样！',
    pinyin: 'A, nǐ de bāo shì báisè de? Wǒ de yě shì báisè de, wǒmen de yíyàng!',
    vi: 'Ồ, túi của bạn màu trắng à? Của tôi cũng màu trắng, giống nhau!',
  },
  {
    hanzi: '他高兴地跑过来跟我说，他这次考得很好。',
    pinyin: 'Tā gāoxìng de pǎo guòlái gēn wǒ shuō, tā zhè cì kǎo de hěn hǎo.',
    vi: 'Anh ấy vui vẻ chạy lại nói với tôi rằng lần này anh ấy thi rất tốt.',
  },
  {
    hanzi: '早上我打开手机，看到班里的同学给我打了三个电话。',
    pinyin: 'Zǎoshang wǒ dǎkāi shǒujī, kàn dào bān lǐ de tóngxué gěi wǒ dǎ le sān ge diànhuà.',
    vi: 'Sáng nay tôi mở điện thoại, thấy bạn cùng lớp đã gọi cho tôi ba cuộc.',
  },
];

export default sentences;
