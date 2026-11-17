/**
 * Câu dài tập gõ pinyin cho bài 11: mỗi câu ghép từ mới của bài (từ trong đề thi
 * HSK 3 và từ về đường đi: 出门、地铁、换、公共汽车、远、路、迟到 …) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我每天早上七点出门，先走路到地铁站，然后坐地铁去学校。',
    pinyin: 'Wǒ měi tiān zǎoshang qī diǎn chūmén, xiān zǒulù dào dìtiě zhàn, ránhòu zuò dìtiě qù xuéxiào.',
    vi: 'Sáng nào tôi cũng ra khỏi nhà lúc bảy giờ, đi bộ đến ga tàu điện ngầm trước, rồi đi tàu đến trường.',
  },
  {
    hanzi: '从学校到公司不太远，我一般骑自行车去，二十分钟就到了。',
    pinyin: 'Cóng xuéxiào dào gōngsī bú tài yuǎn, wǒ yìbān qí zìxíngchē qù, èrshí fēnzhōng jiù dào le.',
    vi: 'Từ trường đến công ty không xa lắm, tôi thường đạp xe đi, hai mươi phút là tới.',
  },
  {
    hanzi: '坐公共汽车去公司要经过很多地方，所以比地铁慢多了。',
    pinyin: 'Zuò gōnggòng qìchē qù gōngsī yào jīngguò hěn duō dìfang, suǒyǐ bǐ dìtiě màn duō le.',
    vi: 'Đi xe buýt đến công ty phải đi qua nhiều nơi, nên chậm hơn tàu điện ngầm nhiều.',
  },
  {
    hanzi: '我家离公司很近，不用坐车，走路十分钟就到了。',
    pinyin: 'Wǒ jiā lí gōngsī hěn jìn, bú yòng zuò chē, zǒulù shí fēnzhōng jiù dào le.',
    vi: 'Nhà tôi gần công ty, không cần đi xe, đi bộ mười phút là tới.',
  },
  {
    hanzi: '今天早上路上车太多了，我到公司的时候已经迟到了。',
    pinyin: 'Jīntiān zǎoshang lùshang chē tài duō le, wǒ dào gōngsī de shíhou yǐjīng chídào le.',
    vi: 'Sáng nay trên đường xe đông quá, lúc tôi đến công ty thì đã muộn rồi.',
  },
  {
    hanzi: '我从早上到现在什么都没吃，真是饿坏了。',
    pinyin: 'Wǒ cóng zǎoshang dào xiànzài shénme dōu méi chī, zhēn shì è huài le.',
    vi: 'Từ sáng đến giờ tôi chưa ăn gì, đói muốn xỉu luôn.',
  },
  {
    hanzi: '老师说今天的作业很多，我们最好早一点开始做。',
    pinyin: 'Lǎoshī shuō jīntiān de zuòyè hěn duō, wǒmen zuìhǎo zǎo yìdiǎn kāishǐ zuò.',
    vi: 'Cô giáo nói bài tập hôm nay nhiều, tốt nhất chúng ta nên bắt đầu làm sớm một chút.',
  },
  {
    hanzi: '这件衣服有点小，我想去商店换一件大一点的。',
    pinyin: 'Zhè jiàn yīfu yǒudiǎn xiǎo, wǒ xiǎng qù shāngdiàn huàn yí jiàn dà yìdiǎn de.',
    vi: 'Cái áo này hơi nhỏ, tôi muốn ra cửa hàng đổi cái to hơn một chút.',
  },
  {
    hanzi: '你出门以前别忘了把房间的门关好。',
    pinyin: 'Nǐ chūmén yǐqián bié wàng le bǎ fángjiān de mén guān hǎo.',
    vi: 'Trước khi ra khỏi nhà, bạn đừng quên đóng kỹ cửa phòng.',
  },
  {
    hanzi: '我的电脑坏了，可以借你的电脑用一下吗？',
    pinyin: 'Wǒ de diànnǎo huài le, kěyǐ jiè nǐ de diànnǎo yòng yíxià ma?',
    vi: 'Máy tính của tôi hỏng rồi, cho tôi mượn máy tính của bạn dùng một chút được không?',
  },
  {
    hanzi: '医生给我检查了身体，说没有什么大问题，让我放心。',
    pinyin: 'Yīshēng gěi wǒ jiǎnchá le shēntǐ, shuō méiyǒu shénme dà wèntí, ràng wǒ fàngxīn.',
    vi: 'Bác sĩ khám sức khỏe cho tôi, nói không có vấn đề gì lớn, bảo tôi yên tâm.',
  },
  {
    hanzi: '我最喜欢的颜色是蓝色，所以我有很多蓝色的衣服。',
    pinyin: 'Wǒ zuì xǐhuan de yánsè shì lánsè, suǒyǐ wǒ yǒu hěn duō lánsè de yīfu.',
    vi: 'Màu tôi thích nhất là xanh lam, nên tôi có rất nhiều quần áo màu xanh lam.',
  },
  {
    hanzi: '这条路晚上没有什么人，你一个人走要小心。',
    pinyin: 'Zhè tiáo lù wǎnshang méiyǒu shénme rén, nǐ yí ge rén zǒu yào xiǎoxīn.',
    vi: 'Con đường này buổi tối chẳng có mấy người, bạn đi một mình phải cẩn thận.',
  },
  {
    hanzi: '这是一个很好的工作机会，你应该好好准备一下。',
    pinyin: 'Zhè shì yí ge hěn hǎo de gōngzuò jīhuì, nǐ yīnggāi hǎohǎo zhǔnbèi yíxià.',
    vi: 'Đây là một cơ hội việc làm rất tốt, bạn nên chuẩn bị cho kỹ.',
  },
  {
    hanzi: '我们先去吃饭吧，吃完饭以后再回公司工作。',
    pinyin: 'Wǒmen xiān qù chī fàn ba, chī wán fàn yǐhòu zài huí gōngsī gōngzuò.',
    vi: 'Chúng ta đi ăn cơm trước đã, ăn xong rồi mới về công ty làm việc.',
  },
  {
    hanzi: '经理让我们这个星期一定要把这个工作完成。',
    pinyin: 'Jīnglǐ ràng wǒmen zhège xīngqī yídìng yào bǎ zhège gōngzuò wánchéng.',
    vi: 'Giám đốc bảo chúng tôi tuần này nhất định phải làm xong việc này.',
  },
  {
    hanzi: '这件事他早就知道了，可是他一直没有告诉我。',
    pinyin: 'Zhè jiàn shì tā zǎojiù zhīdào le, kěshì tā yìzhí méiyǒu gàosu wǒ.',
    vi: 'Chuyện này anh ấy biết từ lâu rồi, nhưng anh ấy mãi không nói cho tôi.',
  },
  {
    hanzi: '你说得太快了，我没有听清楚，请你再说一遍。',
    pinyin: 'Nǐ shuō de tài kuài le, wǒ méiyǒu tīng qīngchu, qǐng nǐ zài shuō yí biàn.',
    vi: 'Bạn nói nhanh quá, tôi nghe không rõ, bạn nói lại lần nữa nhé.',
  },
  {
    hanzi: '我们先坐地铁到火车站，然后换公共汽车去机场。',
    pinyin: 'Wǒmen xiān zuò dìtiě dào huǒchēzhàn, ránhòu huàn gōnggòng qìchē qù jīchǎng.',
    vi: 'Chúng ta đi tàu điện ngầm đến ga tàu hỏa trước, sau đó đổi sang xe buýt ra sân bay.',
  },
  {
    hanzi: '妈妈，你放心吧，我已经长大了，一个人去学校没问题。',
    pinyin: 'Māma, nǐ fàngxīn ba, wǒ yǐjīng zhǎng dà le, yí ge rén qù xuéxiào méi wèntí.',
    vi: 'Mẹ ơi, mẹ yên tâm đi, con lớn rồi, một mình đến trường không sao đâu.',
  },
];

export default sentences;
