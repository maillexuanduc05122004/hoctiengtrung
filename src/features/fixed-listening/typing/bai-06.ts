/**
 * Câu dài tập gõ pinyin cho bài 6: mỗi câu ghép vài từ mới của bài (10 từ HSK 2
 * 鸟 … 平常, 10 từ HSK 3 成果 … 充满) với từ HSK 1–2. Pinyin viết tay theo cách
 * đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '公园里的小鸟一点也不怕人，常常飞到我们身边。',
    pinyin: 'Gōngyuán li de xiǎo niǎo yìdiǎn yě bú pà rén, chángcháng fēi dào wǒmen shēnbiān.',
    vi: 'Chim nhỏ trong công viên chẳng sợ người chút nào, thường bay đến bên cạnh chúng tôi.',
  },
  {
    hanzi: '这家饭馆的菜又好吃又便宜，所以每天中午都有很多人排队。',
    pinyin: 'Zhè jiā fànguǎn de cài yòu hǎochī yòu piányi, suǒyǐ měi tiān zhōngwǔ dōu yǒu hěn duō rén páiduì.',
    vi: 'Món ăn ở quán này vừa ngon vừa rẻ, nên trưa nào cũng có nhiều người xếp hàng.',
  },
  {
    hanzi: '我昨天在去学校的路上碰到了以前的同学，我们说了很长时间的话。',
    pinyin: 'Wǒ zuótiān zài qù xuéxiào de lùshang pèngdào le yǐqián de tóngxué, wǒmen shuō le hěn cháng shíjiān de huà.',
    vi: 'Hôm qua trên đường đến trường tôi gặp lại bạn học cũ, chúng tôi nói chuyện rất lâu.',
  },
  {
    hanzi: '老师让我们每个星期写一篇中文日记，然后读给大家听。',
    pinyin: 'Lǎoshī ràng wǒmen měi ge xīngqī xiě yì piān Zhōngwén rìjì, ránhòu dú gěi dàjiā tīng.',
    vi: 'Thầy giáo bảo chúng tôi mỗi tuần viết một bài nhật ký tiếng Trung, rồi đọc cho cả lớp nghe.',
  },
  {
    hanzi: '他平常早上喝一杯牛奶，吃两片面包，然后坐地铁去上班。',
    pinyin: 'Tā píngcháng zǎoshang hē yì bēi niúnǎi, chī liǎng piàn miànbāo, ránhòu zuò dìtiě qù shàngbān.',
    vi: 'Ngày thường buổi sáng anh ấy uống một cốc sữa, ăn hai lát bánh mì, rồi đi tàu điện ngầm đi làm.',
  },
  {
    hanzi: '你一个人去那么远的城市，到了以后一定要给妈妈打电话报平安。',
    pinyin: "Nǐ yí ge rén qù nàme yuǎn de chéngshì, dào le yǐhòu yídìng yào gěi māma dǎ diànhuà bào píng'ān.",
    vi: 'Bạn đi một mình đến thành phố xa như vậy, đến nơi nhất định phải gọi điện cho mẹ báo bình an.',
  },
  {
    hanzi: '我们学校的排球队是去年成立的，现在已经有二十个成员了。',
    pinyin: 'Wǒmen xuéxiào de páiqiú duì shì qùnián chénglì de, xiànzài yǐjīng yǒu èrshí ge chéngyuán le.',
    vi: 'Đội bóng chuyền của trường tôi thành lập năm ngoái, giờ đã có hai mươi thành viên.',
  },
  {
    hanzi: '这是大家一起努力了半年的成果，每个人都很满意。',
    pinyin: 'Zhè shì dàjiā yìqǐ nǔlì le bàn nián de chéngguǒ, měi ge rén dōu hěn mǎnyì.',
    vi: 'Đây là thành quả cả nhóm cùng cố gắng nửa năm, ai cũng rất hài lòng.',
  },
  {
    hanzi: '虽然他还很年轻，但是在工作上已经有了不小的成就。',
    pinyin: 'Suīrán tā hái hěn niánqīng, dànshì zài gōngzuò shang yǐjīng yǒu le bù xiǎo de chéngjiù.',
    vi: 'Tuy anh ấy còn rất trẻ nhưng đã có thành tựu không nhỏ trong công việc.',
  },
  {
    hanzi: '秋天到了，树上的苹果都成熟了，又红又好看。',
    pinyin: 'Qiūtiān dào le, shù shang de píngguǒ dōu chéngshú le, yòu hóng yòu hǎokàn.',
    vi: 'Mùa thu đến rồi, táo trên cây đều đã chín, vừa đỏ vừa đẹp.',
  },
  {
    hanzi: '在外面一个人生活了两年，我觉得自己比以前成熟多了。',
    pinyin: 'Zài wàimiàn yí ge rén shēnghuó le liǎng nián, wǒ juéde zìjǐ bǐ yǐqián chéngshú duō le.',
    vi: 'Sống một mình bên ngoài hai năm, tôi thấy mình chín chắn hơn trước nhiều.',
  },
  {
    hanzi: '每个孩子成长的时候，都需要爸爸妈妈的爱和老师的帮助。',
    pinyin: 'Měi ge háizi chéngzhǎng de shíhou, dōu xūyào bàba māma de ài hé lǎoshī de bāngzhù.',
    vi: 'Đứa trẻ nào khi lớn lên cũng cần tình yêu của bố mẹ và sự giúp đỡ của thầy cô.',
  },
  {
    hanzi: '这个城市的冬天很冷，可是夏天非常热，我不太喜欢。',
    pinyin: 'Zhège chéngshì de dōngtiān hěn lěng, kěshì xiàtiān fēicháng rè, wǒ bú tài xǐhuan.',
    vi: 'Mùa đông ở thành phố này rất lạnh, nhưng mùa hè lại cực nóng, tôi không thích lắm.',
  },
  {
    hanzi: '学了一年汉语以后，他的听力已经到了很高的程度。',
    pinyin: 'Xué le yì nián Hànyǔ yǐhòu, tā de tīnglì yǐjīng dào le hěn gāo de chéngdù.',
    vi: 'Sau một năm học tiếng Trung, khả năng nghe của anh ấy đã đạt mức rất cao.',
  },
  {
    hanzi: '这场大雨已经持续了三天，我们不得不一直在家里。',
    pinyin: 'Zhè chǎng dàyǔ yǐjīng chíxù le sān tiān, wǒmen bùdébù yìzhí zài jiā li.',
    vi: 'Trận mưa lớn này đã kéo dài ba ngày, chúng tôi đành phải ở trong nhà suốt.',
  },
  {
    hanzi: '新年的第一天，我们家里充满了快乐和希望。',
    pinyin: 'Xīnnián de dì yī tiān, wǒmen jiā li chōngmǎn le kuàilè hé xīwàng.',
    vi: 'Ngày đầu năm mới, nhà chúng tôi tràn đầy niềm vui và hy vọng.',
  },
  {
    hanzi: '别怕，你平常练习得很好，今天的比赛一定没问题。',
    pinyin: 'Bié pà, nǐ píngcháng liànxí de hěn hǎo, jīntiān de bǐsài yídìng méi wèntí.',
    vi: 'Đừng sợ, ngày thường bạn luyện tập rất tốt, trận đấu hôm nay chắc chắn không sao đâu.',
  },
  {
    hanzi: '那家商店的水果比超市便宜一点，可是每次都要排很长的队。',
    pinyin: 'Nà jiā shāngdiàn de shuǐguǒ bǐ chāoshì piányi yìdiǎn, kěshì měi cì dōu yào pái hěn cháng de duì.',
    vi: 'Hoa quả ở cửa hàng đó rẻ hơn siêu thị một chút, nhưng lần nào cũng phải xếp hàng rất dài.',
  },
  {
    hanzi: '如果你在学习上碰到问题，下课以后可以来办公室问我。',
    pinyin: 'Rúguǒ nǐ zài xuéxí shang pèngdào wèntí, xiàkè yǐhòu kěyǐ lái bàngōngshì wèn wǒ.',
    vi: 'Nếu bạn gặp vấn đề trong học tập, tan học có thể đến văn phòng hỏi tôi.',
  },
  {
    hanzi: '我平常每天下午都去打排球，这个习惯已经持续了五年。',
    pinyin: 'Wǒ píngcháng měi tiān xiàwǔ dōu qù dǎ páiqiú, zhège xíguàn yǐjīng chíxù le wǔ nián.',
    vi: 'Ngày thường chiều nào tôi cũng đi chơi bóng chuyền, thói quen này đã kéo dài năm năm.',
  },
];

export default sentences;
