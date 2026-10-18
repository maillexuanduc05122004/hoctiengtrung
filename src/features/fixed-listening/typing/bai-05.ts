/**
 * Câu dài tập gõ pinyin cho bài 5: mỗi câu ghép vài từ mới của bài (10 từ HSK 2
 * 绿色 … 爬山, 10 từ HSK 3 不必 … 成功) với từ HSK 1–2. Pinyin viết tay theo cách
 * đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '这件绿色的衬衫是在南方买的，我非常满意。',
    pinyin: 'Zhè jiàn lǜsè de chènshān shì zài nánfāng mǎi de, wǒ fēicháng mǎnyì.',
    vi: 'Chiếc áo sơ mi xanh lá này mua ở miền Nam, tôi rất hài lòng.',
  },
  {
    hanzi: '他年轻的时候曾经是一个篮球明星，现在是老师。',
    pinyin: 'Tā niánqīng de shíhou céngjīng shì yí ge lánqiú míngxīng, xiànzài shì lǎoshī.',
    vi: 'Hồi trẻ anh ấy từng là ngôi sao bóng rổ, bây giờ là giáo viên.',
  },
  {
    hanzi: '周末天气超级好，我们不仅去爬山，还去看了长城。',
    pinyin: 'Zhōumò tiānqì chāojí hǎo, wǒmen bùjǐn qù páshān, hái qù kàn le Chángchéng.',
    vi: 'Cuối tuần thời tiết siêu đẹp, chúng tôi không chỉ đi leo núi mà còn đi xem Trường Thành.',
  },
  {
    hanzi: '你不必那么难过，下次努力一点，就能成功。',
    pinyin: 'Nǐ búbì nàme nánguò, xià cì nǔlì yìdiǎn, jiù néng chénggōng.',
    vi: 'Bạn không cần buồn như vậy, lần sau cố gắng hơn một chút là có thể thành công.',
  },
  {
    hanzi: '昨天他们吵架了，所以今天两个人都不说话。',
    pinyin: 'Zuótiān tāmen chǎojià le, suǒyǐ jīntiān liǎng ge rén dōu bù shuōhuà.',
    vi: 'Hôm qua họ cãi nhau nên hôm nay cả hai đều không nói chuyện.',
  },
  {
    hanzi: '这个商店卖很多彩色的衣服，年轻人都很喜欢。',
    pinyin: 'Zhège shāngdiàn mài hěn duō cǎisè de yīfu, niánqīngrén dōu hěn xǐhuan.',
    vi: 'Cửa hàng này bán nhiều quần áo nhiều màu, người trẻ đều rất thích.',
  },
  {
    hanzi: '公交车太慢了，我们不得不打车去机场。',
    pinyin: 'Gōngjiāochē tài màn le, wǒmen bùdébù dǎchē qù jīchǎng.',
    vi: 'Xe buýt chậm quá, chúng tôi đành phải đi taxi ra sân bay.',
  },
  {
    hanzi: '南方的天气比北方热，所以我们不必带很多衣服。',
    pinyin: 'Nánfāng de tiānqì bǐ běifāng rè, suǒyǐ wǒmen búbì dài hěn duō yīfu.',
    vi: 'Thời tiết miền Nam nóng hơn miền Bắc nên chúng tôi không cần mang nhiều quần áo.',
  },
  {
    hanzi: '我曾经在北京住了两年，那时候我经常去长城。',
    pinyin: 'Wǒ céngjīng zài Běijīng zhù le liǎng nián, nà shíhou wǒ jīngcháng qù Chángchéng.',
    vi: 'Tôi từng sống ở Bắc Kinh hai năm, hồi đó tôi thường đi Trường Thành.',
  },
  {
    hanzi: '老师对我们的表演非常满意，说我们很努力。',
    pinyin: 'Lǎoshī duì wǒmen de biǎoyǎn fēicháng mǎnyì, shuō wǒmen hěn nǔlì.',
    vi: 'Cô giáo rất hài lòng với buổi biểu diễn của chúng tôi, nói chúng tôi rất chăm chỉ.',
  },
  {
    hanzi: '那个明星不仅唱歌好听，还会画画。',
    pinyin: 'Nàge míngxīng bùjǐn chànggē hǎotīng, hái huì huà huà.',
    vi: 'Ngôi sao đó không chỉ hát hay mà còn biết vẽ tranh.',
  },
  {
    hanzi: '如果明天下雨，那么我们就不去爬山了，在家看电视吧。',
    pinyin: 'Rúguǒ míngtiān xià yǔ, nàme wǒmen jiù bú qù páshān le, zài jiā kàn diànshì ba.',
    vi: 'Nếu ngày mai mưa thì chúng ta không đi leo núi nữa, ở nhà xem tivi nhé.',
  },
  {
    hanzi: '他卖了那辆绿色的车，买了一辆红色的。',
    pinyin: 'Tā mài le nà liàng lǜsè de chē, mǎi le yí liàng hóngsè de.',
    vi: 'Anh ấy bán chiếc xe xanh lá đó, mua một chiếc màu đỏ.',
  },
  {
    hanzi: '姐姐和妈妈吵架以后很难过，一个人在房间里哭。',
    pinyin: 'Jiějie hé māma chǎojià yǐhòu hěn nánguò, yí ge rén zài fángjiān lǐ kū.',
    vi: 'Chị gái sau khi cãi nhau với mẹ rất buồn, một mình khóc trong phòng.',
  },
  {
    hanzi: '只要每天努力练习，你的汉语就会说得很流利。',
    pinyin: 'Zhǐyào měitiān nǔlì liànxí, nǐ de Hànyǔ jiù huì shuō de hěn liúlì.',
    vi: 'Chỉ cần mỗi ngày cố gắng luyện tập, tiếng Trung của bạn sẽ nói rất lưu loát.',
  },
  {
    hanzi: '这次比赛我们成功了，大家都超级高兴。',
    pinyin: 'Zhè cì bǐsài wǒmen chénggōng le, dàjiā dōu chāojí gāoxìng.',
    vi: 'Trận đấu lần này chúng tôi thành công, mọi người đều siêu vui.',
  },
  {
    hanzi: '我曾经穿着白色的衬衫去考试，因为那是我最喜欢的衣服。',
    pinyin: 'Wǒ céngjīng chuān zhe báisè de chènshān qù kǎoshì, yīnwèi nà shì wǒ zuì xǐhuan de yīfu.',
    vi: 'Tôi từng mặc áo sơ mi trắng đi thi, vì đó là bộ quần áo tôi thích nhất.',
  },
  {
    hanzi: '年轻人不仅喜欢旅游，也喜欢去爬山。',
    pinyin: 'Niánqīngrén bùjǐn xǐhuan lǚyóu, yě xǐhuan qù páshān.',
    vi: 'Người trẻ không chỉ thích du lịch mà còn thích đi leo núi.',
  },
  {
    hanzi: '这本书有很多彩色的画，所以孩子们都很喜欢看。',
    pinyin: 'Zhè běn shū yǒu hěn duō cǎisè de huà, suǒyǐ háizimen dōu hěn xǐhuan kàn.',
    vi: 'Cuốn sách này có nhiều tranh màu nên bọn trẻ đều rất thích xem.',
  },
  {
    hanzi: '你不必买那么贵的衬衫，这件绿色的就很好看。',
    pinyin: 'Nǐ búbì mǎi nàme guì de chènshān, zhè jiàn lǜsè de jiù hěn hǎokàn.',
    vi: 'Bạn không cần mua áo sơ mi đắt như vậy, chiếc màu xanh lá này đã rất đẹp rồi.',
  },
];

export default sentences;
