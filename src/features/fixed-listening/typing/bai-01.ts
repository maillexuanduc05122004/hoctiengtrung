/**
 * Câu dài tập gõ pinyin cho bài 1: mỗi câu ghép vài từ mới của bài (让, 身体,
 * 生病, 药 …) với từ HSK 1–2. Pinyin viết tay theo cách đọc thật (一 / 不 đã
 * biến điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '周末我和朋友一起去游泳，游泳以后我们去饭店吃鱼和肉。',
    pinyin: 'Zhōumò wǒ hé péngyou yìqǐ qù yóuyǒng, yóuyǒng yǐhòu wǒmen qù fàndiàn chī yú hé ròu.',
    vi: 'Cuối tuần tôi đi bơi cùng bạn, bơi xong chúng tôi đến nhà hàng ăn cá và thịt.',
  },
  {
    hanzi: '他生病了，头很疼，医生让他吃药，在家好好休息。',
    pinyin: 'Tā shēngbìng le, tóu hěn téng, yīshēng ràng tā chī yào, zài jiā hǎohǎo xiūxi.',
    vi: 'Anh ấy bị ốm, đầu rất đau, bác sĩ bảo anh ấy uống thuốc và ở nhà nghỉ ngơi cho tốt.',
  },
  {
    hanzi: '妈妈早上做早饭，晚上又要做晚饭，她真的很累。',
    pinyin: 'Māma zǎoshang zuò zǎofàn, wǎnshang yòu yào zuò wǎnfàn, tā zhēn de hěn lèi.',
    vi: 'Buổi sáng mẹ nấu bữa sáng, buổi tối lại phải nấu bữa tối, mẹ thật sự rất mệt.',
  },
  {
    hanzi: '老师问了一个问题，让我马上回答，但是我不知道怎么回答。',
    pinyin: 'Lǎoshī wèn le yí ge wèntí, ràng wǒ mǎshàng huídá, dànshì wǒ bù zhīdào zěnme huídá.',
    vi: 'Thầy giáo hỏi một câu, bảo tôi trả lời ngay, nhưng tôi không biết trả lời thế nào.',
  },
  {
    hanzi: '我的眼睛不太好，所以晚上不能看太长时间的书。',
    pinyin: 'Wǒ de yǎnjing bú tài hǎo, suǒyǐ wǎnshang bù néng kàn tài cháng shíjiān de shū.',
    vi: 'Mắt tôi không tốt lắm, nên buổi tối không thể đọc sách quá lâu.',
  },
  {
    hanzi: '弟弟的耳朵有点不舒服，妈妈马上带他去医院看医生。',
    pinyin: 'Dìdi de ěrduo yǒudiǎn bù shūfu, māma mǎshàng dài tā qù yīyuàn kàn yīshēng.',
    vi: 'Tai của em trai hơi khó chịu, mẹ lập tức đưa em đến bệnh viện khám bác sĩ.',
  },
  {
    hanzi: '晚上洗澡以后，我常常喝一杯热水，然后看半个小时的书。',
    pinyin: 'Wǎnshang xǐzǎo yǐhòu, wǒ chángcháng hē yì bēi rè shuǐ, ránhòu kàn bàn ge xiǎoshí de shū.',
    vi: 'Buổi tối sau khi tắm, tôi thường uống một cốc nước nóng, rồi đọc sách nửa tiếng.',
  },
  {
    hanzi: '生日那天，朋友送给我一个礼物和很多好看的花。',
    pinyin: 'Shēngrì nà tiān, péngyou sòng gěi wǒ yí ge lǐwù hé hěn duō hǎokàn de huā.',
    vi: 'Hôm sinh nhật, bạn tặng tôi một món quà và rất nhiều hoa đẹp.',
  },
  {
    hanzi: '哥哥周末常常去踢足球，所以他的身体比我好很多。',
    pinyin: 'Gēge zhōumò chángcháng qù tī zúqiú, suǒyǐ tā de shēntǐ bǐ wǒ hǎo hěn duō.',
    vi: 'Anh trai cuối tuần thường đi đá bóng, nên sức khỏe của anh ấy tốt hơn tôi nhiều.',
  },
  {
    hanzi: '今天我又没吃早饭，上课的时候一直想吃东西。',
    pinyin: 'Jīntiān wǒ yòu méi chī zǎofàn, shàngkè de shíhou yìzhí xiǎng chī dōngxi.',
    vi: 'Hôm nay tôi lại không ăn sáng, trong giờ học cứ muốn ăn gì đó.',
  },
  {
    hanzi: '医生说，如果你想让身体好起来，就要早一点睡觉。',
    pinyin: 'Yīshēng shuō, rúguǒ nǐ xiǎng ràng shēntǐ hǎo qǐlai, jiù yào zǎo yìdiǎn shuìjiào.',
    vi: 'Bác sĩ nói, nếu bạn muốn sức khỏe tốt lên thì phải ngủ sớm hơn một chút.',
  },
  {
    hanzi: '这家饭店的鱼和肉都很好吃，桌子上还放着很多花。',
    pinyin: 'Zhè jiā fàndiàn de yú hé ròu dōu hěn hǎochī, zhuōzi shàng hái fàng zhe hěn duō huā.',
    vi: 'Cá và thịt ở nhà hàng này đều rất ngon, trên bàn còn bày rất nhiều hoa.',
  },
  {
    hanzi: '她的眼睛很大，头发很长，妈妈说她长得很漂亮。',
    pinyin: 'Tā de yǎnjing hěn dà, tóufa hěn cháng, māma shuō tā zhǎng de hěn piàoliang.',
    vi: 'Mắt cô ấy rất to, tóc rất dài, mẹ nói cô ấy rất xinh.',
  },
  {
    hanzi: '你先去洗澡，我马上就做好晚饭，我们一起吃。',
    pinyin: 'Nǐ xiān qù xǐzǎo, wǒ mǎshàng jiù zuò hǎo wǎnfàn, wǒmen yìqǐ chī.',
    vi: 'Bạn đi tắm trước đi, tôi sẽ nấu xong bữa tối ngay, rồi chúng ta cùng ăn.',
  },
  {
    hanzi: '我生病的时候，朋友给我买了药，还送了我一个小礼物。',
    pinyin: 'Wǒ shēngbìng de shíhou, péngyou gěi wǒ mǎi le yào, hái sòng le wǒ yí ge xiǎo lǐwù.',
    vi: 'Khi tôi bị ốm, bạn mua thuốc cho tôi, còn tặng tôi một món quà nhỏ.',
  },
  {
    hanzi: '老师让我们马上写三个句子，写完以后再回答她的问题。',
    pinyin: 'Lǎoshī ràng wǒmen mǎshàng xiě sān ge jùzi, xiě wán yǐhòu zài huídá tā de wèntí.',
    vi: 'Cô giáo bảo chúng tôi viết ngay ba câu, viết xong rồi trả lời câu hỏi của cô.',
  },
  {
    hanzi: '天气太冷了，我不想去游泳，还是在家看电视吧。',
    pinyin: 'Tiānqì tài lěng le, wǒ bù xiǎng qù yóuyǒng, háishi zài jiā kàn diànshì ba.',
    vi: 'Trời lạnh quá, tôi không muốn đi bơi, thôi ở nhà xem tivi vậy.',
  },
  {
    hanzi: '他头疼了三天，吃了药，又睡了一个下午，现在身体好多了。',
    pinyin: 'Tā tóu téng le sān tiān, chī le yào, yòu shuì le yí ge xiàwǔ, xiànzài shēntǐ hǎo duō le.',
    vi: 'Anh ấy đau đầu ba ngày, uống thuốc, lại ngủ cả một buổi chiều, giờ người đã khỏe hơn nhiều.',
  },
  {
    hanzi: '周末早上我们先吃早饭，然后去公园踢足球，中午回家洗澡。',
    pinyin: 'Zhōumò zǎoshang wǒmen xiān chī zǎofàn, ránhòu qù gōngyuán tī zúqiú, zhōngwǔ huí jiā xǐzǎo.',
    vi: 'Sáng cuối tuần chúng tôi ăn sáng trước, sau đó ra công viên đá bóng, buổi trưa về nhà tắm.',
  },
  {
    hanzi: '我家的小猫耳朵很小，眼睛很大，它最喜欢吃鱼。',
    pinyin: 'Wǒ jiā de xiǎo māo ěrduo hěn xiǎo, yǎnjing hěn dà, tā zuì xǐhuan chī yú.',
    vi: 'Con mèo nhỏ nhà tôi tai rất nhỏ, mắt rất to, nó thích ăn cá nhất.',
  },
];

export default sentences;
