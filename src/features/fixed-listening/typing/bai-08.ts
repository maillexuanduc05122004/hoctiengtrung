/**
 * Câu dài tập gõ pinyin cho bài 8: mỗi câu ghép vài từ mới của bài (20 từ HSK 3
 * 代表 … 订) với từ HSK 1–2. Pinyin viết tay theo cách đọc thật (一 / 不 đã biến
 * điệu, thanh nhẹ để trống); bản không biến điệu tự được chấp nhận.
 */
import type { FixedTypingSentence } from '../types.ts';

const sentences: FixedTypingSentence[] = [
  {
    hanzi: '他代表我们班参加了学校的汉语比赛，得了第一名。',
    pinyin: 'Tā dàibiǎo wǒmen bān cānjiā le xuéxiào de Hànyǔ bǐsài, dé le dì yī míng.',
    vi: 'Anh ấy thay mặt lớp chúng tôi tham gia cuộc thi tiếng Trung của trường và giành giải nhất.',
  },
  {
    hanzi: '星期天老师带领我们去山上看花，大家都玩得很高兴。',
    pinyin: 'Xīngqītiān lǎoshī dàilǐng wǒmen qù shān shang kàn huā, dàjiā dōu wán de hěn gāoxìng.',
    vi: 'Chủ nhật thầy giáo dẫn chúng tôi lên núi ngắm hoa, mọi người chơi rất vui.',
  },
  {
    hanzi: '这本汉语书一共有十二个单元，我们已经学了一半。',
    pinyin: "Zhè běn Hànyǔ shū yígòng yǒu shí'èr ge dānyuán, wǒmen yǐjīng xué le yíbàn.",
    vi: 'Quyển sách tiếng Trung này có tất cả mười hai bài, chúng tôi đã học được một nửa.',
  },
  {
    hanzi: '当初我一句汉语也不会说，现在已经能跟中国朋友用汉语说话了。',
    pinyin: 'Dāngchū wǒ yí jù Hànyǔ yě bú huì shuō, xiànzài yǐjīng néng gēn Zhōngguó péngyou yòng Hànyǔ shuōhuà le.',
    vi: 'Lúc đầu tôi một câu tiếng Trung cũng không biết nói, giờ đã nói chuyện được với bạn Trung Quốc bằng tiếng Trung rồi.',
  },
  {
    hanzi: '到了一个新的城市，我最喜欢去吃当地的小吃。',
    pinyin: 'Dào le yí ge xīn de chéngshì, wǒ zuì xǐhuan qù chī dāngdì de xiǎochī.',
    vi: 'Đến một thành phố mới, tôi thích nhất là đi ăn món ăn vặt địa phương.',
  },
  {
    hanzi: '你要是有时间来我家玩，我当然非常欢迎。',
    pinyin: 'Nǐ yàoshi yǒu shíjiān lái wǒ jiā wán, wǒ dāngrán fēicháng huānyíng.',
    vi: 'Nếu bạn có thời gian đến nhà tôi chơi, tôi đương nhiên rất hoan nghênh.',
  },
  {
    hanzi: '在我们班的同学当中，他的汉语说得最流利。',
    pinyin: 'Zài wǒmen bān de tóngxué dāngzhōng, tā de Hànyǔ shuō de zuì liúlì.',
    vi: 'Trong số các bạn lớp tôi, anh ấy nói tiếng Trung lưu loát nhất.',
  },
  {
    hanzi: '妈妈正在用刀做菜，让我们先去洗手准备吃饭。',
    pinyin: 'Māma zhèngzài yòng dāo zuò cài, ràng wǒmen xiān qù xǐ shǒu zhǔnbèi chīfàn.',
    vi: 'Mẹ đang dùng dao nấu ăn, bảo chúng tôi đi rửa tay trước để chuẩn bị ăn cơm.',
  },
  {
    hanzi: '这个电视剧的导演很年轻，可是已经非常有名了。',
    pinyin: 'Zhège diànshìjù de dǎoyǎn hěn niánqīng, kěshì yǐjīng fēicháng yǒumíng le.',
    vi: 'Đạo diễn của bộ phim truyền hình này còn rất trẻ, nhưng đã rất nổi tiếng.',
  },
  {
    hanzi: '我们坐了十个小时的火车，晚上九点才到达上海。',
    pinyin: 'Wǒmen zuò le shí ge xiǎoshí de huǒchē, wǎnshang jiǔ diǎn cái dàodá Shànghǎi.',
    vi: 'Chúng tôi ngồi tàu hoả mười tiếng, chín giờ tối mới đến Thượng Hải.',
  },
  {
    hanzi: '你说了半天，到底想不想跟我们一起去看电影？',
    pinyin: 'Nǐ shuō le bàntiān, dàodǐ xiǎng bu xiǎng gēn wǒmen yìqǐ qù kàn diànyǐng?',
    vi: 'Bạn nói cả buổi rồi, rốt cuộc có muốn đi xem phim với chúng tôi không?',
  },
  {
    hanzi: '比赛最后一分钟，他又得分了，大家都高兴得笑了起来。',
    pinyin: 'Bǐsài zuìhòu yì fēnzhōng, tā yòu défēn le, dàjiā dōu gāoxìng de xiào le qǐlái.',
    vi: 'Phút cuối trận đấu, anh ấy lại ghi điểm, mọi người vui đến bật cười.',
  },
  {
    hanzi: '我在车站等待了很长时间，可是朋友一直没有来。',
    pinyin: 'Wǒ zài chēzhàn děngdài le hěn cháng shíjiān, kěshì péngyou yìzhí méiyǒu lái.',
    vi: 'Tôi chờ ở bến xe rất lâu, nhưng bạn tôi mãi vẫn không đến.',
  },
  {
    hanzi: '小猫很怕人，每次有客人来都跑到床底下去。',
    pinyin: 'Xiǎo māo hěn pà rén, měi cì yǒu kèrén lái dōu pǎo dào chuáng dǐxia qù.',
    vi: 'Con mèo nhỏ rất sợ người, lần nào có khách đến cũng chạy xuống gầm giường.',
  },
  {
    hanzi: '这个地区冬天非常冷，很多人都不愿意出门。',
    pinyin: 'Zhège dìqū dōngtiān fēicháng lěng, hěn duō rén dōu bú yuànyì chūmén.',
    vi: 'Mùa đông ở khu vực này rất lạnh, nhiều người không muốn ra khỏi nhà.',
  },
  {
    hanzi: '奶奶每天晚饭以后都要看一个小时的电视剧。',
    pinyin: 'Nǎinai měi tiān wǎnfàn yǐhòu dōu yào kàn yí ge xiǎoshí de diànshìjù.',
    vi: 'Ngày nào sau bữa tối bà cũng xem phim truyền hình một tiếng.',
  },
  {
    hanzi: '我哥哥今年二十五岁，在北京的一家电视台工作。',
    pinyin: 'Wǒ gēge jīnnián èrshíwǔ suì, zài Běijīng de yì jiā diànshìtái gōngzuò.',
    vi: 'Anh trai tôi năm nay hai mươi lăm tuổi, làm việc ở một đài truyền hình ở Bắc Kinh.',
  },
  {
    hanzi: '老师让我们回家以后给她写电子邮件，说说今天学了什么。',
    pinyin: 'Lǎoshī ràng wǒmen huí jiā yǐhòu gěi tā xiě diànzǐ yóujiàn, shuōshuo jīntiān xué le shénme.',
    vi: 'Cô giáo bảo chúng tôi về nhà viết email cho cô, kể xem hôm nay đã học được gì.',
  },
  {
    hanzi: '学校做了一个调查，问学生们每天睡几个小时。',
    pinyin: 'Xuéxiào zuò le yí ge diàochá, wèn xuéshengmen měi tiān shuì jǐ ge xiǎoshí.',
    vi: 'Nhà trường làm một cuộc khảo sát, hỏi học sinh mỗi ngày ngủ mấy tiếng.',
  },
  {
    hanzi: '下个月我们要去北京旅游，我已经在网上订好了酒店。',
    pinyin: 'Xià ge yuè wǒmen yào qù Běijīng lǚyóu, wǒ yǐjīng zài wǎngshang dìng hǎo le jiǔdiàn.',
    vi: 'Tháng sau chúng tôi đi Bắc Kinh du lịch, tôi đã đặt xong khách sạn trên mạng rồi.',
  },
];

export default sentences;
