/**
 * Bài nghe đoạn văn 1: "Sắp khai giảng rồi".
 *
 * Soạn tay, chỉ dùng từ trong lộ trình 300 từ và ba bài nghe cố định (20 từ mới
 * mỗi bài), ưu tiên những từ vừa học như 快要、开学、机票、记得、还是、红茶、
 * 经常、篮球. Câu ngắn, ngữ pháp HSK 1–2, mỗi đoạn năm đến bảy câu.
 */
import type { Passage } from '../types.ts';

const passage: Passage = {
  title: '快要开学了',
  titlePinyin: 'Kuàiyào kāixué le',
  titleVi: 'Sắp khai giảng rồi',
  level: 'HSK 1–2',
  pauseSeconds: 20,
  paragraphs: [
    {
      sentences: [
        {
          hanzi: '我叫小文，今年十七岁，是高中学生。',
          pinyin: 'Wǒ jiào Xiǎowén, jīnnián shíqī suì, shì gāozhōng xuésheng.',
          vi: 'Mình tên là Tiểu Văn, năm nay mười bảy tuổi, là học sinh cấp ba.',
        },
        {
          hanzi: '我家在北京，但是我的学校不在北京。',
          pinyin: 'Wǒ jiā zài Běijīng, dànshì wǒ de xuéxiào bú zài Běijīng.',
          vi: 'Nhà mình ở Bắc Kinh, nhưng trường của mình không ở Bắc Kinh.',
        },
        {
          hanzi: '七月我坐飞机回来了，在家住了一个多月。',
          pinyin: 'Qī yuè wǒ zuò fēijī huílái le, zài jiā zhù le yí ge duō yuè.',
          vi: 'Tháng bảy mình đi máy bay về, ở nhà hơn một tháng.',
        },
        {
          hanzi: '现在快要开学了，我要回去了。',
          pinyin: 'Xiànzài kuàiyào kāixué le, wǒ yào huíqù le.',
          vi: 'Bây giờ sắp khai giảng rồi, mình phải quay lại trường rồi.',
        },
        {
          hanzi: '我很想见我的同学和老师。',
          pinyin: 'Wǒ hěn xiǎng jiàn wǒ de tóngxué hé lǎoshī.',
          vi: 'Mình rất muốn gặp các bạn cùng lớp và thầy cô.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '星期一，爸爸帮我买了机票。',
          pinyin: 'Xīngqīyī, bàba bāng wǒ mǎi le jīpiào.',
          vi: 'Thứ hai, bố giúp mình mua vé máy bay.',
        },
        {
          hanzi: '机票有点贵，但是爸爸说没关系。',
          pinyin: 'Jīpiào yǒudiǎn guì, dànshì bàba shuō méi guānxi.',
          vi: 'Vé máy bay hơi đắt, nhưng bố nói không sao.',
        },
        {
          hanzi: '妈妈对我说：“你记得准备衣服和书。”',
          pinyin: 'Māma duì wǒ shuō: “Nǐ jìde zhǔnbèi yīfu hé shū.”',
          vi: 'Mẹ nói với mình: “Con nhớ chuẩn bị quần áo và sách nhé.”',
        },
        {
          hanzi: '我打开我的包，里面有两本书、三件衣服，还有一条黑色的裤子。',
          pinyin: 'Wǒ dǎkāi wǒ de bāo, lǐmiàn yǒu liǎng běn shū, sān jiàn yīfu, hái yǒu yì tiáo hēisè de kùzi.',
          vi: 'Mình mở túi ra, bên trong có hai quyển sách, ba cái áo, và một chiếc quần màu đen.',
        },
        {
          hanzi: '妈妈觉得衣服太少了。',
          pinyin: 'Māma juéde yīfu tài shǎo le.',
          vi: 'Mẹ thấy quần áo ít quá.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '星期二下午，妈妈跟我一起去商店买衣服。',
          pinyin: 'Xīngqī’èr xiàwǔ, māma gēn wǒ yìqǐ qù shāngdiàn mǎi yīfu.',
          vi: 'Chiều thứ ba, mẹ cùng mình đi cửa hàng mua quần áo.',
        },
        {
          hanzi: '商店里人很多。',
          pinyin: 'Shāngdiàn lǐ rén hěn duō.',
          vi: 'Trong cửa hàng rất đông người.',
        },
        {
          hanzi: '妈妈问我：“你喜欢红色的还是白色的？”',
          pinyin: 'Māma wèn wǒ: “Nǐ xǐhuan hóngsè de háishi báisè de?”',
          vi: 'Mẹ hỏi mình: “Con thích cái màu đỏ hay cái màu trắng?”',
        },
        {
          hanzi: '我说：“我还是喜欢红色。”',
          pinyin: 'Wǒ shuō: “Wǒ háishi xǐhuan hóngsè.”',
          vi: 'Mình nói: “Con vẫn thích màu đỏ.”',
        },
        {
          hanzi: '我们买了一件红色的衣服，不太贵，也很好看。',
          pinyin: 'Wǒmen mǎi le yí jiàn hóngsè de yīfu, bú tài guì, yě hěn hǎokàn.',
          vi: 'Hai mẹ con mua một cái áo màu đỏ, không đắt lắm, mà cũng rất đẹp.',
        },
        {
          hanzi: '晚上爸爸做了鱼和肉，很好吃。',
          pinyin: 'Wǎnshang bàba zuò le yú hé ròu, hěn hǎochī.',
          vi: 'Buổi tối bố nấu cá và thịt, rất ngon.',
        },
        {
          hanzi: '晚饭以后，我们一起喝红茶、看电视。',
          pinyin: 'Wǎnfàn yǐhòu, wǒmen yìqǐ hē hóngchá, kàn diànshì.',
          vi: 'Ăn tối xong, cả nhà cùng uống trà đen, xem tivi.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '星期三早上，我六点就起床了。',
          pinyin: 'Xīngqīsān zǎoshang, wǒ liù diǎn jiù qǐchuáng le.',
          vi: 'Sáng thứ tư, mới sáu giờ mình đã dậy rồi.',
        },
        {
          hanzi: '吃了早饭以后，爸爸开车，我们一起去机场。',
          pinyin: 'Chī le zǎofàn yǐhòu, bàba kāichē, wǒmen yìqǐ qù jīchǎng.',
          vi: 'Ăn sáng xong, bố lái xe, cả nhà cùng ra sân bay.',
        },
        {
          hanzi: '那天下雨，车很多，我们八点到了机场。',
          pinyin: 'Nà tiān xiàyǔ, chē hěn duō, wǒmen bā diǎn dào le jīchǎng.',
          vi: 'Hôm đó trời mưa, xe rất đông, tám giờ cả nhà tới sân bay.',
        },
        {
          hanzi: '妈妈对我说：“到了学校，记得给我们打电话。”',
          pinyin: 'Māma duì wǒ shuō: “Dào le xuéxiào, jìde gěi wǒmen dǎ diànhuà.”',
          vi: 'Mẹ dặn mình: “Đến trường rồi nhớ gọi điện cho bố mẹ nhé.”',
        },
        {
          hanzi: '我说：“好的，我记得。”',
          pinyin: 'Wǒ shuō: “Hǎo de, wǒ jìde.”',
          vi: 'Mình nói: “Vâng, con nhớ rồi.”',
        },
        {
          hanzi: '我进去以后，看见爸爸妈妈还在外面等我。',
          pinyin: 'Wǒ jìnqù yǐhòu, kànjiàn bàba māma hái zài wàimiàn děng wǒ.',
          vi: 'Mình vào bên trong rồi vẫn thấy bố mẹ còn đứng ngoài đợi mình.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '下午三点，我到了学校。',
          pinyin: 'Xiàwǔ sān diǎn, wǒ dào le xuéxiào.',
          vi: 'Ba giờ chiều, mình tới trường.',
        },
        {
          hanzi: '我的房间在教室旁边，不大，但是很漂亮。',
          pinyin: 'Wǒ de fángjiān zài jiàoshì pángbiān, bú dà, dànshì hěn piàoliang.',
          vi: 'Phòng của mình ở cạnh lớp học, không lớn nhưng rất đẹp.',
        },
        {
          hanzi: '同学们都回来了，大家见面都很高兴。',
          pinyin: 'Tóngxuémen dōu huílái le, dàjiā jiànmiàn dōu hěn gāoxìng.',
          vi: 'Các bạn cùng lớp đều đã về, gặp lại nhau ai cũng rất vui.',
        },
        {
          hanzi: '我马上给妈妈打电话，告诉她我已经到了。',
          pinyin: 'Wǒ mǎshàng gěi māma dǎ diànhuà, gàosu tā wǒ yǐjīng dào le.',
          vi: 'Mình gọi điện ngay cho mẹ, báo là mình đã tới nơi.',
        },
        {
          hanzi: '晚上，我和朋友去打篮球，我们以前也经常一起打。',
          pinyin: 'Wǎnshang, wǒ hé péngyou qù dǎ lánqiú, wǒmen yǐqián yě jīngcháng yìqǐ dǎ.',
          vi: 'Buổi tối, mình với bạn đi chơi bóng rổ, trước đây tụi mình cũng hay chơi cùng nhau.',
        },
        {
          hanzi: '明天就开学了，我希望今年每天都能好好学习。',
          pinyin: 'Míngtiān jiù kāixué le, wǒ xīwàng jīnnián měi tiān dōu néng hǎohǎo xuéxí.',
          vi: 'Ngày mai là khai giảng rồi, mình mong năm nay ngày nào cũng học thật chăm.',
        },
      ],
    },
  ],
  words: [
    { hanzi: '快要', pinyin: 'kuàiyào', vi: 'sắp; sắp sửa' },
    { hanzi: '开学', pinyin: 'kāixué', vi: 'khai giảng' },
    { hanzi: '高中', pinyin: 'gāozhōng', vi: 'trường cấp 3' },
    { hanzi: '回来', pinyin: 'huílái', vi: 'quay về' },
    { hanzi: '回去', pinyin: 'huíqù', vi: 'trở về' },
    { hanzi: '机票', pinyin: 'jīpiào', vi: 'vé máy bay' },
    { hanzi: '记得', pinyin: 'jìde', vi: 'nhớ' },
    { hanzi: '打开', pinyin: 'dǎkāi', vi: 'mở, bật' },
    { hanzi: '包', pinyin: 'bāo', vi: 'túi' },
    { hanzi: '裤子', pinyin: 'kùzi', vi: 'quần' },
    { hanzi: '黑色', pinyin: 'hēisè', vi: 'màu đen' },
    { hanzi: '跟', pinyin: 'gēn', vi: 'với, cùng với' },
    { hanzi: '还是', pinyin: 'háishi', vi: 'hay là; vẫn' },
    { hanzi: '红色', pinyin: 'hóngsè', vi: 'màu đỏ' },
    { hanzi: '白色', pinyin: 'báisè', vi: 'màu trắng' },
    { hanzi: '鱼', pinyin: 'yú', vi: 'cá' },
    { hanzi: '肉', pinyin: 'ròu', vi: 'thịt' },
    { hanzi: '晚饭', pinyin: 'wǎnfàn', vi: 'bữa tối' },
    { hanzi: '红茶', pinyin: 'hóngchá', vi: 'trà đen' },
    { hanzi: '起床', pinyin: 'qǐchuáng', vi: 'thức dậy' },
    { hanzi: '早饭', pinyin: 'zǎofàn', vi: 'bữa sáng' },
    { hanzi: '开车', pinyin: 'kāichē', vi: 'lái xe' },
    { hanzi: '机场', pinyin: 'jīchǎng', vi: 'sân bay' },
    { hanzi: '进去', pinyin: 'jìnqù', vi: 'đi vào' },
    { hanzi: '等', pinyin: 'děng', vi: 'đợi' },
    { hanzi: '房间', pinyin: 'fángjiān', vi: 'phòng' },
    { hanzi: '旁边', pinyin: 'pángbiān', vi: 'bên cạnh' },
    { hanzi: '见面', pinyin: 'jiànmiàn', vi: 'gặp mặt' },
    { hanzi: '马上', pinyin: 'mǎshàng', vi: 'ngay, lập tức' },
    { hanzi: '告诉', pinyin: 'gàosu', vi: 'nói cho, kể cho' },
    { hanzi: '经常', pinyin: 'jīngcháng', vi: 'thường xuyên' },
    { hanzi: '篮球', pinyin: 'lánqiú', vi: 'bóng rổ' },
    { hanzi: '希望', pinyin: 'xīwàng', vi: 'hy vọng, mong' },
  ],
};

export default passage;
