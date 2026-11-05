/**
 * Câu dài tập gõ pinyin cho bài 9: mỗi câu ghép vài từ mới của bài (20 từ HSK 3
 * 定期 … 反对) với từ HSK 1–2. Pinyin viết tay theo cách đọc thật (一 / 不 đã
 * biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '爸爸妈妈每年都定期去医院检查身体，大夫说他们身体很好。',
    pinyin: 'Bàba māma měi nián dōu dìngqī qù yīyuàn jiǎnchá shēntǐ, dàifu shuō tāmen shēntǐ hěn hǎo.',
    vi: 'Năm nào bố mẹ cũng đi bệnh viện khám sức khỏe định kỳ, bác sĩ nói sức khỏe của họ rất tốt.',
  },
  {
    hanzi: '我的老家在中国东部的一个小城市，那里夏天非常热。',
    pinyin: 'Wǒ de lǎojiā zài Zhōngguó dōngbù de yí ge xiǎo chéngshì, nàlǐ xiàtiān fēicháng rè.',
    vi: 'Quê tôi ở một thành phố nhỏ miền đông Trung Quốc, ở đó mùa hè cực kỳ nóng.',
  },
  {
    hanzi: '这个电视剧讲了一个很动人的故事，我看了两遍都哭了。',
    pinyin: 'Zhège diànshìjù jiǎng le yí ge hěn dòngrén de gùshi, wǒ kàn le liǎng biàn dōu kū le.',
    vi: 'Bộ phim truyền hình này kể một câu chuyện rất cảm động, tôi xem hai lần đều khóc.',
  },
  {
    hanzi: '这本书写得很好，很多年轻读者都说自己非常喜欢。',
    pinyin: 'Zhè běn shū xiě de hěn hǎo, hěn duō niánqīng dúzhě dōu shuō zìjǐ fēicháng xǐhuan.',
    vi: 'Cuốn sách này viết rất hay, nhiều độc giả trẻ đều nói mình cực kỳ thích.',
  },
  {
    hanzi: '每个人都有长处和短处，我们要多看别人的长处。',
    pinyin: 'Měi ge rén dōu yǒu chángchù hé duǎnchù, wǒmen yào duō kàn biéren de chángchù.',
    vi: 'Ai cũng có điểm mạnh và điểm yếu, chúng ta nên nhìn nhiều vào điểm mạnh của người khác.',
  },
  {
    hanzi: '夏天到了，弟弟每天都穿短裤和白衬衫去学校。',
    pinyin: 'Xiàtiān dào le, dìdi měi tiān dōu chuān duǎnkù hé bái chènshān qù xuéxiào.',
    vi: 'Mùa hè đến rồi, ngày nào em trai cũng mặc quần đùi và áo sơ mi trắng đến trường.',
  },
  {
    hanzi: '我在北京上了一个短期汉语班，每天学习四个小时。',
    pinyin: 'Wǒ zài Běijīng shàng le yí ge duǎnqī Hànyǔ bān, měi tiān xuéxí sì ge xiǎoshí.',
    vi: 'Tôi học một lớp tiếng Trung ngắn hạn ở Bắc Kinh, mỗi ngày học bốn tiếng.',
  },
  {
    hanzi: '他踢足球的时候腿断了，大夫让他在家休息两个月。',
    pinyin: 'Tā tī zúqiú de shíhou tuǐ duàn le, dàifu ràng tā zài jiā xiūxi liǎng ge yuè.',
    vi: 'Lúc đá bóng anh ấy bị gãy chân, bác sĩ bảo anh ấy nghỉ ở nhà hai tháng.',
  },
  {
    hanzi: '我们排球队的队员每天下午都在学校练习两个小时。',
    pinyin: 'Wǒmen páiqiú duì de duìyuán měi tiān xiàwǔ dōu zài xuéxiào liànxí liǎng ge xiǎoshí.',
    vi: 'Chiều nào các đội viên đội bóng chuyền của chúng tôi cũng tập ở trường hai tiếng.',
  },
  {
    hanzi: '她对待每个人都很好，所以大家都愿意跟她做朋友。',
    pinyin: 'Tā duìdài měi ge rén dōu hěn hǎo, suǒyǐ dàjiā dōu yuànyì gēn tā zuò péngyou.',
    vi: 'Cô ấy đối xử với ai cũng rất tốt, nên mọi người đều muốn làm bạn với cô ấy.',
  },
  {
    hanzi: '打电话的时候一定要听清楚对方说的话，不要着急。',
    pinyin: 'Dǎ diànhuà de shíhou yídìng yào tīng qīngchu duìfāng shuō de huà, bú yào zháojí.',
    vi: 'Khi gọi điện nhất định phải nghe rõ đối phương nói gì, đừng vội.',
  },
  {
    hanzi: '我们下个星期的对手比我们高很多，大家都要认真准备。',
    pinyin: 'Wǒmen xià ge xīngqī de duìshǒu bǐ wǒmen gāo hěn duō, dàjiā dōu yào rènzhēn zhǔnbèi.',
    vi: 'Đối thủ tuần sau cao hơn chúng tôi nhiều, mọi người đều phải chuẩn bị nghiêm túc.',
  },
  {
    hanzi: '姐姐的对象是一个医生，他们打算明年秋天一起搬到北京。',
    pinyin: 'Jiějie de duìxiàng shì yí ge yīshēng, tāmen dǎsuàn míngnián qiūtiān yìqǐ bān dào Běijīng.',
    vi: 'Người yêu của chị gái là bác sĩ, họ định mùa thu năm sau cùng chuyển đến Bắc Kinh.',
  },
  {
    hanzi: '周末我请几个好朋友来我家吃了一顿饭，大家都很高兴。',
    pinyin: 'Zhōumò wǒ qǐng jǐ ge hǎo péngyou lái wǒ jiā chī le yí dùn fàn, dàjiā dōu hěn gāoxìng.',
    vi: 'Cuối tuần tôi mời mấy người bạn thân đến nhà ăn một bữa, mọi người đều rất vui.',
  },
  {
    hanzi: '他在网上发表了一篇日记，第二天就有很多人看了。',
    pinyin: 'Tā zài wǎng shang fābiǎo le yì piān rìjì, dì èr tiān jiù yǒu hěn duō rén kàn le.',
    vi: 'Anh ấy đăng một bài nhật ký lên mạng, ngày hôm sau đã có rất nhiều người đọc.',
  },
  {
    hanzi: '我昨天晚上给老师发出了电子邮件，可是他还没有回我。',
    pinyin: 'Wǒ zuótiān wǎnshang gěi lǎoshī fāchū le diànzǐ yóujiàn, kěshì tā hái méiyǒu huí wǒ.',
    vi: 'Tối qua tôi đã gửi email cho thầy, nhưng thầy vẫn chưa trả lời tôi.',
  },
  {
    hanzi: '你知道电话是谁发明的吗？我们明天上课的时候要回答这个问题。',
    pinyin: 'Nǐ zhīdào diànhuà shì shéi fāmíng de ma? Wǒmen míngtiān shàngkè de shíhou yào huídá zhège wèntí.',
    vi: 'Bạn có biết ai phát minh ra điện thoại không? Ngày mai lúc lên lớp chúng tôi phải trả lời câu hỏi này.',
  },
  {
    hanzi: '昨天路上发生了一件事，所以我到公司的时候已经十点了。',
    pinyin: 'Zuótiān lùshang fāshēng le yí jiàn shì, suǒyǐ wǒ dào gōngsī de shíhou yǐjīng shí diǎn le.',
    vi: 'Hôm qua trên đường xảy ra một chuyện, nên lúc tôi đến công ty đã mười giờ.',
  },
  {
    hanzi: '这几年我们的小城市发展得非常快，路也变得比以前好多了。',
    pinyin: 'Zhè jǐ nián wǒmen de xiǎo chéngshì fāzhǎn de fēicháng kuài, lù yě biàn de bǐ yǐqián hǎo duō le.',
    vi: 'Mấy năm nay thành phố nhỏ của chúng tôi phát triển rất nhanh, đường sá cũng tốt hơn trước nhiều.',
  },
  {
    hanzi: '我想一个人去南方旅游，可是爸爸妈妈都反对。',
    pinyin: 'Wǒ xiǎng yí ge rén qù nánfāng lǚyóu, kěshì bàba māma dōu fǎnduì.',
    vi: 'Tôi muốn một mình đi du lịch phương Nam, nhưng bố mẹ đều phản đối.',
  },
];

export default sentences;
