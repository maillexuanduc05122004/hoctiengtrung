/**
 * Câu dài tập gõ pinyin cho bài 10: mỗi câu ghép từ mới của bài (20 từ HSK 3
 * 父母 … 各种 chọn trải ra để không có hai từ chung chữ, cộng 3 từ về công ty
 * 公司、同事、经理) với từ HSK 1–2. Pinyin
 * viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống); bản
 * không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我的父母都已经六十多岁了，可是身体还很好。',
    pinyin: 'Wǒ de fùmǔ dōu yǐjīng liùshí duō suì le, kěshì shēntǐ hái hěn hǎo.',
    vi: 'Bố mẹ tôi đều đã ngoài sáu mươi tuổi, nhưng sức khỏe vẫn rất tốt.',
  },
  {
    hanzi: '离开家的那天早上，我跟爸爸妈妈告别，他们都哭了。',
    pinyin: 'Líkāi jiā de nà tiān zǎoshang, wǒ gēn bàba māma gàobié, tāmen dōu kū le.',
    vi: 'Sáng hôm rời nhà, tôi chào tạm biệt bố mẹ, cả hai đều khóc.',
  },
  {
    hanzi: '这个小城市的环境非常好，很多人周末都来这里玩。',
    pinyin: 'Zhège xiǎo chéngshì de huánjìng fēicháng hǎo, hěn duō rén zhōumò dōu lái zhèlǐ wán.',
    vi: 'Môi trường của thành phố nhỏ này cực kỳ tốt, cuối tuần nhiều người đến đây chơi.',
  },
  {
    hanzi: '北京的房租太贵了，我和两个同学一起住一个房间。',
    pinyin: 'Běijīng de fángzū tài guì le, wǒ hé liǎng ge tóngxué yìqǐ zhù yí ge fángjiān.',
    vi: 'Tiền thuê nhà ở Bắc Kinh đắt quá, tôi ở chung một phòng với hai bạn học.',
  },
  {
    hanzi: '姐姐最喜欢的歌手下个月要来我们这里表演。',
    pinyin: 'Jiějie zuì xǐhuan de gēshǒu xià ge yuè yào lái wǒmen zhèlǐ biǎoyǎn.',
    vi: 'Ca sĩ mà chị gái thích nhất tháng sau sẽ đến chỗ chúng tôi biểu diễn.',
  },
  {
    hanzi: '第一次一个人坐飞机的时候，我心里很害怕。',
    pinyin: 'Dì yī cì yí ge rén zuò fēijī de shíhou, wǒ xīnli hěn hàipà.',
    vi: 'Lần đầu tiên đi máy bay một mình, trong lòng tôi rất sợ.',
  },
  {
    hanzi: '经理说先休息十分钟，然后会议再继续。',
    pinyin: 'Jīnglǐ shuō xiān xiūxi shí fēnzhōng, ránhòu huìyì zài jìxù.',
    vi: 'Giám đốc nói nghỉ mười phút trước đã, sau đó cuộc họp sẽ tiếp tục.',
  },
  {
    hanzi: '这家公司离我家很近，我每天走路去上班。',
    pinyin: 'Zhè jiā gōngsī lí wǒ jiā hěn jìn, wǒ měi tiān zǒu lù qù shàngbān.',
    vi: 'Công ty này gần nhà tôi, ngày nào tôi cũng đi bộ đi làm.',
  },
  {
    hanzi: '弟弟对什么都很好奇，每天都问妈妈很多问题。',
    pinyin: 'Dìdi duì shénme dōu hěn hàoqí, měi tiān dōu wèn māma hěn duō wèntí.',
    vi: 'Em trai tò mò với mọi thứ, ngày nào cũng hỏi mẹ rất nhiều câu.',
  },
  {
    hanzi: '去国外留学的费用很高，爸爸妈妈准备了很多年。',
    pinyin: 'Qù guówài liúxué de fèiyòng hěn gāo, bàba māma zhǔnbèi le hěn duō nián.',
    vi: 'Chi phí đi du học nước ngoài rất cao, bố mẹ đã chuẩn bị nhiều năm.',
  },
  {
    hanzi: '比赛开始以前，体育馆里已经坐满了观众。',
    pinyin: 'Bǐsài kāishǐ yǐqián, tǐyùguǎn li yǐjīng zuò mǎn le guānzhòng.',
    vi: 'Trước khi trận đấu bắt đầu, nhà thi đấu đã chật kín khán giả.',
  },
  {
    hanzi: '我和同事们是好朋友，工作的时候经常互相帮助。',
    pinyin: 'Wǒ hé tóngshìmen shì hǎo péngyou, gōngzuò de shíhou jīngcháng hùxiāng bāngzhù.',
    vi: 'Tôi và các đồng nghiệp là bạn tốt, lúc làm việc thường giúp đỡ lẫn nhau.',
  },
  {
    hanzi: '你不想去就别去了，反正明天还有时间。',
    pinyin: 'Nǐ bù xiǎng qù jiù bié qù le, fǎnzhèng míngtiān hái yǒu shíjiān.',
    vi: 'Bạn không muốn đi thì thôi đừng đi, đằng nào mai cũng còn thời gian.',
  },
  {
    hanzi: '昨天晚上下雨了，我穿得太少，今天早上就感冒了。',
    pinyin: 'Zuótiān wǎnshang xià yǔ le, wǒ chuān de tài shǎo, jīntiān zǎoshang jiù gǎnmào le.',
    vi: 'Tối qua trời mưa, tôi mặc phong phanh quá, sáng nay liền bị cảm.',
  },
  {
    hanzi: '这个电影是中国和法国的导演一起合作的。',
    pinyin: 'Zhège diànyǐng shì Zhōngguó hé Fǎguó de dǎoyǎn yìqǐ hézuò de.',
    vi: 'Bộ phim này do đạo diễn Trung Quốc và đạo diễn Pháp cùng hợp tác làm.',
  },
  {
    hanzi: '学校规定每个学生早上七点半以前要到教室。',
    pinyin: 'Xuéxiào guīdìng měi ge xuésheng zǎoshang qī diǎn bàn yǐqián yào dào jiàoshì.',
    vi: 'Nhà trường quy định mỗi học sinh phải có mặt ở lớp trước bảy giờ rưỡi sáng.',
  },
  {
    hanzi: '妈妈今天做的晚饭非常丰富，有鱼有肉还有很多菜。',
    pinyin: 'Māma jīntiān zuò de wǎnfàn fēicháng fēngfù, yǒu yú yǒu ròu hái yǒu hěn duō cài.',
    vi: 'Bữa tối mẹ nấu hôm nay rất thịnh soạn, có cá có thịt lại còn nhiều rau.',
  },
  {
    hanzi: '他说他昨天来过，可是我根本没有看见他。',
    pinyin: 'Tā shuō tā zuótiān lái guo, kěshì wǒ gēnběn méiyǒu kànjiàn tā.',
    vi: 'Anh ấy nói hôm qua đã đến, nhưng tôi hoàn toàn không thấy anh ấy.',
  },
  {
    hanzi: '学习汉语一定要坚持，每天都学习，慢慢就会说得很好。',
    pinyin: 'Xuéxí Hànyǔ yídìng yào jiānchí, měi tiān dōu xuéxí, mànmàn jiù huì shuō de hěn hǎo.',
    vi: 'Học tiếng Trung nhất định phải kiên trì, ngày nào cũng học thì dần dần sẽ nói rất giỏi.',
  },
  {
    hanzi: '这家超市很大，里面有各种水果，也有各种牛奶和咖啡。',
    pinyin: 'Zhè jiā chāoshì hěn dà, lǐmiàn yǒu gèzhǒng shuǐguǒ, yě yǒu gèzhǒng niúnǎi hé kāfēi.',
    vi: 'Siêu thị này rất lớn, bên trong có đủ loại hoa quả, cũng có đủ loại sữa và cà phê.',
  },
];

export default sentences;
