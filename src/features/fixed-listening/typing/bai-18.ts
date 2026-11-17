/**
 * Câu dài tập gõ pinyin cho bài 18: mỗi câu ghép từ mới của bài (20 từ HSK 3
 * về quê hương, đi xa và thế giới: 行李、首都、农村、家乡、互联网、左右 … 光、火)
 * với từ HSK 1–2. Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh
 * nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '这次出去旅游，我的行李太多了，一个人根本拿不动。',
    pinyin: 'Zhè cì chūqù lǚyóu, wǒ de xíngli tài duō le, yí ge rén gēnběn ná bu dòng.',
    vi: 'Chuyến du lịch lần này hành lý của tôi nhiều quá, một mình hoàn toàn không xách nổi.',
  },
  {
    hanzi: '北京是中国的首都，每年都有很多外国人来这里旅游。',
    pinyin: 'Běijīng shì Zhōngguó de shǒudū, měi nián dōu yǒu hěn duō wàiguórén lái zhèlǐ lǚyóu.',
    vi: 'Bắc Kinh là thủ đô của Trung Quốc, năm nào cũng có rất nhiều người nước ngoài đến đây du lịch.',
  },
  {
    hanzi: '我爷爷奶奶一直住在农村，他们说那里的空气比城市好多了。',
    pinyin: 'Wǒ yéye nǎinai yìzhí zhù zài nóngcūn, tāmen shuō nàlǐ de kōngqì bǐ chéngshì hǎo duō le.',
    vi: 'Ông bà tôi vẫn luôn sống ở nông thôn, họ nói không khí ở đó trong lành hơn thành phố nhiều.',
  },
  {
    hanzi: '我已经两年没有回家乡了，真想快点回去看看父母。',
    pinyin: 'Wǒ yǐjīng liǎng nián méiyǒu huí jiāxiāng le, zhēn xiǎng kuài diǎn huíqù kànkan fùmǔ.',
    vi: 'Đã hai năm tôi chưa về quê, thật muốn mau về thăm bố mẹ.',
  },
  {
    hanzi: '我的愿望是在三十岁以前去世界上很多地方看看。',
    pinyin: 'Wǒ de yuànwàng shì zài sānshí suì yǐqián qù shìjiè shang hěn duō dìfang kànkan.',
    vi: 'Mong ước của tôi là trước ba mươi tuổi được đi xem thật nhiều nơi trên thế giới.',
  },
  {
    hanzi: '学习一种语言的时候，也应该了解一下那个国家的文化。',
    pinyin: 'Xuéxí yì zhǒng yǔyán de shíhou, yě yīnggāi liǎojiě yíxià nàge guójiā de wénhuà.',
    vi: 'Khi học một ngôn ngữ, cũng nên tìm hiểu văn hóa của đất nước đó.',
  },
  {
    hanzi: '上海是一个非常现代的城市，到了晚上特别漂亮。',
    pinyin: 'Shànghǎi shì yí ge fēicháng xiàndài de chéngshì, dào le wǎnshang tèbié piàoliang.',
    vi: 'Thượng Hải là một thành phố rất hiện đại, về đêm đặc biệt đẹp.',
  },
  {
    hanzi: '我的母亲是一名医生，她每天都工作到很晚才回家。',
    pinyin: 'Wǒ de mǔqīn shì yì míng yīshēng, tā měi tiān dōu gōngzuò dào hěn wǎn cái huí jiā.',
    vi: 'Mẹ tôi là bác sĩ, ngày nào mẹ cũng làm việc đến rất khuya mới về nhà.',
  },
  {
    hanzi: '有了互联网以后，我们在家里就可以买到世界各地的东西。',
    pinyin: 'Yǒu le hùliánwǎng yǐhòu, wǒmen zài jiā li jiù kěyǐ mǎi dào shìjiè gèdì de dōngxi.',
    vi: 'Từ khi có Internet, ở nhà chúng ta cũng mua được đồ từ khắp nơi trên thế giới.',
  },
  {
    hanzi: '我昨天给你发了一个消息，你怎么到现在还没有回我？',
    pinyin: 'Wǒ zuótiān gěi nǐ fā le yí ge xiāoxi, nǐ zěnme dào xiànzài hái méiyǒu huí wǒ?',
    vi: 'Hôm qua tôi nhắn tin cho bạn, sao đến giờ bạn vẫn chưa trả lời tôi?',
  },
  {
    hanzi: '你从这里一直往前走，到了第二个路口再向左转。',
    pinyin: 'Nǐ cóng zhèlǐ yìzhí wǎng qián zǒu, dào le dì èr ge lùkǒu zài xiàng zuǒ zhuǎn.',
    vi: 'Bạn cứ đi thẳng từ đây, đến ngã tư thứ hai thì rẽ trái.',
  },
  {
    hanzi: '从我家到公司坐地铁要四十分钟左右，开车会更慢。',
    pinyin: 'Cóng wǒ jiā dào gōngsī zuò dìtiě yào sìshí fēnzhōng zuǒyòu, kāichē huì gèng màn.',
    vi: 'Từ nhà tôi đến công ty đi tàu điện ngầm mất khoảng bốn mươi phút, lái xe còn chậm hơn.',
  },
  {
    hanzi: '昨天晚上我一直在等你的电话，直到十一点才去睡觉。',
    pinyin: 'Zuótiān wǎnshang wǒ yìzhí zài děng nǐ de diànhuà, zhídào shíyī diǎn cái qù shuìjiào.',
    vi: 'Tối qua tôi cứ chờ điện thoại của bạn, mãi đến mười một giờ mới đi ngủ.',
  },
  {
    hanzi: '他每天都认真练习说汉语，因此他的汉语说得非常流利。',
    pinyin: 'Tā měi tiān dōu rènzhēn liànxí shuō Hànyǔ, yīncǐ tā de Hànyǔ shuō de fēicháng liúlì.',
    vi: 'Ngày nào anh ấy cũng chăm chỉ luyện nói tiếng Trung, vì vậy anh ấy nói rất lưu loát.',
  },
  {
    hanzi: '由于昨天晚上下了大雪，很多飞机都不能按时起飞。',
    pinyin: 'Yóuyú zuótiān wǎnshang xià le dà xuě, hěn duō fēijī dōu bù néng ànshí qǐfēi.',
    vi: 'Do tối qua tuyết rơi dày, nhiều chuyến bay không thể cất cánh đúng giờ.',
  },
  {
    hanzi: '据说这个地方的冬天特别冷，你一定要多穿点衣服。',
    pinyin: 'Jùshuō zhège dìfang de dōngtiān tèbié lěng, nǐ yídìng yào duō chuān diǎn yīfu.',
    vi: 'Nghe nói mùa đông ở đây đặc biệt lạnh, bạn nhất định phải mặc thêm áo.',
  },
  {
    hanzi: '现在的社会发展得很快，我们每个人都要不停地学习。',
    pinyin: 'Xiànzài de shèhuì fāzhǎn de hěn kuài, wǒmen měi ge rén dōu yào bù tíng de xuéxí.',
    vi: 'Xã hội bây giờ phát triển rất nhanh, mỗi người chúng ta đều phải không ngừng học hỏi.',
  },
  {
    hanzi: '为了环保，我每天都骑自行车上班，很少开车出门。',
    pinyin: 'Wèile huánbǎo, wǒ měi tiān dōu qí zìxíngchē shàngbān, hěn shǎo kāichē chūmén.',
    vi: 'Để bảo vệ môi trường, ngày nào tôi cũng đạp xe đi làm, rất ít khi lái xe ra ngoài.',
  },
  {
    hanzi: '这个月我买了太多东西，钱都花光了，只好在家吃面条。',
    pinyin: 'Zhège yuè wǒ mǎi le tài duō dōngxi, qián dōu huā guāng le, zhǐhǎo zài jiā chī miàntiáo.',
    vi: 'Tháng này tôi mua quá nhiều đồ, tiêu hết sạch tiền, đành ở nhà ăn mì.',
  },
  {
    hanzi: '这首歌最近在网上特别火，我身边的朋友都会唱。',
    pinyin: 'Zhè shǒu gē zuìjìn zài wǎng shang tèbié huǒ, wǒ shēnbiān de péngyou dōu huì chàng.',
    vi: 'Bài hát này dạo gần đây rất hot trên mạng, bạn bè xung quanh tôi ai cũng biết hát.',
  },
];

export default sentences;
