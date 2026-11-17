/**
 * Câu dài tập gõ pinyin cho bài 13: mỗi câu ghép từ mới của bài (20 từ HSK 3 về
 * công việc ở công ty: 老板、工资、负责、管理 … 退休、积极) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我们老板每天早上八点就到公司，比我们都早。',
    pinyin: 'Wǒmen lǎobǎn měi tiān zǎoshang bā diǎn jiù dào gōngsī, bǐ wǒmen dōu zǎo.',
    vi: 'Sáng nào sếp chúng tôi cũng tám giờ đã có mặt ở công ty, sớm hơn tất cả chúng tôi.',
  },
  {
    hanzi: '这家公司的工资比较高，所以很多年轻人都想来这里工作。',
    pinyin: 'Zhè jiā gōngsī de gōngzī bǐjiào gāo, suǒyǐ hěn duō niánqīng rén dōu xiǎng lái zhèlǐ gōngzuò.',
    vi: 'Lương ở công ty này khá cao, nên rất nhiều người trẻ muốn đến đây làm việc.',
  },
  {
    hanzi: '我在公司负责回答客人的问题，每天都要打很多电话。',
    pinyin: 'Wǒ zài gōngsī fùzé huídá kèrén de wèntí, měi tiān dōu yào dǎ hěn duō diànhuà.',
    vi: 'Ở công ty tôi phụ trách trả lời câu hỏi của khách, ngày nào cũng phải gọi rất nhiều cuộc điện thoại.',
  },
  {
    hanzi: '我姐姐在一家大酒店工作，她负责管理三十多个服务员。',
    pinyin: 'Wǒ jiějie zài yì jiā dà jiǔdiàn gōngzuò, tā fùzé guǎnlǐ sānshí duō ge fúwùyuán.',
    vi: 'Chị gái tôi làm ở một khách sạn lớn, chị ấy phụ trách quản lý hơn ba mươi nhân viên phục vụ.',
  },
  {
    hanzi: '这个任务很重要，我们一定要在星期五以前完成。',
    pinyin: 'Zhège rènwu hěn zhòngyào, wǒmen yídìng yào zài xīngqīwǔ yǐqián wánchéng.',
    vi: 'Nhiệm vụ này rất quan trọng, chúng ta nhất định phải hoàn thành trước thứ Sáu.',
  },
  {
    hanzi: '最近工作压力太大了，我晚上常常睡不好觉。',
    pinyin: 'Zuìjìn gōngzuò yālì tài dà le, wǒ wǎnshang chángcháng shuì bu hǎo jiào.',
    vi: 'Dạo này áp lực công việc lớn quá, buổi tối tôi thường ngủ không ngon.',
  },
  {
    hanzi: '他虽然很年轻，但是已经有五年的工作经验了。',
    pinyin: 'Tā suīrán hěn niánqīng, dànshì yǐjīng yǒu wǔ nián de gōngzuò jīngyàn le.',
    vi: 'Tuy anh ấy còn rất trẻ nhưng đã có năm năm kinh nghiệm làm việc.',
  },
  {
    hanzi: '我觉得医生是一个很好的职业，可以帮助很多病人。',
    pinyin: 'Wǒ juéde yīshēng shì yí ge hěn hǎo de zhíyè, kěyǐ bāngzhù hěn duō bìngrén.',
    vi: 'Tôi thấy bác sĩ là một nghề rất tốt, có thể giúp được nhiều người bệnh.',
  },
  {
    hanzi: '我爸爸在北京做生意，他每个月只回家一次。',
    pinyin: 'Wǒ bàba zài Běijīng zuò shēngyi, tā měi ge yuè zhǐ huí jiā yí cì.',
    vi: 'Bố tôi làm ăn ở Bắc Kinh, mỗi tháng chỉ về nhà một lần.',
  },
  {
    hanzi: '你有什么问题要及时告诉我，不要等到最后才说。',
    pinyin: 'Nǐ yǒu shénme wèntí yào jíshí gàosu wǒ, bú yào děng dào zuìhòu cái shuō.',
    vi: 'Bạn có vấn đề gì thì phải báo cho tôi kịp thời, đừng đợi đến cuối cùng mới nói.',
  },
  {
    hanzi: '请你帮我把这些文件复印一下，下午开会的时候要用。',
    pinyin: 'Qǐng nǐ bāng wǒ bǎ zhèxiē wénjiàn fùyìn yíxià, xiàwǔ kāihuì de shíhou yào yòng.',
    vi: 'Bạn photo giúp tôi mấy tài liệu này nhé, chiều họp cần dùng.',
  },
  {
    hanzi: '我昨天晚上已经给你发了邮件，你看到了吗？',
    pinyin: 'Wǒ zuótiān wǎnshang yǐjīng gěi nǐ fā le yóujiàn, nǐ kàn dào le ma?',
    vi: 'Tối qua tôi đã gửi email cho bạn rồi, bạn thấy chưa?',
  },
  {
    hanzi: '他在公司工作了三个月以后，就成为了正式员工。',
    pinyin: 'Tā zài gōngsī gōngzuò le sān ge yuè yǐhòu, jiù chéngwéi le zhèngshì yuángōng.',
    vi: 'Anh ấy làm ở công ty được ba tháng thì trở thành nhân viên chính thức.',
  },
  {
    hanzi: '到了上海以后，你要记得给我打电话，跟家里多联系。',
    pinyin: 'Dào le Shànghǎi yǐhòu, nǐ yào jìde gěi wǒ dǎ diànhuà, gēn jiā li duō liánxì.',
    vi: 'Đến Thượng Hải rồi, bạn nhớ gọi điện cho tôi, liên lạc với gia đình thường xuyên nhé.',
  },
  {
    hanzi: '我常常跟中国朋友用汉语交流，所以我的汉语进步很快。',
    pinyin: 'Wǒ chángcháng gēn Zhōngguó péngyou yòng Hànyǔ jiāoliú, suǒyǐ wǒ de Hànyǔ jìnbù hěn kuài.',
    vi: 'Tôi thường nói chuyện với bạn Trung Quốc bằng tiếng Trung, nên tiếng Trung của tôi tiến bộ rất nhanh.',
  },
  {
    hanzi: '新同事来了以后，他主动给他们介绍公司的情况。',
    pinyin: 'Xīn tóngshì lái le yǐhòu, tā zhǔdòng gěi tāmen jièshào gōngsī de qíngkuàng.',
    vi: 'Đồng nghiệp mới đến, anh ấy chủ động giới thiệu cho họ tình hình công ty.',
  },
  {
    hanzi: '别担心，这个问题不太难，我们一起想办法解决吧。',
    pinyin: 'Bié dānxīn, zhège wèntí bú tài nán, wǒmen yìqǐ xiǎng bànfǎ jiějué ba.',
    vi: 'Đừng lo, vấn đề này không khó lắm, chúng ta cùng nghĩ cách giải quyết nhé.',
  },
  {
    hanzi: '医生建议我每天多喝水，晚上早一点睡觉。',
    pinyin: 'Yīshēng jiànyì wǒ měi tiān duō hē shuǐ, wǎnshang zǎo yìdiǎn shuìjiào.',
    vi: 'Bác sĩ khuyên tôi mỗi ngày uống nhiều nước, buổi tối đi ngủ sớm một chút.',
  },
  {
    hanzi: '我爷爷退休以后，每天早上都去公园跑步。',
    pinyin: 'Wǒ yéye tuìxiū yǐhòu, měi tiān zǎoshang dōu qù gōngyuán pǎobù.',
    vi: 'Từ khi ông nội tôi nghỉ hưu, sáng nào ông cũng ra công viên chạy bộ.',
  },
  {
    hanzi: '她上课的时候很积极，老师问问题，她总是第一个回答。',
    pinyin: 'Tā shàngkè de shíhou hěn jījí, lǎoshī wèn wèntí, tā zǒngshì dì yī ge huídá.',
    vi: 'Trong giờ học cô ấy rất hăng hái, thầy cô hỏi gì cô ấy cũng là người trả lời đầu tiên.',
  },
];

export default sentences;
