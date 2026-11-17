/**
 * Câu dài tập gõ pinyin cho bài 12: mỗi câu ghép từ mới của bài (20 từ HSK 3 về
 * học tập và thi cử: 简单、容易、题目、听力 … 注意、具体、千万) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '这次考试的题目很简单，我二十分钟就做完了。',
    pinyin: 'Zhè cì kǎoshì de tímù hěn jiǎndān, wǒ èrshí fēnzhōng jiù zuò wán le.',
    vi: 'Đề thi lần này rất đơn giản, tôi làm hai mươi phút là xong.',
  },
  {
    hanzi: '学汉语不容易，可是只要每天坚持，就一定会有进步。',
    pinyin: 'Xué Hànyǔ bù róngyì, kěshì zhǐyào měi tiān jiānchí, jiù yídìng huì yǒu jìnbù.',
    vi: 'Học tiếng Trung không dễ, nhưng chỉ cần ngày nào cũng kiên trì thì nhất định sẽ tiến bộ.',
  },
  {
    hanzi: '我的听力不太好，所以每天晚上都听半个小时汉语。',
    pinyin: 'Wǒ de tīnglì bú tài hǎo, suǒyǐ měi tiān wǎnshang dōu tīng bàn ge xiǎoshí Hànyǔ.',
    vi: 'Khả năng nghe của tôi không tốt lắm, nên tối nào tôi cũng nghe tiếng Trung nửa tiếng.',
  },
  {
    hanzi: '这个问题太复杂了，我想了很长时间也没想明白。',
    pinyin: 'Zhège wèntí tài fùzá le, wǒ xiǎng le hěn cháng shíjiān yě méi xiǎng míngbai.',
    vi: 'Vấn đề này phức tạp quá, tôi nghĩ rất lâu mà vẫn chưa nghĩ ra.',
  },
  {
    hanzi: '老师说得太快了，我不太理解他说的意思。',
    pinyin: 'Lǎoshī shuō de tài kuài le, wǒ bú tài lǐjiě tā shuō de yìsi.',
    vi: 'Thầy nói nhanh quá, tôi không hiểu lắm ý thầy nói.',
  },
  {
    hanzi: '这篇文章写得很好，老师让我们每个人都读一遍。',
    pinyin: 'Zhè piān wénzhāng xiě de hěn hǎo, lǎoshī ràng wǒmen měi ge rén dōu dú yí biàn.',
    vi: 'Bài văn này viết rất hay, thầy bảo mỗi người chúng tôi đều đọc một lượt.',
  },
  {
    hanzi: '这件衣服我不太喜欢，你能给我看看另外一件吗？',
    pinyin: 'Zhè jiàn yīfu wǒ bú tài xǐhuan, nǐ néng gěi wǒ kànkan lìngwài yí jiàn ma?',
    vi: 'Cái áo này tôi không thích lắm, bạn cho tôi xem cái khác được không?',
  },
  {
    hanzi: '这两个字看起来差不多，可是意思的区别很大。',
    pinyin: 'Zhè liǎng ge zì kàn qǐlai chàbuduō, kěshì yìsi de qūbié hěn dà.',
    vi: 'Hai chữ này trông na ná nhau, nhưng nghĩa thì khác nhau nhiều.',
  },
  {
    hanzi: '我的手表不太准，你能告诉我现在几点了吗？',
    pinyin: 'Wǒ de shǒubiǎo bú tài zhǔn, nǐ néng gàosu wǒ xiànzài jǐ diǎn le ma?',
    vi: 'Đồng hồ của tôi chạy không chuẩn lắm, bạn cho tôi biết bây giờ mấy giờ được không?',
  },
  {
    hanzi: '明天的考试很重要，我们最好提前半个小时到教室。',
    pinyin: 'Míngtiān de kǎoshì hěn zhòngyào, wǒmen zuìhǎo tíqián bàn ge xiǎoshí dào jiàoshì.',
    vi: 'Bài thi ngày mai rất quan trọng, tốt nhất chúng ta nên đến phòng học sớm nửa tiếng.',
  },
  {
    hanzi: '第一次考试的时候，我特别紧张，晚上都没睡好觉。',
    pinyin: 'Dì yī cì kǎoshì de shíhou, wǒ tèbié jǐnzhāng, wǎnshang dōu méi shuì hǎo jiào.',
    vi: 'Lần đầu đi thi, tôi hồi hộp vô cùng, buổi tối ngủ cũng không ngon.',
  },
  {
    hanzi: '外面突然下起了大雨，我们只好在教室里等一会。',
    pinyin: 'Wàimiàn tūrán xià qǐ le dà yǔ, wǒmen zhǐhǎo zài jiàoshì li děng yíhuì.',
    vi: 'Bên ngoài bỗng đổ mưa to, chúng tôi đành ở lại phòng học đợi một lúc.',
  },
  {
    hanzi: '我努力学习了一年，终于考上了自己喜欢的大学。',
    pinyin: 'Wǒ nǔlì xuéxí le yì nián, zhōngyú kǎo shàng le zìjǐ xǐhuan de dàxué.',
    vi: 'Tôi chăm chỉ học suốt một năm, cuối cùng cũng đỗ vào trường đại học mình thích.',
  },
  {
    hanzi: '你以为他生气了，其实他只是有点累了。',
    pinyin: 'Nǐ yǐwéi tā shēngqì le, qíshí tā zhǐshì yǒudiǎn lèi le.',
    vi: 'Bạn tưởng anh ấy giận rồi, thật ra anh ấy chỉ hơi mệt thôi.',
  },
  {
    hanzi: '我正在睡觉的时候，突然有人打电话给我。',
    pinyin: 'Wǒ zhèngzài shuìjiào de shíhou, tūrán yǒu rén dǎ diànhuà gěi wǒ.',
    vi: 'Tôi đang ngủ thì bỗng có người gọi điện cho tôi.',
  },
  {
    hanzi: '天气越来越冷了，你要注意身体，多穿一点衣服。',
    pinyin: 'Tiānqì yuè lái yuè lěng le, nǐ yào zhùyì shēntǐ, duō chuān yìdiǎn yīfu.',
    vi: 'Trời càng ngày càng lạnh, bạn phải chú ý sức khỏe, mặc thêm áo vào.',
  },
  {
    hanzi: '你说的这个办法很好，可是能不能说得再具体一点？',
    pinyin: 'Nǐ shuō de zhège bànfǎ hěn hǎo, kěshì néng bu néng shuō de zài jùtǐ yìdiǎn?',
    vi: 'Cách bạn nói rất hay, nhưng có thể nói cụ thể hơn chút nữa không?',
  },
  {
    hanzi: '明天早上八点考试，你千万不要迟到，也别忘了带笔。',
    pinyin: 'Míngtiān zǎoshang bā diǎn kǎoshì, nǐ qiānwàn bú yào chídào, yě bié wàng le dài bǐ.',
    vi: 'Tám giờ sáng mai thi, bạn nhất định đừng đến muộn, cũng đừng quên mang bút.',
  },
  {
    hanzi: '下雨了，没有出租车，我们只好走路回家。',
    pinyin: 'Xià yǔ le, méiyǒu chūzūchē, wǒmen zhǐhǎo zǒulù huí jiā.',
    vi: 'Trời mưa, không có taxi, chúng tôi đành đi bộ về nhà.',
  },
  {
    hanzi: '这次考试的听力比上次难多了，有很多题目我没听懂。',
    pinyin: 'Zhè cì kǎoshì de tīnglì bǐ shàng cì nán duō le, yǒu hěn duō tímù wǒ méi tīng dǒng.',
    vi: 'Phần nghe của bài thi lần này khó hơn lần trước nhiều, có nhiều câu tôi nghe không hiểu.',
  },
];

export default sentences;
