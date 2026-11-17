/**
 * Câu dài tập gõ pinyin cho bài 14: mỗi câu ghép từ mới của bài (chủ đề nhà cửa,
 * chuyển nhà: 搬、家具、沙发、空调、卫生间、整理、乱、修 …) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我们下个星期要搬家，这几天一直在整理东西。',
    pinyin: 'Wǒmen xià ge xīngqī yào bānjiā, zhè jǐ tiān yìzhí zài zhěnglǐ dōngxi.',
    vi: 'Tuần sau chúng tôi chuyển nhà, mấy hôm nay cứ dọn dẹp đồ đạc suốt.',
  },
  {
    hanzi: '新家的家具都是上个月在商店里买的，一点也不贵。',
    pinyin: 'Xīn jiā de jiājù dōu shì shàng ge yuè zài shāngdiàn li mǎi de, yìdiǎn yě bú guì.',
    vi: 'Đồ nội thất nhà mới đều mua ở cửa hàng tháng trước, chẳng đắt chút nào.',
  },
  {
    hanzi: '爸爸每天晚上都坐在沙发上看电视，一看就是两个小时。',
    pinyin: 'Bàba měi tiān wǎnshang dōu zuò zài shāfā shang kàn diànshì, yí kàn jiù shì liǎng ge xiǎoshí.',
    vi: 'Tối nào bố cũng ngồi trên sofa xem tivi, xem một lèo là hai tiếng.',
  },
  {
    hanzi: '外面太热了，你进来以后把空调打开吧。',
    pinyin: 'Wàimiàn tài rè le, nǐ jìnlái yǐhòu bǎ kōngtiáo dǎkāi ba.',
    vi: 'Bên ngoài nóng quá, bạn vào rồi thì bật điều hòa lên nhé.',
  },
  {
    hanzi: '我们新家的卫生间比以前的大多了，也很干净。',
    pinyin: 'Wǒmen xīn jiā de wèishēngjiān bǐ yǐqián de dà duō le, yě hěn gānjìng.',
    vi: 'Phòng vệ sinh nhà mới của chúng tôi rộng hơn trước nhiều, lại rất sạch.',
  },
  {
    hanzi: '你的房间太乱了，书和衣服到处都是，快去整理一下。',
    pinyin: 'Nǐ de fángjiān tài luàn le, shū hé yīfu dàochù dōu shì, kuài qù zhěnglǐ yíxià.',
    vi: 'Phòng bạn bừa quá, sách vở quần áo chỗ nào cũng có, mau đi dọn đi.',
  },
  {
    hanzi: '我的自行车坏了，明天要找人帮我修一下。',
    pinyin: 'Wǒ de zìxíngchē huài le, míngtiān yào zhǎo rén bāng wǒ xiū yíxià.',
    vi: 'Xe đạp của tôi hỏng rồi, mai phải nhờ người sửa giúp.',
  },
  {
    hanzi: '他还没听我说完，就把电话挂了。',
    pinyin: 'Tā hái méi tīng wǒ shuō wán, jiù bǎ diànhuà guà le.',
    vi: 'Anh ấy chưa nghe tôi nói hết đã cúp máy.',
  },
  {
    hanzi: '我买了一张明天早上去上海的火车票。',
    pinyin: 'Wǒ mǎi le yì zhāng míngtiān zǎoshang qù Shànghǎi de huǒchē piào.',
    vi: 'Tôi đã mua một vé tàu hỏa đi Thượng Hải sáng mai.',
  },
  {
    hanzi: '我的父亲是医生，他每天都工作到很晚才回家。',
    pinyin: 'Wǒ de fùqīn shì yīshēng, tā měi tiān dōu gōngzuò dào hěn wǎn cái huí jiā.',
    vi: 'Bố tôi là bác sĩ, ngày nào cũng làm việc đến rất khuya mới về nhà.',
  },
  {
    hanzi: '今天天气很暖和，我们下午一起去外面运动吧。',
    pinyin: 'Jīntiān tiānqì hěn nuǎnhuo, wǒmen xiàwǔ yìqǐ qù wàimiàn yùndòng ba.',
    vi: 'Hôm nay trời ấm áp, chiều nay mình cùng ra ngoài vận động nhé.',
  },
  {
    hanzi: '这个房间的阳光很好，早上起床的时候特别舒服。',
    pinyin: 'Zhège fángjiān de yángguāng hěn hǎo, zǎoshang qǐchuáng de shíhou tèbié shūfu.',
    vi: 'Phòng này nhiều nắng, sáng ngủ dậy thấy dễ chịu vô cùng.',
  },
  {
    hanzi: '我家周围有很多饭馆和商店，买东西非常方便。',
    pinyin: 'Wǒ jiā zhōuwéi yǒu hěn duō fànguǎn hé shāngdiàn, mǎi dōngxi fēicháng fāngbiàn.',
    vi: 'Xung quanh nhà tôi có nhiều quán ăn và cửa hàng, mua sắm cực kỳ tiện.',
  },
  {
    hanzi: '这件衣服已经很旧了，你还是买一件新的吧。',
    pinyin: 'Zhè jiàn yīfu yǐjīng hěn jiù le, nǐ háishi mǎi yí jiàn xīn de ba.',
    vi: 'Cái áo này cũ lắm rồi, bạn mua cái mới đi thì hơn.',
  },
  {
    hanzi: '这张照片是去年我们一家人在北京照的。',
    pinyin: 'Zhè zhāng zhàopiàn shì qùnián wǒmen yì jiā rén zài Běijīng zhào de.',
    vi: 'Tấm ảnh này cả nhà tôi chụp ở Bắc Kinh năm ngoái.',
  },
  {
    hanzi: '妈妈给我买了一双新鞋，穿起来很舒服。',
    pinyin: 'Māma gěi wǒ mǎi le yì shuāng xīn xié, chuān qǐlai hěn shūfu.',
    vi: 'Mẹ mua cho tôi một đôi giày mới, đi vào rất êm chân.',
  },
  {
    hanzi: '这个沙发的价格有点贵，我们再去别的商店看看吧。',
    pinyin: 'Zhège shāfā de jiàgé yǒudiǎn guì, wǒmen zài qù bié de shāngdiàn kànkan ba.',
    vi: 'Cái sofa này giá hơi đắt, mình đi xem thêm cửa hàng khác đi.',
  },
  {
    hanzi: '现在很多人出门不带现金，用手机就可以付钱。',
    pinyin: 'Xiànzài hěn duō rén chūmén bú dài xiànjīn, yòng shǒujī jiù kěyǐ fù qián.',
    vi: 'Bây giờ nhiều người ra ngoài không mang tiền mặt, dùng điện thoại là trả tiền được.',
  },
  {
    hanzi: '房租每个月一号以前要付，你千万别忘了。',
    pinyin: 'Fángzū měi ge yuè yī hào yǐqián yào fù, nǐ qiānwàn bié wàng le.',
    vi: 'Tiền nhà phải trả trước mùng một hằng tháng, bạn nhớ đừng quên nhé.',
  },
  {
    hanzi: '搬家公司的人帮我们把家具和沙发都搬到了新家。',
    pinyin: 'Bānjiā gōngsī de rén bāng wǒmen bǎ jiājù hé shāfā dōu bān dào le xīn jiā.',
    vi: 'Người của công ty chuyển nhà giúp chúng tôi chuyển hết đồ đạc và sofa sang nhà mới.',
  },
];

export default sentences;
