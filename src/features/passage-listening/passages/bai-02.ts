/**
 * Bài nghe đoạn văn 2: "Một năm ở Bắc Kinh" — bài dài, dùng ĐỦ mọi từ đã học.
 *
 * Soạn tay sao cho mỗi từ trong `LEARNED_WORDS` (lộ trình 300 từ và ba bài nghe cố định)
 * xuất hiện ít nhất một lần, đứng riêng chứ không chỉ nằm lọt trong một từ dài hơn; nhiều
 * từ lặp lại vài lần. `registry.test.ts` chặn bài này nếu sót dù một từ. Ngoài từ đã học
 * chỉ thêm vài tên riêng (阿明、安娜、小文、王、越南) và vài từ rất cơ bản đã gặp trong
 * các câu ghép (先、然后、附近、门、地方…). Câu ngắn, ngữ pháp HSK 1–2.
 */
import { LEARNED_WORDS } from '../learned-words.ts';
import type { Passage } from '../types.ts';

const passage: Passage = {
  title: '我在北京的一年',
  titlePinyin: 'Wǒ zài Běijīng de yì nián',
  titleVi: 'Một năm ở Bắc Kinh',
  level: 'HSK 1–2',
  pauseSeconds: 20,
  paragraphs: [
    {
      sentences: [
        {
          hanzi: '大家好！我叫阿明，今年十八岁，是越南人。',
          pinyin: 'Dàjiā hǎo! Wǒ jiào Āmíng, jīnnián shíbā suì, shì Yuènán rén.',
          vi: 'Chào mọi người! Mình tên là A Minh, năm nay mười tám tuổi, là người Việt Nam.',
        },
        {
          hanzi: '去年九月，我坐飞机来北京学习汉语。',
          pinyin: 'Qùnián jiǔ yuè, wǒ zuò fēijī lái Běijīng xuéxí Hànyǔ.',
          vi: 'Tháng chín năm ngoái, mình đi máy bay sang Bắc Kinh học tiếng Trung.',
        },
        {
          hanzi: '我的学校很大，也很漂亮。',
          pinyin: 'Wǒ de xuéxiào hěn dà, yě hěn piàoliang.',
          vi: 'Trường của mình rất rộng, cũng rất đẹp.',
        },
        {
          hanzi: '我住在学校里，我的房间不大，但是很好。',
          pinyin: 'Wǒ zhù zài xuéxiào lǐ, wǒ de fángjiān bú dà, dànshì hěn hǎo.',
          vi: 'Mình ở trong trường, phòng của mình không to nhưng rất ổn.',
        },
        {
          hanzi: '我的爱好是看书和游泳。',
          pinyin: 'Wǒ de àihào shì kàn shū hé yóuyǒng.',
          vi: 'Sở thích của mình là đọc sách và bơi.',
        },
        {
          hanzi: '我很喜欢这里，我觉得在北京学习真不错。',
          pinyin: 'Wǒ hěn xǐhuan zhèlǐ, wǒ juéde zài Běijīng xuéxí zhēn búcuò.',
          vi: 'Mình rất thích nơi này, mình thấy học ở Bắc Kinh thật sự rất tốt.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '我们学校有两千多个学生，一百多个老师。',
          pinyin: 'Wǒmen xuéxiào yǒu liǎngqiān duō ge xuésheng, yìbǎi duō ge lǎoshī.',
          vi: 'Trường mình có hơn hai nghìn học sinh, hơn một trăm giáo viên.',
        },
        {
          hanzi: '我们班有十二个学生，七个男学生，五个女学生。',
          pinyin: 'Wǒmen bān yǒu shí’èr ge xuésheng, qī ge nán xuésheng, wǔ ge nǚ xuésheng.',
          vi: 'Lớp mình có mười hai học sinh: bảy bạn nam, năm bạn nữ.',
        },
        {
          hanzi: '大家都是外国人，我们的老师是中国人。',
          pinyin: 'Dàjiā dōu shì wàiguó rén, wǒmen de lǎoshī shì Zhōngguó rén.',
          vi: 'Mọi người đều là người nước ngoài, giáo viên của bọn mình là người Trung Quốc.',
        },
        {
          hanzi: '老师姓王，我们都叫她王老师。',
          pinyin: 'Lǎoshī xìng Wáng, wǒmen dōu jiào tā Wáng lǎoshī.',
          vi: 'Cô giáo họ Vương, bọn mình đều gọi cô là cô Vương.',
        },
        {
          hanzi: '王老师个子很高，很爱笑，说话很慢。',
          pinyin: 'Wáng lǎoshī gèzi hěn gāo, hěn ài xiào, shuōhuà hěn màn.',
          vi: 'Cô Vương dáng người cao, rất hay cười, nói chuyện rất chậm.',
        },
        {
          hanzi: '她教我们读书、写字，也教我们听和说。',
          pinyin: 'Tā jiāo wǒmen dúshū, xiě zì, yě jiāo wǒmen tīng hé shuō.',
          vi: 'Cô dạy bọn mình đọc sách, viết chữ, cũng dạy bọn mình nghe và nói.',
        },
        {
          hanzi: '同学们都很喜欢她。',
          pinyin: 'Tóngxuémen dōu hěn xǐhuan tā.',
          vi: 'Các bạn trong lớp đều rất quý cô.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '第一天，王老师让我们介绍自己。',
          pinyin: 'Dì-yī tiān, Wáng lǎoshī ràng wǒmen jièshào zìjǐ.',
          vi: 'Ngày đầu tiên, cô Vương bảo bọn mình tự giới thiệu.',
        },
        {
          hanzi: '她先问我：“你叫什么名字？”',
          pinyin: 'Tā xiān wèn wǒ: “Nǐ jiào shénme míngzi?”',
          vi: 'Cô hỏi mình trước: “Em tên là gì?”',
        },
        {
          hanzi: '我说：“我叫阿明，我是越南人，很高兴认识大家。”',
          pinyin: 'Wǒ shuō: “Wǒ jiào Āmíng, wǒ shì Yuènán rén, hěn gāoxìng rènshi dàjiā.”',
          vi: 'Mình nói: “Em tên là A Minh, em là người Việt Nam, rất vui được làm quen với mọi người.”',
        },
        {
          hanzi: '我旁边的女同学问我：“你多大？”',
          pinyin: 'Wǒ pángbiān de nǚ tóngxué wèn wǒ: “Nǐ duōdà?”',
          vi: 'Bạn nữ ngồi cạnh hỏi mình: “Bạn bao nhiêu tuổi?”',
        },
        {
          hanzi: '我说：“我十八岁。你呢？”',
          pinyin: 'Wǒ shuō: “Wǒ shíbā suì. Nǐ ne?”',
          vi: 'Mình nói: “Mình mười tám tuổi. Còn bạn?”',
        },
        {
          hanzi: '她说：“我二十岁，我叫安娜。”',
          pinyin: 'Tā shuō: “Wǒ èrshí suì, wǒ jiào Ānnà.”',
          vi: 'Bạn ấy nói: “Mình hai mươi tuổi, mình tên là Anna.”',
        },
        {
          hanzi: '那天以后，我们就是好朋友了。',
          pinyin: 'Nà tiān yǐhòu, wǒmen jiù shì hǎo péngyou le.',
          vi: 'Từ hôm đó, bọn mình thành bạn thân.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '我每天早上六点起床。',
          pinyin: 'Wǒ měi tiān zǎoshang liù diǎn qǐchuáng.',
          vi: 'Sáng nào mình cũng dậy lúc sáu giờ.',
        },
        {
          hanzi: '起床以后，我先洗澡，然后吃早饭。',
          pinyin: 'Qǐchuáng yǐhòu, wǒ xiān xǐzǎo, ránhòu chī zǎofàn.',
          vi: 'Dậy xong, mình tắm trước, rồi ăn sáng.',
        },
        {
          hanzi: '早饭我常吃鸡蛋和面条，还喝一杯牛奶。',
          pinyin: 'Zǎofàn wǒ cháng chī jīdàn hé miàntiáo, hái hē yì bēi niúnǎi.',
          vi: 'Bữa sáng mình hay ăn trứng và mì, còn uống một cốc sữa.',
        },
        {
          hanzi: '有时候我也喝咖啡，因为咖啡能让我不想睡觉。',
          pinyin: 'Yǒushíhou wǒ yě hē kāfēi, yīnwèi kāfēi néng ràng wǒ bù xiǎng shuìjiào.',
          vi: 'Đôi khi mình cũng uống cà phê, vì cà phê làm mình không buồn ngủ.',
        },
        {
          hanzi: '安娜不喝咖啡，她爱喝茶。',
          pinyin: 'Ānnà bù hē kāfēi, tā ài hē chá.',
          vi: 'Anna không uống cà phê, bạn ấy thích uống trà.',
        },
        {
          hanzi: '上午八点，我们开始学习，中午十二点结束。',
          pinyin: 'Shàngwǔ bā diǎn, wǒmen kāishǐ xuéxí, zhōngwǔ shí’èr diǎn jiéshù.',
          vi: 'Tám giờ sáng bọn mình bắt đầu học, mười hai giờ trưa thì kết thúc.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '我们的教室不太大，但是很新。',
          pinyin: 'Wǒmen de jiàoshì bú tài dà, dànshì hěn xīn.',
          vi: 'Phòng học của bọn mình không to lắm nhưng rất mới.',
        },
        {
          hanzi: '教室前面是老师的桌子和椅子。',
          pinyin: 'Jiàoshì qiánmiàn shì lǎoshī de zhuōzi hé yǐzi.',
          vi: 'Phía trước lớp là bàn và ghế của cô giáo.',
        },
        {
          hanzi: '老师的桌子上面有一个电脑。',
          pinyin: 'Lǎoshī de zhuōzi shàngmiàn yǒu yí ge diànnǎo.',
          vi: 'Trên bàn cô giáo có một cái máy tính.',
        },
        {
          hanzi: '我的桌子在教室中间，左边是安娜，右边是一个男同学。',
          pinyin: 'Wǒ de zhuōzi zài jiàoshì zhōngjiān, zuǒbian shì Ānnà, yòubian shì yí ge nán tóngxué.',
          vi: 'Bàn của mình ở giữa lớp, bên trái là Anna, bên phải là một bạn nam.',
        },
        {
          hanzi: '我的包在桌子下面。',
          pinyin: 'Wǒ de bāo zài zhuōzi xiàmiàn.',
          vi: 'Cặp của mình để dưới gầm bàn.',
        },
        {
          hanzi: '教室后面有很多书，后边还有一间小房间，老师们在里面休息。',
          pinyin: 'Jiàoshì hòumiàn yǒu hěn duō shū, hòubian hái yǒu yì jiān xiǎo fángjiān, lǎoshīmen zài lǐmiàn xiūxi.',
          vi: 'Phía sau lớp có rất nhiều sách, đằng sau nữa còn có một căn phòng nhỏ, các thầy cô nghỉ ở trong đó.',
        },
        {
          hanzi: '教室外边有很多花，红的、白的都有，很好看。',
          pinyin: 'Jiàoshì wàibian yǒu hěn duō huā, hóng de, bái de dōu yǒu, hěn hǎokàn.',
          vi: 'Bên ngoài lớp có rất nhiều hoa, đỏ có, trắng có, rất đẹp.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '中午，我和安娜想去外面吃饭，但是我们不知道饭馆在哪儿。',
          pinyin: 'Zhōngwǔ, wǒ hé Ānnà xiǎng qù wàimiàn chīfàn, dànshì wǒmen bù zhīdào fànguǎn zài nǎr.',
          vi: 'Buổi trưa, mình và Anna muốn ra ngoài ăn, nhưng không biết quán ăn ở đâu.',
        },
        {
          hanzi: '安娜问一个学生：“请问，学校附近有好吃的饭馆吗？”',
          pinyin: 'Ānnà wèn yí ge xuésheng: “Qǐngwèn, xuéxiào fùjìn yǒu hǎochī de fànguǎn ma?”',
          vi: 'Anna hỏi một bạn học sinh: “Cho hỏi, gần trường có quán nào ăn ngon không?”',
        },
        {
          hanzi: '他说：“有，学校前边就有一个，很近，走五分钟就到了。”',
          pinyin: 'Tā shuō: “Yǒu, xuéxiào qiánbian jiù yǒu yí ge, hěn jìn, zǒu wǔ fēnzhōng jiù dào le.”',
          vi: 'Bạn ấy nói: “Có, ngay phía trước trường có một quán, rất gần, đi bộ năm phút là tới.”',
        },
        {
          hanzi: '安娜又问：“怎么走？”',
          pinyin: 'Ānnà yòu wèn: “Zěnme zǒu?”',
          vi: 'Anna lại hỏi: “Đi thế nào?”',
        },
        {
          hanzi: '他说：“我也去那里吃饭，我们一起走吧。”',
          pinyin: 'Tā shuō: “Wǒ yě qù nàlǐ chīfàn, wǒmen yìqǐ zǒu ba.”',
          vi: 'Bạn ấy nói: “Mình cũng đến đó ăn, bọn mình cùng đi nhé.”',
        },
        {
          hanzi: '我们高兴地说：“谢谢你！”',
          pinyin: 'Wǒmen gāoxìng de shuō: “Xièxie nǐ!”',
          vi: 'Bọn mình vui vẻ nói: “Cảm ơn bạn!”',
        },
        {
          hanzi: '他说：“不客气。”',
          pinyin: 'Tā shuō: “Bú kèqi.”',
          vi: 'Bạn ấy nói: “Không có gì.”',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '到了饭馆，我们看见王老师也在里面。',
          pinyin: 'Dào le fànguǎn, wǒmen kànjiàn Wáng lǎoshī yě zài lǐmiàn.',
          vi: 'Đến quán, bọn mình thấy cô Vương cũng đang ở trong.',
        },
        {
          hanzi: '王老师说：“你们也来这里吃饭？”',
          pinyin: 'Wáng lǎoshī shuō: “Nǐmen yě lái zhèlǐ chīfàn?”',
          vi: 'Cô Vương nói: “Các em cũng đến đây ăn à?”',
        },
        {
          hanzi: '饭馆里人很多，我们等了十分钟。',
          pinyin: 'Fànguǎn lǐ rén hěn duō, wǒmen děng le shí fēnzhōng.',
          vi: 'Trong quán rất đông người, bọn mình đợi mười phút.',
        },
        {
          hanzi: '我们要了米饭、鱼、肉，还有两个菜。',
          pinyin: 'Wǒmen yào le mǐfàn, yú, ròu, hái yǒu liǎng ge cài.',
          vi: 'Bọn mình gọi cơm, cá, thịt, thêm hai món rau.',
        },
        {
          hanzi: '安娜说她想喝水，王老师给她要了一杯水。',
          pinyin: 'Ānnà shuō tā xiǎng hē shuǐ, Wáng lǎoshī gěi tā yào le yì bēi shuǐ.',
          vi: 'Anna nói muốn uống nước, cô Vương gọi cho bạn ấy một cốc nước.',
        },
        {
          hanzi: '吃饭的时候，安娜说：“中国菜真好吃！”',
          pinyin: 'Chīfàn de shíhou, Ānnà shuō: “Zhōngguó cài zhēn hǎochī!”',
          vi: 'Lúc ăn, Anna nói: “Món Trung Quốc ngon thật!”',
        },
        {
          hanzi: '王老师问她：“你觉得哪个菜最好吃？”',
          pinyin: 'Wáng lǎoshī wèn tā: “Nǐ juéde nǎge cài zuì hǎochī?”',
          vi: 'Cô Vương hỏi: “Em thấy món nào ngon nhất?”',
        },
        {
          hanzi: '安娜说：“我最喜欢这个鱼。”',
          pinyin: 'Ānnà shuō: “Wǒ zuì xǐhuan zhège yú.”',
          vi: 'Anna nói: “Em thích món cá này nhất.”',
        },
        {
          hanzi: '吃饭以后，王老师说：“今天我给钱。”',
          pinyin: 'Chīfàn yǐhòu, Wáng lǎoshī shuō: “Jīntiān wǒ gěi qián.”',
          vi: 'Ăn xong, cô Vương nói: “Hôm nay cô trả tiền.”',
        },
        {
          hanzi: '我们都说：“谢谢老师！”',
          pinyin: 'Wǒmen dōu shuō: “Xièxie lǎoshī!”',
          vi: 'Cả bọn đều nói: “Cảm ơn cô ạ!”',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '下午我常在房间里看书，有时候去找朋友玩。',
          pinyin: 'Xiàwǔ wǒ cháng zài fángjiān lǐ kàn shū, yǒushíhou qù zhǎo péngyou wán.',
          vi: 'Buổi chiều mình hay ở trong phòng đọc sách, đôi khi đi tìm bạn chơi.',
        },
        {
          hanzi: '四点以后，我和同学们一起去运动。',
          pinyin: 'Sì diǎn yǐhòu, wǒ hé tóngxuémen yìqǐ qù yùndòng.',
          vi: 'Sau bốn giờ, mình cùng các bạn đi tập thể thao.',
        },
        {
          hanzi: '我们有时候打篮球，有时候踢足球，有时候去游泳。',
          pinyin: 'Wǒmen yǒushíhou dǎ lánqiú, yǒushíhou tī zúqiú, yǒushíhou qù yóuyǒng.',
          vi: 'Bọn mình lúc thì chơi bóng rổ, lúc thì đá bóng, lúc thì đi bơi.',
        },
        {
          hanzi: '我觉得运动对身体很好。',
          pinyin: 'Wǒ juéde yùndòng duì shēntǐ hěn hǎo.',
          vi: 'Mình thấy vận động rất tốt cho sức khỏe.',
        },
        {
          hanzi: '晚上我先吃晚饭，然后学习两个小时。',
          pinyin: 'Wǎnshang wǒ xiān chī wǎnfàn, ránhòu xuéxí liǎng ge xiǎoshí.',
          vi: 'Buổi tối mình ăn tối trước, rồi học hai tiếng.',
        },
        {
          hanzi: '我打开电脑写汉字，也读汉语书。',
          pinyin: 'Wǒ dǎkāi diànnǎo xiě Hànzì, yě dú Hànyǔ shū.',
          vi: 'Mình mở máy tính viết chữ Hán, cũng đọc sách tiếng Trung.',
        },
        {
          hanzi: '十一点，我就上床睡觉了。',
          pinyin: 'Shíyī diǎn, wǒ jiù shàng chuáng shuìjiào le.',
          vi: 'Mười một giờ là mình lên giường đi ngủ.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '在北京，我认识了一个中国朋友，他叫小文。',
          pinyin: 'Zài Běijīng, wǒ rènshi le yí ge Zhōngguó péngyou, tā jiào Xiǎowén.',
          vi: 'Ở Bắc Kinh, mình quen một người bạn Trung Quốc tên là Tiểu Văn.',
        },
        {
          hanzi: '小文是高中学生，他家就在我们学校旁边。',
          pinyin: 'Xiǎowén shì gāozhōng xuésheng, tā jiā jiù zài wǒmen xuéxiào pángbiān.',
          vi: 'Tiểu Văn là học sinh cấp ba, nhà cậu ấy ở ngay cạnh trường mình.',
        },
        {
          hanzi: '我们每个星期天都见面，他帮助我学习汉语。',
          pinyin: 'Wǒmen měi ge xīngqītiān dōu jiànmiàn, tā bāngzhù wǒ xuéxí Hànyǔ.',
          vi: 'Chủ nhật nào bọn mình cũng gặp nhau, cậu ấy giúp mình học tiếng Trung.',
        },
        {
          hanzi: '小文说话很快，所以我常说：“对不起，请你慢慢说。”',
          pinyin: 'Xiǎowén shuōhuà hěn kuài, suǒyǐ wǒ cháng shuō: “Duìbuqǐ, qǐng nǐ mànmàn shuō.”',
          vi: 'Tiểu Văn nói nhanh lắm, nên mình hay nói: “Xin lỗi, cậu nói chậm thôi.”',
        },
        {
          hanzi: '小文笑了，说：“没关系！”',
          pinyin: 'Xiǎowén xiào le, shuō: “Méi guānxi!”',
          vi: 'Tiểu Văn cười, nói: “Không sao!”',
        },
        {
          hanzi: '有一天，我在学校外面看见小文。',
          pinyin: 'Yǒu yì tiān, wǒ zài xuéxiào wàimiàn kànjiàn Xiǎowén.',
          vi: 'Có một hôm, mình thấy Tiểu Văn ở ngoài trường.',
        },
        {
          hanzi: '我问他：“小文，你去哪儿？”',
          pinyin: 'Wǒ wèn tā: “Xiǎowén, nǐ qù nǎr?”',
          vi: 'Mình hỏi: “Tiểu Văn, cậu đi đâu đấy?”',
        },
        {
          hanzi: '他说：“我去商店买东西。你也想去，对吗？”',
          pinyin: 'Tā shuō: “Wǒ qù shāngdiàn mǎi dōngxi. Nǐ yě xiǎng qù, duì ma?”',
          vi: 'Cậu ấy nói: “Mình đi cửa hàng mua đồ. Cậu cũng muốn đi, đúng không?”',
        },
        {
          hanzi: '我说：“对，我们一起去吧！”',
          pinyin: 'Wǒ shuō: “Duì, wǒmen yìqǐ qù ba!”',
          vi: 'Mình nói: “Đúng rồi, bọn mình cùng đi nhé!”',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '今天是星期五，天气很好。',
          pinyin: 'Jīntiān shì xīngqīwǔ, tiānqì hěn hǎo.',
          vi: 'Hôm nay là thứ sáu, thời tiết rất đẹp.',
        },
        {
          hanzi: '昨天下雨了，我没出去，在房间里开了电视，看了一下午。',
          pinyin: 'Zuótiān xiàyǔ le, wǒ méi chūqu, zài fángjiān lǐ kāi le diànshì, kàn le yí xiàwǔ.',
          vi: 'Hôm qua trời mưa, mình không ra ngoài, ở trong phòng bật tivi xem cả buổi chiều.',
        },
        {
          hanzi: '明天是星期六，小文说他要来找我玩。',
          pinyin: 'Míngtiān shì xīngqīliù, Xiǎowén shuō tā yào lái zhǎo wǒ wán.',
          vi: 'Ngày mai là thứ bảy, Tiểu Văn nói sẽ đến tìm mình chơi.',
        },
        {
          hanzi: '我想跟他一起去看他哥哥打篮球。',
          pinyin: 'Wǒ xiǎng gēn tā yìqǐ qù kàn tā gēge dǎ lánqiú.',
          vi: 'Mình muốn cùng cậu ấy đi xem anh trai cậu ấy chơi bóng rổ.',
        },
        {
          hanzi: '小文说，他哥哥最喜欢打篮球。',
          pinyin: 'Xiǎowén shuō, tā gēge zuì xǐhuan dǎ lánqiú.',
          vi: 'Tiểu Văn nói anh trai cậu ấy thích chơi bóng rổ nhất.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '十月一号，小文请我去他家吃饭。',
          pinyin: 'Shí yuè yī hào, Xiǎowén qǐng wǒ qù tā jiā chīfàn.',
          vi: 'Ngày mùng một tháng mười, Tiểu Văn mời mình đến nhà ăn cơm.',
        },
        {
          hanzi: '他家有六个人：爸爸、妈妈、哥哥、姐姐、妹妹和他。',
          pinyin: 'Tā jiā yǒu liù ge rén: bàba, māma, gēge, jiějie, mèimei hé tā.',
          vi: 'Nhà cậu ấy có sáu người: bố, mẹ, anh trai, chị gái, em gái và cậu ấy.',
        },
        {
          hanzi: '小文是他爸爸妈妈的第二个儿子。',
          pinyin: 'Xiǎowén shì tā bàba māma de dì-èr ge érzi.',
          vi: 'Tiểu Văn là con trai thứ hai của bố mẹ cậu ấy.',
        },
        {
          hanzi: '他爸爸是医生，在医院工作；他妈妈是老师，在一个高中教书。',
          pinyin: 'Tā bàba shì yīshēng, zài yīyuàn gōngzuò; tā māma shì lǎoshī, zài yí ge gāozhōng jiāo shū.',
          vi: 'Bố cậu ấy là bác sĩ, làm ở bệnh viện; mẹ cậu ấy là giáo viên, dạy ở một trường cấp ba.',
        },
        {
          hanzi: '他哥哥已经工作了，每天开车去工作。',
          pinyin: 'Tā gēge yǐjīng gōngzuò le, měi tiān kāichē qù gōngzuò.',
          vi: 'Anh trai cậu ấy đi làm rồi, ngày nào cũng lái xe đi làm.',
        },
        {
          hanzi: '他姐姐很漂亮，他妹妹今年九岁，很爱说话。',
          pinyin: 'Tā jiějie hěn piàoliang, tā mèimei jīnnián jiǔ suì, hěn ài shuōhuà.',
          vi: 'Chị gái cậu ấy rất xinh, em gái năm nay chín tuổi, rất thích nói chuyện.',
        },
        {
          hanzi: '他们家还有猫和狗：猫是白的，狗是黑的。',
          pinyin: 'Tāmen jiā hái yǒu māo hé gǒu: māo shì bái de, gǒu shì hēi de.',
          vi: 'Nhà họ còn có mèo và chó: con mèo màu trắng, con chó màu đen.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '我一进门，小文的妈妈就说：“欢迎！欢迎！请进来坐。”',
          pinyin: 'Wǒ yí jìn mén, Xiǎowén de māma jiù shuō: “Huānyíng! Huānyíng! Qǐng jìnlái zuò.”',
          vi: 'Mình vừa vào cửa, mẹ Tiểu Văn đã nói: “Chào mừng cháu! Mời cháu vào ngồi.”',
        },
        {
          hanzi: '桌子上有很多水果，她给我一杯红茶，还给我一个大苹果。',
          pinyin: 'Zhuōzi shàng yǒu hěn duō shuǐguǒ, tā gěi wǒ yì bēi hóngchá, hái gěi wǒ yí ge dà píngguǒ.',
          vi: 'Trên bàn có rất nhiều hoa quả, cô đưa mình một cốc trà đen, còn cho mình một quả táo to.',
        },
        {
          hanzi: '小文的爸爸问我：“你在北京怎么样？”',
          pinyin: 'Xiǎowén de bàba wèn wǒ: “Nǐ zài Běijīng zěnmeyàng?”',
          vi: 'Bố Tiểu Văn hỏi mình: “Cháu ở Bắc Kinh thế nào?”',
        },
        {
          hanzi: '我说：“很好，谢谢！北京人都对我很好。”',
          pinyin: 'Wǒ shuō: “Hěn hǎo, xièxie! Běijīng rén dōu duì wǒ hěn hǎo.”',
          vi: 'Mình nói: “Rất tốt ạ, cảm ơn chú! Người Bắc Kinh ai cũng tốt với cháu.”',
        },
        {
          hanzi: '吃饭的时候，菜太多了，我吃了很多。',
          pinyin: 'Chīfàn de shíhou, cài tài duō le, wǒ chī le hěn duō.',
          vi: 'Lúc ăn cơm, đồ ăn nhiều quá, mình ăn rất nhiều.',
        },
        {
          hanzi: '他们家的猫在椅子下面睡觉，一动也不动。',
          pinyin: 'Tāmen jiā de māo zài yǐzi xiàmiàn shuìjiào, yí dòng yě bú dòng.',
          vi: 'Con mèo nhà họ ngủ dưới gầm ghế, không nhúc nhích tí nào.',
        },
        {
          hanzi: '他们家的狗过来了，在我旁边，也想吃肉。',
          pinyin: 'Tāmen jiā de gǒu guòlái le, zài wǒ pángbiān, yě xiǎng chī ròu.',
          vi: 'Con chó nhà họ chạy lại, đứng cạnh mình, cũng muốn ăn thịt.',
        },
        {
          hanzi: '晚上九点，我说：“谢谢你们！再见！”',
          pinyin: 'Wǎnshang jiǔ diǎn, wǒ shuō: “Xièxie nǐmen! Zàijiàn!”',
          vi: 'Chín giờ tối, mình nói: “Cháu cảm ơn cả nhà! Tạm biệt ạ!”',
        },
        {
          hanzi: '回到学校的时候，已经十点了。',
          pinyin: 'Huídào xuéxiào de shíhou, yǐjīng shí diǎn le.',
          vi: 'Lúc về đến trường thì đã mười giờ.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '北京的天气很有意思。',
          pinyin: 'Běijīng de tiānqì hěn yǒu yìsi.',
          vi: 'Thời tiết Bắc Kinh rất thú vị.',
        },
        {
          hanzi: '九月和十月天气最好，常常是晴天。',
          pinyin: 'Jiǔ yuè hé shí yuè tiānqì zuì hǎo, chángcháng shì qíngtiān.',
          vi: 'Tháng chín và tháng mười thời tiết đẹp nhất, thường là trời nắng.',
        },
        {
          hanzi: '十一月开始冷了，有时候是阴天。',
          pinyin: 'Shíyī yuè kāishǐ lěng le, yǒushíhou shì yīntiān.',
          vi: 'Tháng mười một bắt đầu lạnh, đôi khi trời âm u.',
        },
        {
          hanzi: '十二月，北京下雪了。',
          pinyin: 'Shí’èr yuè, Běijīng xià xuě le.',
          vi: 'Tháng mười hai, Bắc Kinh có tuyết rơi.',
        },
        {
          hanzi: '越南没有雪，所以那天我真高兴。',
          pinyin: 'Yuènán méiyǒu xuě, suǒyǐ nà tiān wǒ zhēn gāoxìng.',
          vi: 'Việt Nam không có tuyết, nên hôm đó mình vui lắm.',
        },
        {
          hanzi: '我穿了很多衣服，但还是觉得很冷。',
          pinyin: 'Wǒ chuān le hěn duō yīfu, dàn háishi juéde hěn lěng.',
          vi: 'Mình mặc rất nhiều quần áo mà vẫn thấy rất lạnh.',
        },
        {
          hanzi: '小文说，北京的七月和八月很热，也常下雨。',
          pinyin: 'Xiǎowén shuō, Běijīng de qī yuè hé bā yuè hěn rè, yě cháng xiàyǔ.',
          vi: 'Tiểu Văn nói tháng bảy và tháng tám ở Bắc Kinh rất nóng, cũng hay mưa.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '一月的一天，天气太冷了，我生病了。',
          pinyin: 'Yī yuè de yì tiān, tiānqì tài lěng le, wǒ shēngbìng le.',
          vi: 'Một ngày tháng một, trời lạnh quá, mình bị ốm.',
        },
        {
          hanzi: '我的头很热，眼睛也很红。',
          pinyin: 'Wǒ de tóu hěn rè, yǎnjing yě hěn hóng.',
          vi: 'Đầu mình nóng ran, mắt cũng đỏ hoe.',
        },
        {
          hanzi: '我不想吃饭，也不想起床，就在床上睡觉。',
          pinyin: 'Wǒ bù xiǎng chīfàn, yě bù xiǎng qǐchuáng, jiù zài chuáng shàng shuìjiào.',
          vi: 'Mình không muốn ăn, cũng không muốn dậy, cứ nằm ngủ trên giường.',
        },
        {
          hanzi: '安娜给我打电话的时候，我正在睡觉。',
          pinyin: 'Ānnà gěi wǒ dǎ diànhuà de shíhou, wǒ zhèngzài shuìjiào.',
          vi: 'Lúc Anna gọi điện cho mình, mình đang ngủ.',
        },
        {
          hanzi: '她知道我生病了，马上来我的房间看我。',
          pinyin: 'Tā zhīdào wǒ shēngbìng le, mǎshàng lái wǒ de fángjiān kàn wǒ.',
          vi: 'Biết mình bị ốm, bạn ấy lập tức đến phòng thăm mình.',
        },
        {
          hanzi: '她问：“你身体怎么样？我们去医院吧！”',
          pinyin: 'Tā wèn: “Nǐ shēntǐ zěnmeyàng? Wǒmen qù yīyuàn ba!”',
          vi: 'Bạn ấy hỏi: “Cậu thấy trong người thế nào? Bọn mình đi bệnh viện đi!”',
        },
        {
          hanzi: '我们坐出租车去了医院。',
          pinyin: 'Wǒmen zuò chūzūchē qù le yīyuàn.',
          vi: 'Bọn mình đi taxi đến bệnh viện.',
        },
        {
          hanzi: '医生看了看我的眼睛和耳朵，说：“问题不大，你需要吃药，也要多休息。”',
          pinyin: 'Yīshēng kàn le kàn wǒ de yǎnjing hé ěrduo, shuō: “Wèntí bú dà, nǐ xūyào chī yào, yě yào duō xiūxi.”',
          vi: 'Bác sĩ khám mắt và tai cho mình, rồi nói: “Không có gì nghiêm trọng, cháu cần uống thuốc, và phải nghỉ ngơi nhiều.”',
        },
        {
          hanzi: '回到房间以后，安娜给我做了面条。',
          pinyin: 'Huídào fángjiān yǐhòu, Ānnà gěi wǒ zuò le miàntiáo.',
          vi: 'Về đến phòng, Anna nấu mì cho mình.',
        },
        {
          hanzi: '三天以后，我的身体就好了。',
          pinyin: 'Sān tiān yǐhòu, wǒ de shēntǐ jiù hǎo le.',
          vi: 'Ba ngày sau, mình đã khỏe lại.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '二月十四号是我的生日。',
          pinyin: 'Èr yuè shísì hào shì wǒ de shēngrì.',
          vi: 'Ngày mười bốn tháng hai là sinh nhật mình.',
        },
        {
          hanzi: '那天早上，我很想家，因为爸爸妈妈和姐姐都在越南。',
          pinyin: 'Nà tiān zǎoshang, wǒ hěn xiǎng jiā, yīnwèi bàba māma hé jiějie dōu zài Yuènán.',
          vi: 'Sáng hôm đó, mình rất nhớ nhà, vì bố mẹ và chị gái đều ở Việt Nam.',
        },
        {
          hanzi: '我给妈妈打电话，一听到妈妈说话，我就哭了。',
          pinyin: 'Wǒ gěi māma dǎ diànhuà, yì tīngdào māma shuōhuà, wǒ jiù kū le.',
          vi: 'Mình gọi điện cho mẹ, vừa nghe thấy mẹ nói là mình khóc.',
        },
        {
          hanzi: '妈妈说：“不要哭，你已经是大人了。”',
          pinyin: 'Māma shuō: “Bú yào kū, nǐ yǐjīng shì dàrén le.”',
          vi: 'Mẹ nói: “Đừng khóc, con lớn rồi mà.”',
        },
        {
          hanzi: '我很想家，但同学们都对我很好。',
          pinyin: 'Wǒ hěn xiǎng jiā, dàn tóngxuémen dōu duì wǒ hěn hǎo.',
          vi: 'Mình rất nhớ nhà, nhưng các bạn đều đối xử với mình rất tốt.',
        },
        {
          hanzi: '晚上，大家来我的房间，给了我很多礼物。',
          pinyin: 'Wǎnshang, dàjiā lái wǒ de fángjiān, gěi le wǒ hěn duō lǐwù.',
          vi: 'Buổi tối, mọi người đến phòng mình, tặng mình rất nhiều quà.',
        },
        {
          hanzi: '安娜给了我一本书，小文给了我一件新衣服，颜色是我最喜欢的红色。',
          pinyin: 'Ānnà gěi le wǒ yì běn shū, Xiǎowén gěi le wǒ yí jiàn xīn yīfu, yánsè shì wǒ zuì xǐhuan de hóngsè.',
          vi: 'Anna tặng mình một quyển sách, Tiểu Văn tặng mình một cái áo mới, màu đỏ mà mình thích nhất.',
        },
        {
          hanzi: '王老师也来了，还给我买了花。',
          pinyin: 'Wáng lǎoshī yě lái le, hái gěi wǒ mǎi le huā.',
          vi: 'Cô Vương cũng đến, còn mua hoa tặng mình.',
        },
        {
          hanzi: '我们一起吃东西、说话、笑，这是我最高兴的一个生日。',
          pinyin: 'Wǒmen yìqǐ chī dōngxi, shuōhuà, xiào, zhè shì wǒ zuì gāoxìng de yí ge shēngrì.',
          vi: 'Bọn mình cùng ăn uống, trò chuyện, cười đùa, đây là sinh nhật vui nhất của mình.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '三月，我们快要考汉语了。',
          pinyin: 'Sān yuè, wǒmen kuàiyào kǎo Hànyǔ le.',
          vi: 'Tháng ba, bọn mình sắp thi tiếng Trung.',
        },
        {
          hanzi: '每天晚上，我都在房间里学习新词。',
          pinyin: 'Měi tiān wǎnshang, wǒ dōu zài fángjiān lǐ xuéxí xīn cí.',
          vi: 'Tối nào mình cũng ở trong phòng học từ mới.',
        },
        {
          hanzi: '有很多词，我不记得是什么意思。',
          pinyin: 'Yǒu hěn duō cí, wǒ bú jìde shì shénme yìsi.',
          vi: 'Có nhiều từ mình không nhớ nghĩa là gì.',
        },
        {
          hanzi: '我就去问王老师，我的问题，王老师都会回答。',
          pinyin: 'Wǒ jiù qù wèn Wáng lǎoshī, wǒ de wèntí, Wáng lǎoshī dōu huì huídá.',
          vi: 'Mình liền đi hỏi cô Vương, câu hỏi nào của mình cô cũng trả lời.',
        },
        {
          hanzi: '她说：“学习汉语，要多听、多说、多读、多写。”',
          pinyin: 'Tā shuō: “Xuéxí Hànyǔ, yào duō tīng, duō shuō, duō dú, duō xiě.”',
          vi: 'Cô nói: “Học tiếng Trung thì phải nghe nhiều, nói nhiều, đọc nhiều, viết nhiều.”',
        },
        {
          hanzi: '考试的时候，我一个字一个字地写。',
          pinyin: 'Kǎoshì de shíhou, wǒ yí ge zì yí ge zì de xiě.',
          vi: 'Lúc thi, mình viết từng chữ một.',
        },
        {
          hanzi: '一个星期以后，老师告诉我：“你在我们班是第一！”',
          pinyin: 'Yí ge xīngqī yǐhòu, lǎoshī gàosu wǒ: “Nǐ zài wǒmen bān shì dì-yī!”',
          vi: 'Một tuần sau, cô bảo mình: “Em đứng nhất lớp đấy!”',
        },
        {
          hanzi: '我高兴地给爸爸打电话。',
          pinyin: 'Wǒ gāoxìng de gěi bàba dǎ diànhuà.',
          vi: 'Mình vui vẻ gọi điện cho bố.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '四月的一个星期六，我和安娜去商店买东西。',
          pinyin: 'Sì yuè de yí ge xīngqīliù, wǒ hé Ānnà qù shāngdiàn mǎi dōngxi.',
          vi: 'Một thứ bảy tháng tư, mình và Anna đi cửa hàng mua đồ.',
        },
        {
          hanzi: '商店很大，里面的东西很多。',
          pinyin: 'Shāngdiàn hěn dà, lǐmiàn de dōngxi hěn duō.',
          vi: 'Cửa hàng rất rộng, bên trong có rất nhiều đồ.',
        },
        {
          hanzi: '我想买一条裤子，安娜想买一件白色的衣服。',
          pinyin: 'Wǒ xiǎng mǎi yì tiáo kùzi, Ānnà xiǎng mǎi yí jiàn báisè de yīfu.',
          vi: 'Mình muốn mua một cái quần, Anna muốn mua một cái áo màu trắng.',
        },
        {
          hanzi: '我看见一条黑色的裤子，很好看，但是太贵了。',
          pinyin: 'Wǒ kànjiàn yì tiáo hēisè de kùzi, hěn hǎokàn, dànshì tài guì le.',
          vi: 'Mình thấy một cái quần màu đen, rất đẹp, nhưng đắt quá.',
        },
        {
          hanzi: '我问：“这条裤子多少钱？”',
          pinyin: 'Wǒ wèn: “Zhè tiáo kùzi duōshao qián?”',
          vi: 'Mình hỏi: “Cái quần này bao nhiêu tiền?”',
        },
        {
          hanzi: '商店里的人说：“三百八十。”',
          pinyin: 'Shāngdiàn lǐ de rén shuō: “Sānbǎi bāshí.”',
          vi: 'Người bán hàng nói: “Ba trăm tám mươi.”',
        },
        {
          hanzi: '我觉得太贵了，所以没买。',
          pinyin: 'Wǒ juéde tài guì le, suǒyǐ méi mǎi.',
          vi: 'Mình thấy đắt quá nên không mua.',
        },
        {
          hanzi: '我们又看了很多东西，最后安娜买了白色的衣服，我买了一个新包。',
          pinyin: 'Wǒmen yòu kàn le hěn duō dōngxi, zuìhòu Ānnà mǎi le báisè de yīfu, wǒ mǎi le yí ge xīn bāo.',
          vi: 'Bọn mình xem thêm nhiều thứ nữa, cuối cùng Anna mua cái áo trắng, còn mình mua một cái cặp mới.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '四月十号，安娜的朋友要来北京，我们去火车站见她。',
          pinyin: 'Sì yuè shí hào, Ānnà de péngyou yào lái Běijīng, wǒmen qù huǒchēzhàn jiàn tā.',
          vi: 'Ngày mười tháng tư, bạn của Anna đến Bắc Kinh, bọn mình ra ga tàu gặp cô ấy.',
        },
        {
          hanzi: '我们先坐公交车，但是公交车太慢了。',
          pinyin: 'Wǒmen xiān zuò gōngjiāochē, dànshì gōngjiāochē tài màn le.',
          vi: 'Lúc đầu bọn mình đi xe buýt, nhưng xe buýt chậm quá.',
        },
        {
          hanzi: '因为时间不多了，我们就下车打车。',
          pinyin: 'Yīnwèi shíjiān bù duō le, wǒmen jiù xià chē dǎchē.',
          vi: 'Vì không còn nhiều thời gian, bọn mình xuống xe bắt taxi.',
        },
        {
          hanzi: '出租车很快，二十分钟就到了。',
          pinyin: 'Chūzūchē hěn kuài, èrshí fēnzhōng jiù dào le.',
          vi: 'Taxi chạy rất nhanh, hai mươi phút là tới.',
        },
        {
          hanzi: '火车站里人很多，我们找了很长时间。',
          pinyin: 'Huǒchēzhàn lǐ rén hěn duō, wǒmen zhǎo le hěn cháng shíjiān.',
          vi: 'Trong ga rất đông người, bọn mình tìm rất lâu.',
        },
        {
          hanzi: '最后，我们在火车站前边看见了她。',
          pinyin: 'Zuìhòu, wǒmen zài huǒchēzhàn qiánbian kànjiàn le tā.',
          vi: 'Cuối cùng, bọn mình thấy cô ấy ở phía trước nhà ga.',
        },
        {
          hanzi: '她说：“对不起！我的电话坏了，不能给你们打电话。”',
          pinyin: 'Tā shuō: “Duìbuqǐ! Wǒ de diànhuà huài le, bù néng gěi nǐmen dǎ diànhuà.”',
          vi: 'Cô ấy nói: “Xin lỗi nhé! Điện thoại của mình bị hỏng, không gọi cho các bạn được.”',
        },
        {
          hanzi: '安娜笑了：“没关系，我们找到你了！”',
          pinyin: 'Ānnà xiào le: “Méi guānxi, wǒmen zhǎodào nǐ le!”',
          vi: 'Anna cười: “Không sao, bọn mình tìm thấy cậu rồi!”',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '五月的一个周末，天气很好，我和小文出去玩。',
          pinyin: 'Wǔ yuè de yí ge zhōumò, tiānqì hěn hǎo, wǒ hé Xiǎowén chūqu wán.',
          vi: 'Một cuối tuần tháng năm, trời đẹp, mình và Tiểu Văn ra ngoài chơi.',
        },
        {
          hanzi: '我们去了一个很大的地方，那里有很多花，水里还有很多鱼。',
          pinyin: 'Wǒmen qù le yí ge hěn dà de dìfang, nàlǐ yǒu hěn duō huā, shuǐ lǐ hái yǒu hěn duō yú.',
          vi: 'Bọn mình đến một nơi rất rộng, ở đó có nhiều hoa, dưới nước còn có nhiều cá.',
        },
        {
          hanzi: '小文很会画画，他画了很多花。',
          pinyin: 'Xiǎowén hěn huì huà huà, tā huà le hěn duō huā.',
          vi: 'Tiểu Văn vẽ rất giỏi, cậu ấy vẽ rất nhiều hoa.',
        },
        {
          hanzi: '我不会画，就在旁边看他画。',
          pinyin: 'Wǒ bú huì huà, jiù zài pángbiān kàn tā huà.',
          vi: 'Mình không biết vẽ, nên ngồi bên cạnh xem cậu ấy vẽ.',
        },
        {
          hanzi: '中午，我们在外边吃了面条。',
          pinyin: 'Zhōngwǔ, wǒmen zài wàibian chī le miàntiáo.',
          vi: 'Buổi trưa, bọn mình ăn mì ở bên ngoài.',
        },
        {
          hanzi: '下午下雨了，我们马上回去了。',
          pinyin: 'Xiàwǔ xiàyǔ le, wǒmen mǎshàng huíqù le.',
          vi: 'Buổi chiều trời mưa, bọn mình về ngay.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '有一天，小文问了我很多问题。',
          pinyin: 'Yǒu yì tiān, Xiǎowén wèn le wǒ hěn duō wèntí.',
          vi: 'Có một hôm, Tiểu Văn hỏi mình rất nhiều câu.',
        },
        {
          hanzi: '他问：“你为什么来中国学习汉语？”',
          pinyin: 'Tā wèn: “Nǐ wèishénme lái Zhōngguó xuéxí Hànyǔ?”',
          vi: 'Cậu ấy hỏi: “Sao cậu sang Trung Quốc học tiếng Trung?”',
        },
        {
          hanzi: '我说：“因为我喜欢中国，以后我想在中国工作。”',
          pinyin: 'Wǒ shuō: “Yīnwèi wǒ xǐhuan Zhōngguó, yǐhòu wǒ xiǎng zài Zhōngguó gōngzuò.”',
          vi: 'Mình nói: “Vì mình thích Trung Quốc, sau này mình muốn làm việc ở Trung Quốc.”',
        },
        {
          hanzi: '他又问：“你家有几个人？”',
          pinyin: 'Tā yòu wèn: “Nǐ jiā yǒu jǐ ge rén?”',
          vi: 'Cậu ấy lại hỏi: “Nhà cậu có mấy người?”',
        },
        {
          hanzi: '我说：“四个人：爸爸、妈妈、姐姐和我。”',
          pinyin: 'Wǒ shuō: “Sì ge rén: bàba, māma, jiějie hé wǒ.”',
          vi: 'Mình nói: “Bốn người: bố, mẹ, chị gái và mình.”',
        },
        {
          hanzi: '他问：“你爸爸妈妈做什么工作？”',
          pinyin: 'Tā wèn: “Nǐ bàba māma zuò shénme gōngzuò?”',
          vi: 'Cậu ấy hỏi: “Bố mẹ cậu làm nghề gì?”',
        },
        {
          hanzi: '我说：“我爸爸开出租车，我妈妈在一个酒店工作。”',
          pinyin: 'Wǒ shuō: “Wǒ bàba kāi chūzūchē, wǒ māma zài yí ge jiǔdiàn gōngzuò.”',
          vi: 'Mình nói: “Bố mình lái taxi, mẹ mình làm ở một khách sạn.”',
        },
        {
          hanzi: '他问：“明年你还在北京吗？你想去哪里？”',
          pinyin: 'Tā wèn: “Míngnián nǐ hái zài Běijīng ma? Nǐ xiǎng qù nǎlǐ?”',
          vi: 'Cậu ấy hỏi: “Sang năm cậu còn ở Bắc Kinh không? Cậu muốn đi đâu?”',
        },
        {
          hanzi: '我说：“我还不知道。”',
          pinyin: 'Wǒ shuō: “Wǒ hái bù zhīdào.”',
          vi: 'Mình nói: “Mình vẫn chưa biết.”',
        },
        {
          hanzi: '最后他问：“你在北京最好的朋友是谁？”',
          pinyin: 'Zuìhòu tā wèn: “Nǐ zài Běijīng zuì hǎo de péngyou shì shéi?”',
          vi: 'Cuối cùng cậu ấy hỏi: “Bạn thân nhất của cậu ở Bắc Kinh là ai?”',
        },
        {
          hanzi: '我笑了：“是你啊！”',
          pinyin: 'Wǒ xiào le: “Shì nǐ a!”',
          vi: 'Mình cười: “Là cậu chứ ai!”',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '六月，我姐姐来北京看我。',
          pinyin: 'Liù yuè, wǒ jiějie lái Běijīng kàn wǒ.',
          vi: 'Tháng sáu, chị gái mình sang Bắc Kinh thăm mình.',
        },
        {
          hanzi: '她买了机票，六月八号坐飞机来。',
          pinyin: 'Tā mǎi le jīpiào, liù yuè bā hào zuò fēijī lái.',
          vi: 'Chị mua vé máy bay, bay sang vào ngày mùng tám tháng sáu.',
        },
        {
          hanzi: '那天上午，我很早就去机场等她。',
          pinyin: 'Nà tiān shàngwǔ, wǒ hěn zǎo jiù qù jīchǎng děng tā.',
          vi: 'Sáng hôm đó, mình ra sân bay đợi chị từ rất sớm.',
        },
        {
          hanzi: '我看见姐姐出来了，马上叫她：“姐姐！欢迎你来北京！”',
          pinyin: 'Wǒ kànjiàn jiějie chūlái le, mǎshàng jiào tā: “Jiějie! Huānyíng nǐ lái Běijīng!”',
          vi: 'Thấy chị đi ra, mình liền gọi: “Chị ơi! Chào mừng chị đến Bắc Kinh!”',
        },
        {
          hanzi: '姐姐说：“飞机飞了四个小时，我想休息。”',
          pinyin: 'Jiějie shuō: “Fēijī fēi le sì ge xiǎoshí, wǒ xiǎng xiūxi.”',
          vi: 'Chị nói: “Máy bay bay mất bốn tiếng, chị muốn nghỉ một chút.”',
        },
        {
          hanzi: '姐姐住在学校附近的一个酒店。',
          pinyin: 'Jiějie zhù zài xuéxiào fùjìn de yí ge jiǔdiàn.',
          vi: 'Chị ở một khách sạn gần trường.',
        },
        {
          hanzi: '晚上，我们去北京饭店吃饭。',
          pinyin: 'Wǎnshang, wǒmen qù Běijīng Fàndiàn chīfàn.',
          vi: 'Buổi tối, hai chị em đi ăn ở nhà hàng Bắc Kinh.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '姐姐在北京住了一周。',
          pinyin: 'Jiějie zài Běijīng zhù le yì zhōu.',
          vi: 'Chị ở Bắc Kinh một tuần.',
        },
        {
          hanzi: '我每天下午跟她一起出去玩。',
          pinyin: 'Wǒ měi tiān xiàwǔ gēn tā yìqǐ chūqu wán.',
          vi: 'Chiều nào mình cũng cùng chị ra ngoài chơi.',
        },
        {
          hanzi: '姐姐不会说汉语，买东西的时候，都是我帮忙。',
          pinyin: 'Jiějie bú huì shuō Hànyǔ, mǎi dōngxi de shíhou, dōu shì wǒ bāngmáng.',
          vi: 'Chị không biết nói tiếng Trung, lúc mua đồ đều là mình giúp.',
        },
        {
          hanzi: '有时候她进去买东西，我就在外面等她。',
          pinyin: 'Yǒushíhou tā jìnqù mǎi dōngxi, wǒ jiù zài wàimiàn děng tā.',
          vi: 'Đôi khi chị vào trong mua đồ, mình đứng ngoài đợi.',
        },
        {
          hanzi: '姐姐告诉我很多家里的事情，她说爸爸妈妈很想我。',
          pinyin: 'Jiějie gàosu wǒ hěn duō jiā lǐ de shìqing, tā shuō bàba māma hěn xiǎng wǒ.',
          vi: 'Chị kể cho mình nhiều chuyện ở nhà, chị nói bố mẹ rất nhớ mình.',
        },
        {
          hanzi: '姐姐回去的那天，我们都哭了。',
          pinyin: 'Jiějie huíqù de nà tiān, wǒmen dōu kū le.',
          vi: 'Hôm chị về, hai chị em đều khóc.',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '七月，我们的学习结束了。',
          pinyin: 'Qī yuè, wǒmen de xuéxí jiéshù le.',
          vi: 'Tháng bảy, khóa học của bọn mình kết thúc.',
        },
        {
          hanzi: '王老师说：“你们以前不会说汉语，现在都会说了，真好！”',
          pinyin: 'Wáng lǎoshī shuō: “Nǐmen yǐqián bú huì shuō Hànyǔ, xiànzài dōu huì shuō le, zhēn hǎo!”',
          vi: 'Cô Vương nói: “Trước đây các em không biết nói tiếng Trung, giờ ai cũng nói được rồi, giỏi quá!”',
        },
        {
          hanzi: '我们给王老师准备了礼物和花。',
          pinyin: 'Wǒmen gěi Wáng lǎoshī zhǔnbèi le lǐwù hé huā.',
          vi: 'Bọn mình chuẩn bị quà và hoa tặng cô Vương.',
        },
        {
          hanzi: '王老师很高兴，她希望我们以后常回来看她。',
          pinyin: 'Wáng lǎoshī hěn gāoxìng, tā xīwàng wǒmen yǐhòu cháng huílái kàn tā.',
          vi: 'Cô Vương rất vui, cô mong sau này bọn mình hay quay lại thăm cô.',
        },
        {
          hanzi: '我说：“老师，我明年还会来北京。”',
          pinyin: 'Wǒ shuō: “Lǎoshī, wǒ míngnián hái huì lái Běijīng.”',
          vi: 'Mình nói: “Cô ơi, sang năm em sẽ lại đến Bắc Kinh.”',
        },
      ],
    },
    {
      sentences: [
        {
          hanzi: '今年八月我要回国，九月又要开学了。',
          pinyin: 'Jīnnián bā yuè wǒ yào huí guó, jiǔ yuè yòu yào kāixué le.',
          vi: 'Tháng tám năm nay mình sẽ về nước, tháng chín lại khai giảng rồi.',
        },
        {
          hanzi: '快要走了，我真不想回去。',
          pinyin: 'Kuàiyào zǒu le, wǒ zhēn bù xiǎng huíqù.',
          vi: 'Sắp phải đi rồi, mình thật không muốn về.',
        },
        {
          hanzi: '在北京的这一年，我认识了很多新朋友，也学了很多汉字。',
          pinyin: 'Zài Běijīng de zhè yì nián, wǒ rènshi le hěn duō xīn péngyou, yě xué le hěn duō Hànzì.',
          vi: 'Một năm ở Bắc Kinh, mình quen nhiều bạn mới, cũng học được nhiều chữ Hán.',
        },
        {
          hanzi: '我经常想：去年这个时候，我一个汉字也不认识。',
          pinyin: 'Wǒ jīngcháng xiǎng: qùnián zhège shíhou, wǒ yí ge Hànzì yě bú rènshi.',
          vi: 'Mình hay nghĩ: giờ này năm ngoái, mình chẳng biết một chữ Hán nào.',
        },
        {
          hanzi: '现在，我已经可以用汉语跟大家说话了。',
          pinyin: 'Xiànzài, wǒ yǐjīng kěyǐ yòng Hànyǔ gēn dàjiā shuōhuà le.',
          vi: 'Bây giờ mình đã có thể dùng tiếng Trung nói chuyện với mọi người.',
        },
        {
          hanzi: '明年我还想来北京，因为这里有我的老师和朋友。',
          pinyin: 'Míngnián wǒ hái xiǎng lái Běijīng, yīnwèi zhèlǐ yǒu wǒ de lǎoshī hé péngyou.',
          vi: 'Sang năm mình vẫn muốn đến Bắc Kinh, vì ở đây có thầy cô và bạn bè của mình.',
        },
        {
          hanzi: '北京，再见！',
          pinyin: 'Běijīng, zàijiàn!',
          vi: 'Tạm biệt Bắc Kinh!',
        },
      ],
    },
  ],
  // Bài dùng đủ mọi từ đã học, nên danh sách ôn lại chính là toàn bộ vốn từ.
  words: LEARNED_WORDS,
};

export default passage;
