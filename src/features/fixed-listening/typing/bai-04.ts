/**
 * Câu dài tập gõ pinyin cho bài 4: mỗi câu ghép vài từ mới của bài (10 từ HSK 2
 * 离开 … 旅游, 10 từ HSK 3 安排 … 表演) với từ HSK 1–2. Pinyin viết tay theo cách
 * đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我的好朋友下个月要离开北京，去上海工作。',
    pinyin: 'Wǒ de hǎo péngyou xià ge yuè yào líkāi Běijīng, qù Shànghǎi gōngzuò.',
    vi: 'Bạn thân của tôi tháng sau sẽ rời Bắc Kinh, đi Thượng Hải làm việc.',
  },
  {
    hanzi: '他每天早上练习说汉语，所以现在说得很流利。',
    pinyin: 'Tā měitiān zǎoshang liànxí shuō Hànyǔ, suǒyǐ xiànzài shuō de hěn liúlì.',
    vi: 'Mỗi sáng anh ấy luyện nói tiếng Trung, nên bây giờ nói rất lưu loát.',
  },
  {
    hanzi: '这个周末天气比较凉快，我们安排了两天去旅游。',
    pinyin: 'Zhège zhōumò tiānqì bǐjiào liángkuai, wǒmen ānpái le liǎng tiān qù lǚyóu.',
    vi: 'Cuối tuần này trời khá mát, chúng tôi sắp xếp hai ngày đi du lịch.',
  },
  {
    hanzi: '我们班有两个留学生，他们的汉语都说得很流利。',
    pinyin: 'Wǒmen bān yǒu liǎng ge liúxuéshēng, tāmen de Hànyǔ dōu shuō de hěn liúlì.',
    vi: 'Lớp tôi có hai du học sinh, tiếng Trung của họ đều nói rất lưu loát.',
  },
  {
    hanzi: '搬家的时候，朋友开来一辆车帮我们搬东西。',
    pinyin: 'Bānjiā de shíhou, péngyou kāi lái yí liàng chē bāng wǒmen bān dōngxi.',
    vi: 'Khi chuyển nhà, bạn lái một chiếc xe đến giúp chúng tôi chở đồ.',
  },
  {
    hanzi: '我本来想坐公交车去看比赛，但是太晚了，只能打车。',
    pinyin: 'Wǒ běnlái xiǎng zuò gōngjiāochē qù kàn bǐsài, dànshì tài wǎn le, zhǐ néng dǎchē.',
    vi: 'Tôi vốn định đi xe buýt đi xem trận đấu, nhưng muộn quá rồi, chỉ có thể đi taxi.',
  },
  {
    hanzi: '妈妈买了很多白菜和肉，说晚上给我们做好吃的菜。',
    pinyin: 'Māma mǎi le hěn duō báicài hé ròu, shuō wǎnshang gěi wǒmen zuò hǎochī de cài.',
    vi: 'Mẹ mua rất nhiều cải thảo và thịt, nói tối nay nấu món ngon cho chúng tôi.',
  },
  {
    hanzi: '天气变化很快，晚上比较冷，你记得用大一点的被子。',
    pinyin: 'Tiānqì biànhuà hěn kuài, wǎnshang bǐjiào lěng, nǐ jìde yòng dà yìdiǎn de bèizi.',
    vi: 'Thời tiết thay đổi rất nhanh, buổi tối khá lạnh, bạn nhớ dùng chăn to hơn một chút.',
  },
  {
    hanzi: '老师说，看电脑的时间太长对眼睛不好，我们要保护眼睛。',
    pinyin: 'Lǎoshī shuō, kàn diànnǎo de shíjiān tài cháng duì yǎnjing bù hǎo, wǒmen yào bǎohù yǎnjing.',
    vi: 'Cô giáo nói, nhìn máy tính quá lâu không tốt cho mắt, chúng ta phải bảo vệ mắt.',
  },
  {
    hanzi: '学校安排我们周末去看留学生的表演。',
    pinyin: 'Xuéxiào ānpái wǒmen zhōumò qù kàn liúxuéshēng de biǎoyǎn.',
    vi: 'Trường sắp xếp cho chúng tôi cuối tuần đi xem buổi biểu diễn của du học sinh.',
  },
  {
    hanzi: '离开中国以前，他想再去旅游一次，看看那里的变化。',
    pinyin: 'Líkāi Zhōngguó yǐqián, tā xiǎng zài qù lǚyóu yí cì, kànkan nàli de biànhuà.',
    vi: 'Trước khi rời Trung Quốc, anh ấy muốn đi du lịch thêm một lần, xem sự thay đổi ở đó.',
  },
  {
    hanzi: '他跑过来的时候，脸很红，因为外面太热了。',
    pinyin: 'Tā pǎo guòlái de shíhou, liǎn hěn hóng, yīnwèi wàimiàn tài rè le.',
    vi: 'Khi anh ấy chạy lại, mặt rất đỏ, vì ngoài trời nóng quá.',
  },
  {
    hanzi: '这条黑色的裤子今年很流行，但是比较贵，我还是不买了。',
    pinyin: 'Zhè tiáo hēisè de kùzi jīnnián hěn liúxíng, dànshì bǐjiào guì, wǒ háishi bù mǎi le.',
    vi: 'Chiếc quần đen này năm nay rất thịnh hành, nhưng khá đắt, thôi tôi không mua nữa.',
  },
  {
    hanzi: '下午有篮球比赛，我们两个班的同学都去看了。',
    pinyin: 'Xiàwǔ yǒu lánqiú bǐsài, wǒmen liǎng ge bān de tóngxué dōu qù kàn le.',
    vi: 'Chiều nay có trận bóng rổ, các bạn hai lớp chúng tôi đều đi xem.',
  },
  {
    hanzi: '老师说的例子很有意思，大家马上就懂了这个词。',
    pinyin: 'Lǎoshī shuō de lìzi hěn yǒu yìsi, dàjiā mǎshàng jiù dǒng le zhège cí.',
    vi: 'Ví dụ cô giáo nói rất thú vị, mọi người hiểu ngay từ này.',
  },
  {
    hanzi: '姐姐经常练习表演，她希望以后能去北京表演。',
    pinyin: 'Jiějie jīngcháng liànxí biǎoyǎn, tā xīwàng yǐhòu néng qù Běijīng biǎoyǎn.',
    vi: 'Chị gái thường luyện tập biểu diễn, chị hy vọng sau này có thể đến Bắc Kinh biểu diễn.',
  },
  {
    hanzi: '早上起床以后，我先洗脸，然后吃早饭，再练习写汉字。',
    pinyin: 'Zǎoshang qǐchuáng yǐhòu, wǒ xiān xǐ liǎn, ránhòu chī zǎofàn, zài liànxí xiě Hànzì.',
    vi: 'Buổi sáng sau khi dậy, tôi rửa mặt trước, sau đó ăn sáng, rồi luyện viết chữ Hán.',
  },
  {
    hanzi: '我本来不喜欢吃白菜，但是妈妈做的白菜很好吃。',
    pinyin: 'Wǒ běnlái bù xǐhuan chī báicài, dànshì māma zuò de báicài hěn hǎochī.',
    vi: 'Tôi vốn không thích ăn cải thảo, nhưng cải thảo mẹ nấu rất ngon.',
  },
  {
    hanzi: '如果你想说流利的汉语，就要每天和中国朋友练习说话。',
    pinyin: 'Rúguǒ nǐ xiǎng shuō liúlì de Hànyǔ, jiù yào měitiān hé Zhōngguó péngyou liànxí shuōhuà.',
    vi: 'Nếu bạn muốn nói tiếng Trung lưu loát thì mỗi ngày phải luyện nói với bạn người Trung Quốc.',
  },
  {
    hanzi: '这次旅游，老师安排得很好，大家都很高兴。',
    pinyin: 'Zhè cì lǚyóu, lǎoshī ānpái de hěn hǎo, dàjiā dōu hěn gāoxìng.',
    vi: 'Chuyến du lịch lần này cô giáo sắp xếp rất tốt, mọi người đều rất vui.',
  },
];

export default sentences;
