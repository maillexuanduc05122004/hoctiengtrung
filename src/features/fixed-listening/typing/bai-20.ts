/**
 * Câu dài tập gõ pinyin cho bài 20: mỗi câu ghép từ mới của bài (20 từ HSK 3 về
 * giải quyết khó khăn, máy tính và đồ dùng: 意外、计算、工具、利用 … 能力) với từ HSK 1–2.
 * Pinyin viết tay theo cách đọc thật (一 / 不 đã biến điệu, thanh nhẹ để trống);
 * bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '我没想到他会来参加我的生日晚会，真是太意外了。',
    pinyin: 'Wǒ méi xiǎngdào tā huì lái cānjiā wǒ de shēngrì wǎnhuì, zhēn shì tài yìwài le.',
    vi: 'Tôi không ngờ anh ấy lại đến dự tiệc sinh nhật của tôi, thật quá bất ngờ.',
  },
  {
    hanzi: '你帮我计算一下，我们这次旅游一共要花多少钱。',
    pinyin: 'Nǐ bāng wǒ jìsuàn yíxià, wǒmen zhè cì lǚyóu yígòng yào huā duōshao qián.',
    vi: 'Bạn tính giúp tôi xem chuyến du lịch lần này chúng ta tổng cộng phải tiêu bao nhiêu tiền.',
  },
  {
    hanzi: '现在手机已经成了我们每天学习和工作的重要工具。',
    pinyin: 'Xiànzài shǒujī yǐjīng chéng le wǒmen měi tiān xuéxí hé gōngzuò de zhòngyào gōngjù.',
    vi: 'Bây giờ điện thoại đã trở thành công cụ quan trọng để chúng ta học tập và làm việc mỗi ngày.',
  },
  {
    hanzi: '他因为上班经常迟到，最后失去了这份很好的工作。',
    pinyin: 'Tā yīnwèi shàngbān jīngcháng chídào, zuìhòu shīqù le zhè fèn hěn hǎo de gōngzuò.',
    vi: 'Vì đi làm hay đến muộn, cuối cùng anh ấy mất công việc rất tốt này.',
  },
  {
    hanzi: '这种药我吃了三天，效果不太好，我想去医院看看。',
    pinyin: 'Zhè zhǒng yào wǒ chī le sān tiān, xiàoguǒ bú tài hǎo, wǒ xiǎng qù yīyuàn kànkan.',
    vi: 'Thuốc này tôi uống ba ngày rồi, hiệu quả không tốt lắm, tôi muốn đến bệnh viện khám xem sao.',
  },
  {
    hanzi: '我每天坐地铁的时候，都会利用这段时间听汉语。',
    pinyin: 'Wǒ měi tiān zuò dìtiě de shíhou, dōu huì lìyòng zhè duàn shíjiān tīng Hànyǔ.',
    vi: 'Mỗi ngày lúc đi tàu điện ngầm, tôi đều tận dụng khoảng thời gian này để nghe tiếng Trung.',
  },
  {
    hanzi: '他每天都练习说汉语，这个月进步得很明显。',
    pinyin: 'Tā měi tiān dōu liànxí shuō Hànyǔ, zhège yuè jìnbù de hěn míngxiǎn.',
    vi: 'Ngày nào anh ấy cũng luyện nói tiếng Trung, tháng này tiến bộ thấy rõ.',
  },
  {
    hanzi: '你说得没错，这家饭馆的菜确实好吃，而且也不贵。',
    pinyin: 'Nǐ shuō de méi cuò, zhè jiā fànguǎn de cài quèshí hǎochī, érqiě yě bú guì.',
    vi: 'Bạn nói không sai, món ăn của quán này đúng là ngon, mà lại không đắt.',
  },
  {
    hanzi: '老师说的话我基本上都能听懂，可是说得还不太好。',
    pinyin: 'Lǎoshī shuō de huà wǒ jīběnshang dōu néng tīngdǒng, kěshì shuō de hái bú tài hǎo.',
    vi: 'Lời thầy giáo nói tôi gần như đều nghe hiểu được, nhưng nói thì vẫn chưa tốt lắm.',
  },
  {
    hanzi: '他不但会说汉语，并且说得跟中国人一样好。',
    pinyin: 'Tā búdàn huì shuō Hànyǔ, bìngqiě shuō de gēn Zhōngguó rén yíyàng hǎo.',
    vi: 'Anh ấy không những biết nói tiếng Trung, mà còn nói giỏi như người Trung Quốc.',
  },
  {
    hanzi: '为了能早一点到公司，我每天六点就起床了。',
    pinyin: 'Wèile néng zǎo yìdiǎn dào gōngsī, wǒ měi tiān liù diǎn jiù qǐchuáng le.',
    vi: 'Để có thể đến công ty sớm hơn một chút, ngày nào tôi cũng dậy từ sáu giờ.',
  },
  {
    hanzi: '你在这里碰到任何问题，都可以给我打电话。',
    pinyin: 'Nǐ zài zhèlǐ pèngdào rènhé wèntí, dōu kěyǐ gěi wǒ dǎ diànhuà.',
    vi: 'Ở đây bạn gặp bất kỳ vấn đề gì cũng có thể gọi điện cho tôi.',
  },
  {
    hanzi: '我想去中国留学，爸爸妈妈都很支持我的决定。',
    pinyin: 'Wǒ xiǎng qù Zhōngguó liúxué, bàba māma dōu hěn zhīchí wǒ de juédìng.',
    vi: 'Tôi muốn đi du học Trung Quốc, bố mẹ đều rất ủng hộ quyết định của tôi.',
  },
  {
    hanzi: '刚来中国的时候，我在生活上碰到了很多困难。',
    pinyin: 'Gāng lái Zhōngguó de shíhou, wǒ zài shēnghuó shang pèngdào le hěn duō kùnnan.',
    vi: 'Hồi mới sang Trung Quốc, tôi gặp rất nhiều khó khăn trong cuộc sống.',
  },
  {
    hanzi: '北京是一个非常漂亮的城市，很值得去看看。',
    pinyin: 'Běijīng shì yí ge fēicháng piàoliang de chéngshì, hěn zhíde qù kànkan.',
    vi: 'Bắc Kinh là một thành phố rất đẹp, rất đáng để đến xem.',
  },
  {
    hanzi: '这是我专门为你买的生日礼物，希望你会喜欢。',
    pinyin: 'Zhè shì wǒ zhuānmén wèi nǐ mǎi de shēngrì lǐwù, xīwàng nǐ huì xǐhuan.',
    vi: 'Đây là quà sinh nhật tôi mua riêng cho bạn, mong là bạn sẽ thích.',
  },
  {
    hanzi: '麻烦你帮我看一下，我的电脑为什么打不开了。',
    pinyin: 'Máfan nǐ bāng wǒ kàn yíxià, wǒ de diànnǎo wèi shénme dǎ bu kāi le.',
    vi: 'Phiền bạn xem giúp tôi, sao máy tính của tôi không mở lên được nữa.',
  },
  {
    hanzi: '真奇怪，我刚才还在用手机，现在怎么找不到了？',
    pinyin: 'Zhēn qíguài, wǒ gāngcái hái zài yòng shǒujī, xiànzài zěnme zhǎo bu dào le?',
    vi: 'Lạ thật, vừa nãy tôi còn đang dùng điện thoại, sao giờ lại không tìm thấy nữa?',
  },
  {
    hanzi: '这本书的内容很简单，很适合刚开始学汉语的人。',
    pinyin: 'Zhè běn shū de nèiróng hěn jiǎndān, hěn shìhé gāng kāishǐ xué Hànyǔ de rén.',
    vi: 'Nội dung quyển sách này rất đơn giản, rất hợp với người mới bắt đầu học tiếng Trung.',
  },
  {
    hanzi: '经理觉得他的工作能力很强，想让他做更多的事情。',
    pinyin: 'Jīnglǐ juéde tā de gōngzuò nénglì hěn qiáng, xiǎng ràng tā zuò gèng duō de shìqing.',
    vi: 'Giám đốc thấy năng lực làm việc của anh ấy rất giỏi, muốn giao cho anh ấy nhiều việc hơn.',
  },
];

export default sentences;
