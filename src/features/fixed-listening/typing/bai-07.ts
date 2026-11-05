/**
 * Câu dài tập gõ pinyin cho bài 7: mỗi câu ghép một hai từ mới của bài (20 từ
 * HSK 3 初级 … 大夫) với từ HSK 1–2. Pinyin viết tay theo cách đọc thật (一 / 不
 * đã biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我妹妹今年上初中了，每天早上六点就起床去学校。',
    pinyin: 'Wǒ mèimei jīnnián shàng chūzhōng le, měi tiān zǎoshang liù diǎn jiù qǐchuáng qù xuéxiào.',
    vi: 'Em gái tôi năm nay lên cấp hai, sáng nào cũng sáu giờ đã dậy đi học.',
  },
  {
    hanzi: '我学了一年初级汉语，现在已经能跟中国朋友说话了。',
    pinyin: 'Wǒ xué le yì nián chūjí Hànyǔ, xiànzài yǐjīng néng gēn Zhōngguó péngyou shuōhuà le.',
    vi: 'Tôi học tiếng Trung sơ cấp một năm, giờ đã nói chuyện được với bạn Trung Quốc.',
  },
  {
    hanzi: '除了星期天，他每天下午都要去公司工作四个小时。',
    pinyin: 'Chúle xīngqītiān, tā měi tiān xiàwǔ dōu yào qù gōngsī gōngzuò sì ge xiǎoshí.',
    vi: 'Trừ chủ nhật ra, chiều nào anh ấy cũng phải đến công ty làm bốn tiếng.',
  },
  {
    hanzi: '这个问题不太好处理，我们明天再去问问老师吧。',
    pinyin: 'Zhège wèntí bú tài hǎo chǔlǐ, wǒmen míngtiān zài qù wènwen lǎoshī ba.',
    vi: 'Vấn đề này không dễ xử lý lắm, mai chúng ta lại đi hỏi thầy nhé.',
  },
  {
    hanzi: '晚上十点多，楼上传来了很大的音乐声，我一点也睡不着。',
    pinyin: 'Wǎnshang shí diǎn duō, lóu shang chuánlái le hěn dà de yīnyuè shēng, wǒ yìdiǎn yě shuì bu zháo.',
    vi: 'Hơn mười giờ tối, trên lầu vọng xuống tiếng nhạc rất to, tôi chẳng ngủ được chút nào.',
  },
  {
    hanzi: '我小时候常常听奶奶讲这个传说，现在还记得很清楚。',
    pinyin: 'Wǒ xiǎoshíhou chángcháng tīng nǎinai jiǎng zhège chuánshuō, xiànzài hái jìde hěn qīngchu.',
    vi: 'Hồi nhỏ tôi hay nghe bà kể truyền thuyết này, đến giờ vẫn nhớ rất rõ.',
  },
  {
    hanzi: '他二十五岁就开始创业，现在已经有了自己的公司。',
    pinyin: 'Tā èrshíwǔ suì jiù kāishǐ chuàngyè, xiànzài yǐjīng yǒu le zìjǐ de gōngsī.',
    vi: 'Anh ấy hai mươi lăm tuổi đã bắt đầu khởi nghiệp, giờ đã có công ty riêng.',
  },
  {
    hanzi: '这个城市的年轻人用自己的努力创造了很多新的东西。',
    pinyin: 'Zhège chéngshì de niánqīngrén yòng zìjǐ de nǔlì chuàngzào le hěn duō xīn de dōngxi.',
    vi: 'Người trẻ ở thành phố này đã dùng sự cố gắng của mình tạo ra rất nhiều điều mới.',
  },
  {
    hanzi: '我从来没吃过这么好吃的面条，明天还要再来一次。',
    pinyin: 'Wǒ cónglái méi chī guo zhème hǎochī de miàntiáo, míngtiān hái yào zài lái yí cì.',
    vi: 'Tôi chưa từng ăn món mì nào ngon như thế, mai còn muốn đến lần nữa.',
  },
  {
    hanzi: '从前这里只有几家小商店，现在已经是一个很大的城市了。',
    pinyin: 'Cóngqián zhèlǐ zhǐ yǒu jǐ jiā xiǎo shāngdiàn, xiànzài yǐjīng shì yí ge hěn dà de chéngshì le.',
    vi: 'Ngày xưa ở đây chỉ có vài cửa hàng nhỏ, giờ đã là một thành phố rất lớn.',
  },
  {
    hanzi: '我爷爷奶奶住在一个很远的小村里，我们每年都回去看他们。',
    pinyin: 'Wǒ yéye nǎinai zhù zài yí ge hěn yuǎn de xiǎo cūn li, wǒmen měi nián dōu huíqu kàn tāmen.',
    vi: 'Ông bà tôi sống ở một ngôi làng nhỏ rất xa, năm nào chúng tôi cũng về thăm ông bà.',
  },
  {
    hanzi: '他每个月都在银行里存一半的钱，想以后买一个大房子。',
    pinyin: 'Tā měi ge yuè dōu zài yínháng li cún yíbàn de qián, xiǎng yǐhòu mǎi yí ge dà fángzi.',
    vi: 'Tháng nào anh ấy cũng gửi một nửa số tiền vào ngân hàng, muốn sau này mua một căn nhà lớn.',
  },
  {
    hanzi: '这篇作业里有好几个错误，老师让我回家以后再写一次。',
    pinyin: 'Zhè piān zuòyè li yǒu hǎo jǐ ge cuòwù, lǎoshī ràng wǒ huí jiā yǐhòu zài xiě yí cì.',
    vi: 'Bài tập này có mấy lỗi liền, thầy bảo tôi về nhà viết lại lần nữa.',
  },
  {
    hanzi: '努力学习了两年以后，他的汉语已经达到了很高的水平。',
    pinyin: 'Nǔlì xuéxí le liǎng nián yǐhòu, tā de Hànyǔ yǐjīng dádào le hěn gāo de shuǐpíng.',
    vi: 'Sau hai năm chăm chỉ học, tiếng Trung của anh ấy đã đạt trình độ rất cao.',
  },
  {
    hanzi: '弟弟在房间里踢球，不小心打破了妈妈最喜欢的杯子。',
    pinyin: 'Dìdi zài fángjiān li tī qiú, bù xiǎoxīn dǎpò le māma zuì xǐhuan de bēizi.',
    vi: 'Em trai đá bóng trong phòng, không cẩn thận làm vỡ cái cốc mẹ thích nhất.',
  },
  {
    hanzi: '我刚来北京的时候，常常向路上的人打听去火车站怎么走。',
    pinyin: 'Wǒ gāng lái Běijīng de shíhou, chángcháng xiàng lùshang de rén dǎting qù huǒchēzhàn zěnme zǒu.',
    vi: 'Hồi mới đến Bắc Kinh, tôi hay hỏi người đi đường đường đến ga tàu đi thế nào.',
  },
  {
    hanzi: '从我家走到学校大概要二十分钟，坐公交车只要五分钟。',
    pinyin: 'Cóng wǒ jiā zǒu dào xuéxiào dàgài yào èrshí fēnzhōng, zuò gōngjiāochē zhǐ yào wǔ fēnzhōng.',
    vi: 'Từ nhà tôi đi bộ đến trường mất khoảng hai mươi phút, đi xe buýt chỉ năm phút.',
  },
  {
    hanzi: '如果你的护照不见了，要马上去大使馆请他们帮忙。',
    pinyin: 'Rúguǒ nǐ de hùzhào bú jiàn le, yào mǎshàng qù dàshǐguǎn qǐng tāmen bāngmáng.',
    vi: 'Nếu bạn bị mất hộ chiếu, phải lập tức đến đại sứ quán nhờ họ giúp.',
  },
  {
    hanzi: '这次来参加比赛的学生大约有三百个，比去年多了很多。',
    pinyin: 'Zhè cì lái cānjiā bǐsài de xuésheng dàyuē yǒu sānbǎi ge, bǐ qùnián duō le hěn duō.',
    vi: 'Lần này có khoảng ba trăm học sinh đến dự thi, nhiều hơn năm ngoái rất nhiều.',
  },
  {
    hanzi: '大夫说他的病不太重，回家吃点药，好好休息几天就好了。',
    pinyin: 'Dàifu shuō tā de bìng bú tài zhòng, huí jiā chī diǎn yào, hǎohǎo xiūxi jǐ tiān jiù hǎo le.',
    vi: 'Bác sĩ nói bệnh của anh ấy không nặng lắm, về nhà uống chút thuốc, nghỉ ngơi vài ngày là khỏi.',
  },
];

export default sentences;
