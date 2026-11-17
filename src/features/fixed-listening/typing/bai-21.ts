/**
 * Câu dài tập gõ pinyin cho bài 21: mỗi câu ghép từ mới của bài (thư từ, lời chúc,
 * thói quen tốt: 信、祝、按照、保持、目标、首先 …) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '请大家按照老师说的去做，明天把作业交给我。',
    pinyin: 'Qǐng dàjiā ànzhào lǎoshī shuō de qù zuò, míngtiān bǎ zuòyè jiāo gěi wǒ.',
    vi: 'Mọi người hãy làm theo lời thầy nói, ngày mai nộp bài tập cho tôi.',
  },
  {
    hanzi: '虽然我们不在一个城市，但是我们一直保持联系。',
    pinyin: 'Suīrán wǒmen bú zài yí ge chéngshì, dànshì wǒmen yìzhí bǎochí liánxì.',
    vi: 'Tuy chúng tôi không ở cùng một thành phố, nhưng vẫn luôn giữ liên lạc với nhau.',
  },
  {
    hanzi: '我的汉语还不太好，有时候不知道怎么表达自己的意思。',
    pinyin: 'Wǒ de Hànyǔ hái bú tài hǎo, yǒushíhou bù zhīdào zěnme biǎodá zìjǐ de yìsi.',
    vi: 'Tiếng Trung của tôi còn chưa tốt lắm, có lúc không biết diễn đạt ý mình thế nào.',
  },
  {
    hanzi: '明天开会的时候，经理希望每个人都能发言。',
    pinyin: 'Míngtiān kāihuì de shíhou, jīnglǐ xīwàng měi ge rén dōu néng fāyán.',
    vi: 'Lúc họp ngày mai, giám đốc mong ai cũng phát biểu.',
  },
  {
    hanzi: '我下个星期要去办理护照，所以不能来上课了。',
    pinyin: 'Wǒ xià ge xīngqī yào qù bànlǐ hùzhào, suǒyǐ bù néng lái shàngkè le.',
    vi: 'Tuần sau tôi phải đi làm hộ chiếu, nên không đến lớp được.',
  },
  {
    hanzi: '老师问了一个问题，他的反应很快，马上就回答了。',
    pinyin: 'Lǎoshī wèn le yí ge wèntí, tā de fǎnyìng hěn kuài, mǎshàng jiù huídá le.',
    vi: 'Thầy giáo hỏi một câu, cậu ấy phản ứng rất nhanh, trả lời ngay.',
  },
  {
    hanzi: '第一次来中国的时候，我感受到了中国人的热情。',
    pinyin: 'Dì yī cì lái Zhōngguó de shíhou, wǒ gǎnshòu dào le Zhōngguórén de rèqíng.',
    vi: 'Lần đầu đến Trung Quốc, tôi cảm nhận được sự nhiệt tình của người Trung Quốc.',
  },
  {
    hanzi: '听了老师的话以后，他学习比以前更加努力了。',
    pinyin: 'Tīng le lǎoshī de huà yǐhòu, tā xuéxí bǐ yǐqián gèngjiā nǔlì le.',
    vi: 'Nghe lời thầy giáo xong, cậu ấy học chăm hơn trước nhiều.',
  },
  {
    hanzi: '今天的天气好极了，我们一起去公园走走吧。',
    pinyin: 'Jīntiān de tiānqì hǎo jíle, wǒmen yìqǐ qù gōngyuán zǒuzou ba.',
    vi: 'Thời tiết hôm nay đẹp cực kỳ, chúng ta cùng ra công viên đi dạo đi.',
  },
  {
    hanzi: '你今天看起来不太高兴，是不是身体不舒服？',
    pinyin: 'Nǐ jīntiān kàn qǐlai bú tài gāoxìng, shì bu shì shēntǐ bù shūfu?',
    vi: 'Hôm nay trông bạn không vui lắm, có phải người không khỏe không?',
  },
  {
    hanzi: '我今年的目标是学会三百个汉字，还要多看中文书。',
    pinyin: 'Wǒ jīnnián de mùbiāo shì xuéhuì sānbǎi ge Hànzì, hái yào duō kàn Zhōngwén shū.',
    vi: 'Mục tiêu năm nay của tôi là học được ba trăm chữ Hán, còn phải đọc nhiều sách tiếng Trung.',
  },
  {
    hanzi: '做饭以前，首先要把手洗干净，然后再准备菜。',
    pinyin: 'Zuò fàn yǐqián, shǒuxiān yào bǎ shǒu xǐ gānjìng, ránhòu zài zhǔnbèi cài.',
    vi: 'Trước khi nấu cơm, trước hết phải rửa tay sạch sẽ, sau đó mới chuẩn bị rau.',
  },
  {
    hanzi: '下班以后我想跟你谈一谈，你有时间吗？',
    pinyin: 'Xiàbān yǐhòu wǒ xiǎng gēn nǐ tán yi tán, nǐ yǒu shíjiān ma?',
    vi: 'Tan làm tôi muốn nói chuyện với bạn một chút, bạn có thời gian không?',
  },
  {
    hanzi: '这是一个很好的工作机会，你一定要好好抓住。',
    pinyin: 'Zhè shì yí ge hěn hǎo de gōngzuò jīhuì, nǐ yídìng yào hǎohǎo zhuāzhù.',
    vi: 'Đây là một cơ hội việc làm rất tốt, bạn nhất định phải nắm cho chắc.',
  },
  {
    hanzi: '我已经很久没有给奶奶写信了，今天晚上就给她写。',
    pinyin: 'Wǒ yǐjīng hěn jiǔ méiyǒu gěi nǎinai xiě xìn le, jīntiān wǎnshang jiù gěi tā xiě.',
    vi: 'Đã lâu lắm rồi tôi không viết thư cho bà, tối nay tôi sẽ viết cho bà.',
  },
  {
    hanzi: '今天是你的生日，祝你生日快乐，身体健康！',
    pinyin: 'Jīntiān shì nǐ de shēngrì, zhù nǐ shēngrì kuàilè, shēntǐ jiànkāng!',
    vi: 'Hôm nay là sinh nhật bạn, chúc bạn sinh nhật vui vẻ, mạnh khỏe!',
  },
  {
    hanzi: '我哥哥在大学学的专业是电脑，现在在一家公司工作。',
    pinyin: 'Wǒ gēge zài dàxué xué de zhuānyè shì diànnǎo, xiànzài zài yì jiā gōngsī gōngzuò.',
    vi: 'Anh trai tôi ở đại học học chuyên ngành máy tính, bây giờ làm việc ở một công ty.',
  },
  {
    hanzi: '每个人都有缺点，我们要多看别人的优点。',
    pinyin: 'Měi ge rén dōu yǒu quēdiǎn, wǒmen yào duō kàn biérén de yōudiǎn.',
    vi: 'Ai cũng có khuyết điểm, chúng ta nên nhìn nhiều vào ưu điểm của người khác.',
  },
  {
    hanzi: '你的汉语说得很自然，听起来就像中国人一样。',
    pinyin: 'Nǐ de Hànyǔ shuō de hěn zìrán, tīng qǐlai jiù xiàng Zhōngguórén yíyàng.',
    vi: 'Bạn nói tiếng Trung rất tự nhiên, nghe cứ như người Trung Quốc vậy.',
  },
  {
    hanzi: '在信里，他首先祝我新年快乐，然后说了很多自己的事。',
    pinyin: 'Zài xìn li, tā shǒuxiān zhù wǒ xīnnián kuàilè, ránhòu shuō le hěn duō zìjǐ de shì.',
    vi: 'Trong thư, trước hết anh ấy chúc tôi năm mới vui vẻ, sau đó kể rất nhiều chuyện của mình.',
  },
];

export default sentences;
