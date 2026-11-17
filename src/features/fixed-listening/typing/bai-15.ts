/**
 * Câu dài tập gõ pinyin cho bài 15: mỗi câu ghép từ mới của bài (20 từ HSK 3
 * về mua sắm và ăn uống: 啤酒、汤、香蕉、裙子、市场、要是、恐怕 …) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '天气太热了，下班以后我们一起去喝杯啤酒吧。',
    pinyin: 'Tiānqì tài rè le, xiàbān yǐhòu wǒmen yìqǐ qù hē bēi píjiǔ ba.',
    vi: 'Trời nóng quá, tan làm chúng ta cùng đi làm cốc bia nhé.',
  },
  {
    hanzi: '妈妈做的鸡蛋汤非常好喝，我一个人就喝了两碗。',
    pinyin: 'Māma zuò de jīdàn tāng fēicháng hǎohē, wǒ yí ge rén jiù hē le liǎng wǎn.',
    vi: 'Canh trứng mẹ nấu ngon cực, một mình tôi ăn hết hai bát.',
  },
  {
    hanzi: '这些香蕉又大又甜，一共才十五块钱。',
    pinyin: 'Zhèxiē xiāngjiāo yòu dà yòu tián, yígòng cái shíwǔ kuài qián.',
    vi: 'Chỗ chuối này vừa to vừa ngọt, tất cả chỉ có mười lăm tệ.',
  },
  {
    hanzi: '我最近吃得太多又不运动，所以胖了五公斤。',
    pinyin: 'Wǒ zuìjìn chī de tài duō yòu bú yùndòng, suǒyǐ pàng le wǔ gōngjīn.',
    vi: 'Dạo này tôi ăn nhiều lại không vận động, nên béo lên năm cân.',
  },
  {
    hanzi: '这条裙子的颜色很好看，可是有点短，我想换一条长的。',
    pinyin: 'Zhè tiáo qúnzi de yánsè hěn hǎokàn, kěshì yǒudiǎn duǎn, wǒ xiǎng huàn yì tiáo cháng de.',
    vi: 'Màu chiếc váy này đẹp, nhưng hơi ngắn, tôi muốn đổi chiếc dài hơn.',
  },
  {
    hanzi: '周末我常常跟妈妈去市场买菜，那里的菜又新鲜又便宜。',
    pinyin: 'Zhōumò wǒ chángcháng gēn māma qù shìchǎng mǎi cài, nàlǐ de cài yòu xīnxiān yòu piányi.',
    vi: 'Cuối tuần tôi hay cùng mẹ đi chợ mua thức ăn, đồ ăn ở đó vừa tươi vừa rẻ.',
  },
  {
    hanzi: '我们只有两个人，点这么多菜吃不完，太浪费了。',
    pinyin: 'Wǒmen zhǐyǒu liǎng ge rén, diǎn zhème duō cài chī bu wán, tài làngfèi le.',
    vi: 'Chúng ta chỉ có hai người, gọi nhiều món thế ăn không hết, phí quá.',
  },
  {
    hanzi: '他找到了一个很好的工作，对现在的生活非常满足。',
    pinyin: 'Tā zhǎo dào le yí ge hěn hǎo de gōngzuò, duì xiànzài de shēnghuó fēicháng mǎnzú.',
    vi: 'Anh ấy tìm được một công việc rất tốt, rất hài lòng với cuộc sống hiện tại.',
  },
  {
    hanzi: '我每天早上六点起床，先去跑步，然后回家吃早饭。',
    pinyin: 'Wǒ měi tiān zǎoshang liù diǎn qǐchuáng, xiān qù pǎobù, ránhòu huí jiā chī zǎofàn.',
    vi: 'Sáng nào tôi cũng dậy lúc sáu giờ, đi chạy bộ trước, sau đó về nhà ăn sáng.',
  },
  {
    hanzi: '这件衣服太大了，不适合你，你去试试那件小一点的。',
    pinyin: 'Zhè jiàn yīfu tài dà le, bú shìhé nǐ, nǐ qù shìshi nà jiàn xiǎo yìdiǎn de.',
    vi: 'Cái áo này rộng quá, không hợp với bạn, bạn thử cái nhỏ hơn kia xem.',
  },
  {
    hanzi: '从这里到机场很远，坐出租车至少要一个小时。',
    pinyin: 'Cóng zhèlǐ dào jīchǎng hěn yuǎn, zuò chūzūchē zhìshǎo yào yí ge xiǎoshí.',
    vi: 'Từ đây đến sân bay rất xa, đi taxi mất ít nhất một tiếng.',
  },
  {
    hanzi: '医生说我不能吃太多糖，所以我喝咖啡的时候不放糖。',
    pinyin: 'Yīshēng shuō wǒ bù néng chī tài duō táng, suǒyǐ wǒ hē kāfēi de shíhou bú fàng táng.',
    vi: 'Bác sĩ nói tôi không được ăn nhiều đường, nên khi uống cà phê tôi không cho đường.',
  },
  {
    hanzi: '只有早上早点去市场，才能买到新鲜的鱼和肉。',
    pinyin: 'Zhǐyǒu zǎoshang zǎo diǎn qù shìchǎng, cái néng mǎi dào xīnxiān de yú hé ròu.',
    vi: 'Chỉ khi buổi sáng ra chợ sớm một chút thì mới mua được cá và thịt tươi.',
  },
  {
    hanzi: '我在机场买了一本杂志，在飞机上看了两个小时。',
    pinyin: 'Wǒ zài jīchǎng mǎi le yì běn zázhì, zài fēijī shang kàn le liǎng ge xiǎoshí.',
    vi: 'Tôi mua một cuốn tạp chí ở sân bay, đọc trên máy bay suốt hai tiếng.',
  },
  {
    hanzi: '这里的风景太漂亮了，你能帮我拍几张照片吗？',
    pinyin: 'Zhèlǐ de fēngjǐng tài piàoliang le, nǐ néng bāng wǒ pāi jǐ zhāng zhàopiàn ma?',
    vi: 'Phong cảnh ở đây đẹp quá, bạn chụp giúp tôi vài tấm ảnh được không?',
  },
  {
    hanzi: '要是明天不下雨，我们就去公园跑步，好不好？',
    pinyin: 'Yàoshi míngtiān bú xià yǔ, wǒmen jiù qù gōngyuán pǎobù, hǎo bu hǎo?',
    vi: 'Nếu mai không mưa thì chúng ta ra công viên chạy bộ, được không?',
  },
  {
    hanzi: '已经八点了，路上车又多，我们恐怕要迟到了。',
    pinyin: 'Yǐjīng bā diǎn le, lùshang chē yòu duō, wǒmen kǒngpà yào chídào le.',
    vi: 'Đã tám giờ rồi, đường lại đông xe, e là chúng ta sắp muộn mất.',
  },
  {
    hanzi: '我不太喜欢吃甜的东西，可是我妹妹每天都要吃蛋糕。',
    pinyin: 'Wǒ bú tài xǐhuan chī tián de dōngxi, kěshì wǒ mèimei měi tiān dōu yào chī dàngāo.',
    vi: 'Tôi không thích đồ ngọt lắm, nhưng em gái tôi ngày nào cũng đòi ăn bánh ngọt.',
  },
  {
    hanzi: '这家饭店的优点是菜好吃，价格也不贵，所以客人很多。',
    pinyin: 'Zhè jiā fàndiàn de yōudiǎn shì cài hǎochī, jiàgé yě bú guì, suǒyǐ kèrén hěn duō.',
    vi: 'Ưu điểm của nhà hàng này là món ngon, giá cũng không đắt, nên rất đông khách.',
  },
  {
    hanzi: '公司今年的工作增加了很多，大家每天都很忙。',
    pinyin: 'Gōngsī jīnnián de gōngzuò zēngjiā le hěn duō, dàjiā měi tiān dōu hěn máng.',
    vi: 'Năm nay việc ở công ty tăng lên nhiều, ngày nào mọi người cũng rất bận.',
  },
];

export default sentences;
