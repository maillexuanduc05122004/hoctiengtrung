/**
 * Câu dài tập gõ pinyin cho bài 16: mỗi câu ghép từ mới của bài (thể thao, sức khỏe,
 * biểu diễn: 受伤、危险、速度、输、赢、演出、握手 …) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '他昨天踢足球的时候受伤了，现在还在医院里休息。',
    pinyin: 'Tā zuótiān tī zúqiú de shíhou shòushāng le, xiànzài hái zài yīyuàn li xiūxi.',
    vi: 'Hôm qua anh ấy bị thương lúc đá bóng, bây giờ vẫn đang nằm nghỉ ở bệnh viện.',
  },
  {
    hanzi: '晚上一个人去河边游泳太危险了，你千万别去。',
    pinyin: 'Wǎnshang yí ge rén qù hébiān yóuyǒng tài wēixiǎn le, nǐ qiānwàn bié qù.',
    vi: 'Buổi tối một mình ra bờ sông bơi nguy hiểm quá, bạn đừng có đi nhé.',
  },
  {
    hanzi: '开车的时候速度不要太快，安全是最重要的。',
    pinyin: 'Kāichē de shíhou sùdù bú yào tài kuài, ānquán shì zuì zhòngyào de.',
    vi: 'Khi lái xe đừng chạy nhanh quá, an toàn là quan trọng nhất.',
  },
  {
    hanzi: '我们队这次比赛输了，可是大家都已经很努力了。',
    pinyin: 'Wǒmen duì zhè cì bǐsài shū le, kěshì dàjiā dōu yǐjīng hěn nǔlì le.',
    vi: 'Lần này đội chúng tôi thua, nhưng mọi người đều đã rất cố gắng.',
  },
  {
    hanzi: '你觉得明天的足球比赛哪个队会赢？',
    pinyin: 'Nǐ juéde míngtiān de zúqiú bǐsài nǎge duì huì yíng?',
    vi: 'Bạn nghĩ trận bóng đá ngày mai đội nào sẽ thắng?',
  },
  {
    hanzi: '我妹妹从六岁开始学跳舞，现在跳得非常好。',
    pinyin: 'Wǒ mèimei cóng liù suì kāishǐ xué tiàowǔ, xiànzài tiào de fēicháng hǎo.',
    vi: 'Em gái tôi bắt đầu học nhảy từ năm sáu tuổi, bây giờ nhảy rất giỏi.',
  },
  {
    hanzi: '每天吃完晚饭以后，爷爷奶奶都会去公园散步。',
    pinyin: 'Měi tiān chī wán wǎnfàn yǐhòu, yéye nǎinai dōu huì qù gōngyuán sànbù.',
    vi: 'Ngày nào ăn tối xong, ông bà cũng ra công viên đi dạo.',
  },
  {
    hanzi: '这里的气候冬天不太冷，夏天也不太热。',
    pinyin: 'Zhèlǐ de qìhòu dōngtiān bú tài lěng, xiàtiān yě bú tài rè.',
    vi: 'Khí hậu ở đây mùa đông không lạnh lắm, mùa hè cũng không nóng lắm.',
  },
  {
    hanzi: '这条河的水很深，小孩子不能一个人在这里玩。',
    pinyin: 'Zhè tiáo hé de shuǐ hěn shēn, xiǎo háizi bù néng yí ge rén zài zhèlǐ wán.',
    vi: 'Nước con sông này rất sâu, trẻ nhỏ không được chơi ở đây một mình.',
  },
  {
    hanzi: '我弟弟每天放学回家就玩电脑游戏，不想做作业。',
    pinyin: 'Wǒ dìdi měi tiān fàngxué huí jiā jiù wán diànnǎo yóuxì, bù xiǎng zuò zuòyè.',
    vi: 'Ngày nào em trai tôi tan học về nhà là chơi game trên máy tính, không muốn làm bài tập.',
  },
  {
    hanzi: '别着急，我们的时间足够，先喝杯咖啡再走吧。',
    pinyin: 'Bié zháojí, wǒmen de shíjiān zúgòu, xiān hē bēi kāfēi zài zǒu ba.',
    vi: 'Đừng vội, chúng ta còn đủ thời gian, uống cốc cà phê rồi hãy đi.',
  },
  {
    hanzi: '昨天晚上的演出非常精彩，观众们都很喜欢。',
    pinyin: 'Zuótiān wǎnshang de yǎnchū fēicháng jīngcǎi, guānzhòngmen dōu hěn xǐhuan.',
    vi: 'Buổi biểu diễn tối qua rất đặc sắc, khán giả ai cũng thích.',
  },
  {
    hanzi: '我们学校下个星期要举办一个很大的运动会。',
    pinyin: 'Wǒmen xuéxiào xià ge xīngqī yào jǔbàn yí ge hěn dà de yùndònghuì.',
    vi: 'Tuần sau trường chúng tôi sẽ tổ chức một hội thao rất lớn.',
  },
  {
    hanzi: '这场演出七点半开始，我们最好早一点出门。',
    pinyin: 'Zhè chǎng yǎnchū qī diǎn bàn kāishǐ, wǒmen zuìhǎo zǎo yìdiǎn chūmén.',
    vi: 'Buổi biểu diễn này bắt đầu lúc bảy rưỡi, tốt nhất chúng ta nên ra khỏi nhà sớm một chút.',
  },
  {
    hanzi: '为了庆祝妈妈的生日，我和姐姐一起做了一个蛋糕。',
    pinyin: 'Wèile qìngzhù māma de shēngrì, wǒ hé jiějie yìqǐ zuò le yí ge dàngāo.',
    vi: 'Để mừng sinh nhật mẹ, tôi và chị gái cùng làm một chiếc bánh ngọt.',
  },
  {
    hanzi: '你放心吧，这件事我绝对不会告诉别人。',
    pinyin: 'Nǐ fàngxīn ba, zhè jiàn shì wǒ juéduì bú huì gàosu biérén.',
    vi: 'Bạn cứ yên tâm, chuyện này tôi tuyệt đối không nói với ai đâu.',
  },
  {
    hanzi: '老师一说下课，同学们就立刻跑出了教室。',
    pinyin: 'Lǎoshī yì shuō xiàkè, tóngxuémen jiù lìkè pǎo chū le jiàoshì.',
    vi: 'Thầy giáo vừa nói tan học, các bạn học sinh liền chạy ngay ra khỏi lớp.',
  },
  {
    hanzi: '电影马上就要开始了，我们赶快进去吧。',
    pinyin: 'Diànyǐng mǎshàng jiù yào kāishǐ le, wǒmen gǎnkuài jìnqù ba.',
    vi: 'Phim sắp bắt đầu rồi, chúng ta mau vào thôi.',
  },
  {
    hanzi: '第一次见面的时候，他很客气地跟我握了握手。',
    pinyin: 'Dì yī cì jiànmiàn de shíhou, tā hěn kèqi de gēn wǒ wò le wò shǒu.',
    vi: 'Lần đầu gặp mặt, anh ấy lịch sự bắt tay tôi.',
  },
  {
    hanzi: '难道你不知道明天上午有一个很重要的考试吗？',
    pinyin: 'Nándào nǐ bù zhīdào míngtiān shàngwǔ yǒu yí ge hěn zhòngyào de kǎoshì ma?',
    vi: 'Lẽ nào bạn không biết sáng mai có một bài thi rất quan trọng sao?',
  },
];

export default sentences;
