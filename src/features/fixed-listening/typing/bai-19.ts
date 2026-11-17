/**
 * Câu dài tập gõ pinyin cho bài 19: mỗi câu ghép một từ mới của bài (20 từ HSK 3
 * về chuyện đời, quá khứ và tương lai: 情况、目前、将来、过去、经历、结婚 …) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '医生说我爸爸的情况比昨天好多了，我们都放心了。',
    pinyin: 'Yīshēng shuō wǒ bàba de qíngkuàng bǐ zuótiān hǎo duō le, wǒmen dōu fàngxīn le.',
    vi: 'Bác sĩ nói tình hình của bố tôi đã tốt hơn hôm qua nhiều, cả nhà đều yên tâm rồi.',
  },
  {
    hanzi: '目前我还在学习汉语，明年想去中国找工作。',
    pinyin: 'Mùqián wǒ hái zài xuéxí Hànyǔ, míngnián xiǎng qù Zhōngguó zhǎo gōngzuò.',
    vi: 'Hiện giờ tôi vẫn đang học tiếng Trung, sang năm muốn sang Trung Quốc tìm việc.',
  },
  {
    hanzi: '我的孩子说他将来想当一名医生，帮助生病的人。',
    pinyin: 'Wǒ de háizi shuō tā jiānglái xiǎng dāng yì míng yīshēng, bāngzhù shēngbìng de rén.',
    vi: 'Con tôi nói sau này nó muốn làm bác sĩ, giúp đỡ những người bị bệnh.',
  },
  {
    hanzi: '过去这里没有地铁，现在去哪里都很方便。',
    pinyin: 'Guòqù zhèlǐ méiyǒu dìtiě, xiànzài qù nǎlǐ dōu hěn fāngbiàn.',
    vi: 'Trước đây ở đây không có tàu điện ngầm, bây giờ đi đâu cũng rất tiện.',
  },
  {
    hanzi: '在中国学习的这段经历，让我认识了很多新朋友。',
    pinyin: 'Zài Zhōngguó xuéxí de zhè duàn jīnglì, ràng wǒ rènshi le hěn duō xīn péngyou.',
    vi: 'Quãng thời gian học ở Trung Quốc giúp tôi quen được rất nhiều bạn mới.',
  },
  {
    hanzi: '我哥哥和他的女朋友打算明年五月结婚。',
    pinyin: 'Wǒ gēge hé tā de nǚpéngyou dǎsuàn míngnián wǔ yuè jiéhūn.',
    vi: 'Anh trai tôi và bạn gái định tháng năm sang năm sẽ cưới.',
  },
  {
    hanzi: '我通常七点起床，吃完早饭就坐公共汽车去公司。',
    pinyin: 'Wǒ tōngcháng qī diǎn qǐchuáng, chī wán zǎofàn jiù zuò gōnggòng qìchē qù gōngsī.',
    vi: 'Tôi thường bảy giờ dậy, ăn sáng xong là đi xe buýt đến công ty.',
  },
  {
    hanzi: '他总是第一个到教室，最后一个离开。',
    pinyin: 'Tā zǒngshì dì yī ge dào jiàoshì, zuìhòu yí ge líkāi.',
    vi: 'Cậu ấy lúc nào cũng là người đến lớp đầu tiên và về sau cùng.',
  },
  {
    hanzi: '想了很长时间以后，我决定一个人去北京工作。',
    pinyin: 'Xiǎng le hěn cháng shíjiān yǐhòu, wǒ juédìng yí ge rén qù Běijīng gōngzuò.',
    vi: 'Suy nghĩ rất lâu, tôi quyết định một mình lên Bắc Kinh làm việc.',
  },
  {
    hanzi: '已经晚上十一点了，他仍然在办公室里工作。',
    pinyin: 'Yǐjīng wǎnshang shíyī diǎn le, tā réngrán zài bàngōngshì li gōngzuò.',
    vi: 'Đã mười một giờ đêm rồi, anh ấy vẫn đang làm việc trong văn phòng.',
  },
  {
    hanzi: '遇到问题的时候，不要害怕，我们要勇敢面对。',
    pinyin: 'Yùdào wèntí de shíhou, bú yào hàipà, wǒmen yào yǒnggǎn miànduì.',
    vi: 'Khi gặp vấn đề, đừng sợ, chúng ta phải dũng cảm đối mặt.',
  },
  {
    hanzi: '我想一个人去旅游，可是爸爸妈妈不同意。',
    pinyin: 'Wǒ xiǎng yí ge rén qù lǚyóu, kěshì bàba māma bù tóngyì.',
    vi: 'Tôi muốn đi du lịch một mình, nhưng bố mẹ không đồng ý.',
  },
  {
    hanzi: '因为明天要下大雨，学校的运动会取消了。',
    pinyin: 'Yīnwèi míngtiān yào xià dà yǔ, xuéxiào de yùndònghuì qǔxiāo le.',
    vi: 'Vì ngày mai trời sẽ mưa to nên hội thao của trường bị hủy.',
  },
  {
    hanzi: '我刚来北京的时候，很不适应这里的天气。',
    pinyin: 'Wǒ gāng lái Běijīng de shíhou, hěn bú shìyìng zhèlǐ de tiānqì.',
    vi: 'Hồi mới đến Bắc Kinh, tôi rất không quen với thời tiết ở đây.',
  },
  {
    hanzi: '我和我的同事关系很好，下班以后常常一起吃饭。',
    pinyin: 'Wǒ hé wǒ de tóngshì guānxi hěn hǎo, xiàbān yǐhòu chángcháng yìqǐ chī fàn.',
    vi: 'Tôi với đồng nghiệp rất thân, tan làm thường đi ăn cùng nhau.',
  },
  {
    hanzi: '老师，我保证以后每天都按时完成作业。',
    pinyin: 'Lǎoshī, wǒ bǎozhèng yǐhòu měi tiān dōu ànshí wánchéng zuòyè.',
    vi: 'Thưa thầy, em cam đoan từ nay ngày nào cũng làm bài tập đúng giờ.',
  },
  {
    hanzi: '他今天又没有来上课，也没有说是什么理由。',
    pinyin: 'Tā jīntiān yòu méiyǒu lái shàngkè, yě méiyǒu shuō shì shénme lǐyóu.',
    vi: 'Hôm nay cậu ấy lại không đến lớp, cũng không nói là vì lý do gì.',
  },
  {
    hanzi: '我放在桌子上的蛋糕被妹妹吃完了。',
    pinyin: 'Wǒ fàng zài zhuōzi shang de dàngāo bèi mèimei chī wán le.',
    vi: 'Cái bánh ngọt tôi để trên bàn bị em gái ăn hết rồi.',
  },
  {
    hanzi: '我的奶奶已经九十岁了，她说想活到一百岁。',
    pinyin: 'Wǒ de nǎinai yǐjīng jiǔshí suì le, tā shuō xiǎng huó dào yì bǎi suì.',
    vi: 'Bà tôi đã chín mươi tuổi rồi, bà nói muốn sống đến một trăm tuổi.',
  },
  {
    hanzi: '到了新的城市以后，一切都要从头开始。',
    pinyin: 'Dào le xīn de chéngshì yǐhòu, yíqiè dōu yào cóngtóu kāishǐ.',
    vi: 'Đến một thành phố mới, mọi thứ đều phải bắt đầu lại từ đầu.',
  },
];

export default sentences;
