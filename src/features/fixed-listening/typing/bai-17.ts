/**
 * Câu dài tập gõ pinyin cho bài 17: mỗi câu ghép một từ mới của bài (chủ đề con người
 * và tính cách: 性格、亲切、姑娘、记者、警察、批评 …) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我姐姐的性格很好，对每个人都很热情。',
    pinyin: 'Wǒ jiějie de xìnggé hěn hǎo, duì měi ge rén dōu hěn rèqíng.',
    vi: 'Chị gái tôi tính tình rất tốt, với ai cũng nhiệt tình.',
  },
  {
    hanzi: '新来的王老师说话很亲切，同学们都很喜欢她。',
    pinyin: 'Xīn lái de Wáng lǎoshī shuōhuà hěn qīnqiè, tóngxuémen dōu hěn xǐhuan tā.',
    vi: 'Cô giáo Vương mới đến nói chuyện rất thân thiện, các bạn học đều rất quý cô.',
  },
  {
    hanzi: '那个穿白裙子的姑娘是我们公司新来的同事。',
    pinyin: 'Nàge chuān bái qúnzi de gūniang shì wǒmen gōngsī xīn lái de tóngshì.',
    vi: 'Cô gái mặc váy trắng kia là đồng nghiệp mới đến của công ty chúng tôi.',
  },
  {
    hanzi: '这只是我个人的意见，大家可以再想想。',
    pinyin: 'Zhè zhǐ shì wǒ gèrén de yìjiàn, dàjiā kěyǐ zài xiǎngxiang.',
    vi: 'Đây chỉ là ý kiến cá nhân của tôi, mọi người có thể nghĩ thêm.',
  },
  {
    hanzi: '他们是十年的老朋友了，感情一直非常好。',
    pinyin: 'Tāmen shì shí nián de lǎo péngyou le, gǎnqíng yìzhí fēicháng hǎo.',
    vi: 'Họ là bạn cũ mười năm rồi, tình cảm lúc nào cũng rất tốt.',
  },
  {
    hanzi: '听到这个消息以后，她伤心地哭了很长时间。',
    pinyin: 'Tīngdào zhège xiāoxi yǐhòu, tā shāngxīn de kū le hěn cháng shíjiān.',
    vi: 'Nghe tin này xong, cô ấy đau lòng khóc rất lâu.',
  },
  {
    hanzi: '一家人能在一起吃晚饭，我觉得这就是幸福。',
    pinyin: 'Yì jiā rén néng zài yìqǐ chī wǎnfàn, wǒ juéde zhè jiù shì xìngfú.',
    vi: 'Cả nhà được ngồi ăn tối cùng nhau, tôi thấy đó chính là hạnh phúc.',
  },
  {
    hanzi: '第一次见面的时候，他给我留下了很好的印象。',
    pinyin: 'Dì yī cì jiànmiàn de shíhou, tā gěi wǒ liúxià le hěn hǎo de yìnxiàng.',
    vi: 'Lần đầu gặp mặt, anh ấy đã để lại cho tôi ấn tượng rất tốt.',
  },
  {
    hanzi: '我想了很久也没有好主意，你能帮帮我吗？',
    pinyin: 'Wǒ xiǎng le hěn jiǔ yě méiyǒu hǎo zhǔyi, nǐ néng bāngbang wǒ ma?',
    vi: 'Tôi nghĩ mãi mà không ra cách nào hay, bạn giúp tôi được không?',
  },
  {
    hanzi: '爷爷虽然年纪大了，但是身体还非常好。',
    pinyin: 'Yéye suīrán niánjì dà le, dànshì shēntǐ hái fēicháng hǎo.',
    vi: 'Ông nội tuy đã lớn tuổi nhưng sức khỏe vẫn rất tốt.',
  },
  {
    hanzi: '这个城市非常美丽，每年都有很多人来这里旅游。',
    pinyin: 'Zhège chéngshì fēicháng měilì, měi nián dōu yǒu hěn duō rén lái zhèlǐ lǚyóu.',
    vi: 'Thành phố này rất đẹp, năm nào cũng có rất nhiều người đến đây du lịch.',
  },
  {
    hanzi: '我姐姐是一个记者，她每天都要写很多文章。',
    pinyin: 'Wǒ jiějie shì yí ge jìzhě, tā měi tiān dōu yào xiě hěn duō wénzhāng.',
    vi: 'Chị gái tôi là phóng viên, ngày nào chị cũng phải viết rất nhiều bài.',
  },
  {
    hanzi: '这个电影里的演员都很年轻，演得也非常好。',
    pinyin: 'Zhège diànyǐng li de yǎnyuán dōu hěn niánqīng, yǎn de yě fēicháng hǎo.',
    vi: 'Các diễn viên trong bộ phim này đều rất trẻ, diễn cũng rất hay.',
  },
  {
    hanzi: '我的手机不见了，我们快去找警察帮忙吧。',
    pinyin: 'Wǒ de shǒujī bú jiàn le, wǒmen kuài qù zhǎo jǐngchá bāngmáng ba.',
    vi: 'Điện thoại của tôi mất rồi, chúng ta mau đi nhờ cảnh sát giúp đi.',
  },
  {
    hanzi: '他做事一直很认真，所以老板非常信任他。',
    pinyin: 'Tā zuò shì yìzhí hěn rènzhēn, suǒyǐ lǎobǎn fēicháng xìnrèn tā.',
    vi: 'Anh ấy làm việc luôn rất nghiêm túc, nên sếp rất tin tưởng anh ấy.',
  },
  {
    hanzi: '我妹妹很怕黑，晚上不敢一个人出去。',
    pinyin: 'Wǒ mèimei hěn pà hēi, wǎnshang bù gǎn yí ge rén chūqù.',
    vi: 'Em gái tôi rất sợ tối, buổi tối không dám ra ngoài một mình.',
  },
  {
    hanzi: '外面太吵了，你能把窗户关上吗？',
    pinyin: 'Wàimiàn tài chǎo le, nǐ néng bǎ chuānghu guānshàng ma?',
    vi: 'Bên ngoài ồn quá, bạn đóng cửa sổ lại được không?',
  },
  {
    hanzi: '他今天上班又迟到了，被经理批评了一顿。',
    pinyin: 'Tā jīntiān shàngbān yòu chídào le, bèi jīnglǐ pīpíng le yí dùn.',
    vi: 'Hôm nay anh ấy đi làm lại đến muộn, bị giám đốc mắng cho một trận.',
  },
  {
    hanzi: '我最大的愿望是以后能带父母去中国旅游。',
    pinyin: 'Wǒ zuì dà de yuànwàng shì yǐhòu néng dài fùmǔ qù Zhōngguó lǚyóu.',
    vi: 'Mong ước lớn nhất của tôi là sau này được đưa bố mẹ đi du lịch Trung Quốc.',
  },
  {
    hanzi: '这个学生在比赛中表现得很好，老师非常高兴。',
    pinyin: 'Zhège xuésheng zài bǐsài zhōng biǎoxiàn de hěn hǎo, lǎoshī fēicháng gāoxìng.',
    vi: 'Học sinh này thể hiện rất tốt trong cuộc thi, thầy giáo rất vui.',
  },
];

export default sentences;
