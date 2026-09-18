/**
 * Vốn từ riêng của người học và những câu ghép từ chính vốn từ đó.
 *
 * Đây KHÔNG phải bộ dữ liệu HSK trong `public/data/`. Bộ kia là danh sách chuẩn
 * 3.245 từ, chia buổi sẵn cho mọi người dùng. Chỗ này là danh sách người học
 * khai là mình đã học rồi — gộp từ hai nguồn họ đưa: bảng 79 từ họ tự liệt kê và
 * tệp PDF "HSK1 toàn bộ từ vựng đã học". Hai nguồn lệch nhau 10 từ, nên bản gộp
 * có 89 mục và nhóm `them` ghi rõ 10 từ chỉ có trong PDF.
 *
 * Câu luyện nghe được ghép sao cho mỗi chữ Hán trong câu đều nằm trong 89 mục
 * đó. Hai ngoại lệ là `去` và `车`: chúng không đứng riêng trong danh sách nhưng
 * là một nửa của `去哪儿` và `开车`, nên người học đã nhìn thấy mặt chữ rồi. Ngoài
 * hai chữ đó thì không có chữ nào mới — đúng yêu cầu "không tự ý thêm từ mới".
 *
 * Các cấu trúc bị tránh vì chưa học: lượng từ `个`, trợ từ sở hữu `的`, phủ định
 * quá khứ `没`, và `多` trong `很多`.
 */

export type WordGroup = 'co-ban' | 'buoi' | 'so' | 'sinh-hoat' | 'moi' | 'them';

export interface WordGroupInfo {
  id: WordGroup;
  title: string;
  /** Vì sao nhóm này tách riêng — hiện ngay dưới tiêu đề nhóm. */
  note?: string;
}

export const WORD_GROUPS: readonly WordGroupInfo[] = [
  { id: 'co-ban', title: 'Nhóm từ cơ bản' },
  { id: 'buoi', title: 'Buổi trong ngày' },
  { id: 'so', title: 'Số đếm', note: 'Ghép được: 十一 = 11, 二十 = 20, 二十一 = 21, 三十 = 30…' },
  { id: 'sinh-hoat', title: 'Thời gian và sinh hoạt' },
  { id: 'moi', title: '10 từ mới gần nhất', note: 'Nhóm được lặp nhiều nhất trong phần câu.' },
  { id: 'them', title: 'Có trong PDF, thiếu ở bảng 79 từ' },
];

export interface MyWord {
  hanzi: string;
  pinyin: string;
  vi: string;
  group: WordGroup;
}

export const MY_WORDS: readonly MyWord[] = [
  { hanzi: '开车', pinyin: 'kāichē', vi: 'lái xe', group: 'co-ban' },
  { hanzi: '吃饭', pinyin: 'chīfàn', vi: 'ăn cơm', group: 'co-ban' },
  { hanzi: '打电话', pinyin: 'dǎ diànhuà', vi: 'gọi điện thoại', group: 'co-ban' },
  { hanzi: '昨天', pinyin: 'zuótiān', vi: 'hôm qua', group: 'co-ban' },
  { hanzi: '今天', pinyin: 'jīntiān', vi: 'hôm nay', group: 'co-ban' },
  { hanzi: '明天', pinyin: 'míngtiān', vi: 'ngày mai', group: 'co-ban' },
  { hanzi: '年', pinyin: 'nián', vi: 'năm', group: 'co-ban' },
  { hanzi: '下雨', pinyin: 'xiàyǔ', vi: 'trời mưa', group: 'co-ban' },
  { hanzi: '喝水', pinyin: 'hē shuǐ', vi: 'uống nước', group: 'co-ban' },
  { hanzi: '做什么', pinyin: 'zuò shénme', vi: 'làm gì', group: 'co-ban' },
  { hanzi: '去哪儿', pinyin: 'qù nǎr', vi: 'đi đâu', group: 'co-ban' },
  { hanzi: '我', pinyin: 'wǒ', vi: 'tôi', group: 'co-ban' },
  { hanzi: '和', pinyin: 'hé', vi: 'và', group: 'co-ban' },
  { hanzi: '你', pinyin: 'nǐ', vi: 'bạn', group: 'co-ban' },
  { hanzi: '对吗', pinyin: 'duì ma', vi: 'đúng không', group: 'co-ban' },
  { hanzi: '妹妹', pinyin: 'mèimei', vi: 'em gái', group: 'co-ban' },
  { hanzi: '他们', pinyin: 'tāmen', vi: 'họ', group: 'co-ban' },
  { hanzi: '姐姐', pinyin: 'jiějie', vi: 'chị gái', group: 'co-ban' },
  { hanzi: '儿子', pinyin: 'érzi', vi: 'con trai', group: 'co-ban' },
  { hanzi: '衣服', pinyin: 'yīfu', vi: 'quần áo', group: 'co-ban' },
  { hanzi: '请', pinyin: 'qǐng', vi: 'mời, vui lòng', group: 'co-ban' },
  { hanzi: '喝', pinyin: 'hē', vi: 'uống', group: 'co-ban' },
  { hanzi: '茶', pinyin: 'chá', vi: 'trà', group: 'co-ban' },
  { hanzi: '在', pinyin: 'zài', vi: 'ở, tại; đang', group: 'co-ban' },
  { hanzi: '商店', pinyin: 'shāngdiàn', vi: 'cửa hàng', group: 'co-ban' },
  { hanzi: '里', pinyin: 'lǐ', vi: 'bên trong', group: 'co-ban' },
  { hanzi: '三', pinyin: 'sān', vi: 'ba', group: 'co-ban' },
  { hanzi: '本', pinyin: 'běn', vi: 'quyển, cuốn', group: 'co-ban' },
  { hanzi: '书', pinyin: 'shū', vi: 'sách', group: 'co-ban' },
  { hanzi: '很', pinyin: 'hěn', vi: 'rất', group: 'co-ban' },
  { hanzi: '漂亮', pinyin: 'piàoliang', vi: 'đẹp, xinh', group: 'co-ban' },
  { hanzi: '他', pinyin: 'tā', vi: 'anh ấy', group: 'co-ban' },
  { hanzi: '睡觉', pinyin: 'shuìjiào', vi: 'ngủ', group: 'co-ban' },
  { hanzi: '呢', pinyin: 'ne', vi: 'trợ từ — “còn… thì sao”', group: 'co-ban' },
  { hanzi: '太', pinyin: 'tài', vi: 'quá', group: 'co-ban' },
  { hanzi: '热', pinyin: 'rè', vi: 'nóng', group: 'co-ban' },
  { hanzi: '了', pinyin: 'le', vi: 'trợ từ — “đã, rồi”', group: 'co-ban' },
  { hanzi: '是', pinyin: 'shì', vi: 'là', group: 'co-ban' },
  { hanzi: '有', pinyin: 'yǒu', vi: 'có', group: 'co-ban' },
  { hanzi: '不', pinyin: 'bù', vi: 'không', group: 'co-ban' },
  { hanzi: '好', pinyin: 'hǎo', vi: 'tốt, khỏe', group: 'co-ban' },
  { hanzi: '人', pinyin: 'rén', vi: 'người', group: 'co-ban' },
  { hanzi: '家', pinyin: 'jiā', vi: 'nhà, gia đình', group: 'co-ban' },
  { hanzi: '学校', pinyin: 'xuéxiào', vi: 'trường học', group: 'co-ban' },
  { hanzi: '老师', pinyin: 'lǎoshī', vi: 'giáo viên', group: 'co-ban' },
  { hanzi: '学生', pinyin: 'xuésheng', vi: 'học sinh', group: 'co-ban' },
  { hanzi: '朋友', pinyin: 'péngyou', vi: 'bạn bè', group: 'co-ban' },

  { hanzi: '早上', pinyin: 'zǎoshang', vi: 'buổi sáng', group: 'buoi' },
  { hanzi: '中午', pinyin: 'zhōngwǔ', vi: 'buổi trưa', group: 'buoi' },
  { hanzi: '晚上', pinyin: 'wǎnshang', vi: 'buổi tối', group: 'buoi' },

  { hanzi: '一', pinyin: 'yī', vi: 'một', group: 'so' },
  { hanzi: '二', pinyin: 'èr', vi: 'hai', group: 'so' },
  { hanzi: '四', pinyin: 'sì', vi: 'bốn', group: 'so' },
  { hanzi: '五', pinyin: 'wǔ', vi: 'năm', group: 'so' },
  { hanzi: '六', pinyin: 'liù', vi: 'sáu', group: 'so' },
  { hanzi: '七', pinyin: 'qī', vi: 'bảy', group: 'so' },
  { hanzi: '八', pinyin: 'bā', vi: 'tám', group: 'so' },
  { hanzi: '九', pinyin: 'jiǔ', vi: 'chín', group: 'so' },
  { hanzi: '十', pinyin: 'shí', vi: 'mười', group: 'so' },

  { hanzi: '点', pinyin: 'diǎn', vi: 'giờ', group: 'sinh-hoat' },
  { hanzi: '分钟', pinyin: 'fēnzhōng', vi: 'phút', group: 'sinh-hoat' },
  { hanzi: '来', pinyin: 'lái', vi: 'đến', group: 'sinh-hoat' },
  { hanzi: '回', pinyin: 'huí', vi: 'về, quay về', group: 'sinh-hoat' },
  { hanzi: '看', pinyin: 'kàn', vi: 'xem, nhìn', group: 'sinh-hoat' },
  { hanzi: '电视', pinyin: 'diànshì', vi: 'tivi', group: 'sinh-hoat' },
  { hanzi: '工作', pinyin: 'gōngzuò', vi: 'làm việc', group: 'sinh-hoat' },
  { hanzi: '会', pinyin: 'huì', vi: 'biết, có thể', group: 'sinh-hoat' },
  { hanzi: '爸爸', pinyin: 'bàba', vi: 'bố', group: 'sinh-hoat' },
  { hanzi: '妈妈', pinyin: 'māma', vi: 'mẹ', group: 'sinh-hoat' },

  { hanzi: '现在', pinyin: 'xiànzài', vi: 'bây giờ', group: 'moi' },
  { hanzi: '几', pinyin: 'jǐ', vi: 'mấy, bao nhiêu', group: 'moi' },
  { hanzi: '多少', pinyin: 'duōshao', vi: 'bao nhiêu', group: 'moi' },
  { hanzi: '什么', pinyin: 'shénme', vi: 'cái gì', group: 'moi' },
  { hanzi: '哪', pinyin: 'nǎ', vi: 'nào', group: 'moi' },
  { hanzi: '这', pinyin: 'zhè', vi: 'này, đây', group: 'moi' },
  { hanzi: '那', pinyin: 'nà', vi: 'kia, đó', group: 'moi' },
  { hanzi: '买', pinyin: 'mǎi', vi: 'mua', group: 'moi' },
  { hanzi: '钱', pinyin: 'qián', vi: 'tiền', group: 'moi' },
  { hanzi: '东西', pinyin: 'dōngxi', vi: 'đồ, đồ vật', group: 'moi' },

  { hanzi: '学习', pinyin: 'xuéxí', vi: 'học', group: 'them' },
  { hanzi: '汉语', pinyin: 'hànyǔ', vi: 'tiếng Trung', group: 'them' },
  { hanzi: '说', pinyin: 'shuō', vi: 'nói', group: 'them' },
  { hanzi: '写', pinyin: 'xiě', vi: 'viết', group: 'them' },
  { hanzi: '字', pinyin: 'zì', vi: 'chữ Hán', group: 'them' },
  { hanzi: '医生', pinyin: 'yīshēng', vi: 'bác sĩ', group: 'them' },
  { hanzi: '医院', pinyin: 'yīyuàn', vi: 'bệnh viện', group: 'them' },
  { hanzi: '苹果', pinyin: 'píngguǒ', vi: 'táo', group: 'them' },
  { hanzi: '水果', pinyin: 'shuǐguǒ', vi: 'hoa quả', group: 'them' },
  { hanzi: '坐', pinyin: 'zuò', vi: 'ngồi; đi bằng phương tiện', group: 'them' },
];

/** Cấp độ câu: 1 dễ nhất, 3 dài nhất. Người học yêu cầu xếp từ dễ đến khó. */
export type SentenceLevel = 1 | 2 | 3;

export interface MySentence {
  id: string;
  hanzi: string;
  pinyin: string;
  vi: string;
  level: SentenceLevel;
}

export const SENTENCE_LEVELS: readonly { level: SentenceLevel; title: string; note: string }[] = [
  { level: 1, title: 'Cấp 1 — câu ngắn', note: '3–5 chữ, một chủ ngữ một hành động' },
  { level: 2, title: 'Cấp 2 — câu vừa', note: '5–7 chữ, thêm thời gian hoặc nơi chốn' },
  { level: 3, title: 'Cấp 3 — câu dài', note: '7–11 chữ, hai vế hoặc đủ giờ giấc' },
];

export const MY_SENTENCES: readonly MySentence[] = [
  { id: 'c01', level: 1, hanzi: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?', vi: 'Bây giờ mấy giờ?' },
  { id: 'c02', level: 1, hanzi: '现在八点。', pinyin: 'Xiànzài bā diǎn.', vi: 'Bây giờ tám giờ.' },
  { id: 'c03', level: 1, hanzi: '这是什么？', pinyin: 'Zhè shì shénme?', vi: 'Đây là cái gì?' },
  { id: 'c04', level: 1, hanzi: '那是什么？', pinyin: 'Nà shì shénme?', vi: 'Kia là cái gì?' },
  { id: 'c05', level: 1, hanzi: '多少钱？', pinyin: 'Duōshao qián?', vi: 'Bao nhiêu tiền?' },
  { id: 'c06', level: 1, hanzi: '我买东西。', pinyin: 'Wǒ mǎi dōngxi.', vi: 'Tôi mua đồ.' },
  { id: 'c07', level: 1, hanzi: '你买什么？', pinyin: 'Nǐ mǎi shénme?', vi: 'Bạn mua gì?' },
  { id: 'c08', level: 1, hanzi: '这是茶。', pinyin: 'Zhè shì chá.', vi: 'Đây là trà.' },
  { id: 'c09', level: 1, hanzi: '那是书。', pinyin: 'Nà shì shū.', vi: 'Kia là sách.' },
  { id: 'c10', level: 1, hanzi: '哪本书？', pinyin: 'Nǎ běn shū?', vi: 'Quyển sách nào?' },
  { id: 'c11', level: 1, hanzi: '爸爸工作。', pinyin: 'Bàba gōngzuò.', vi: 'Bố làm việc.' },
  { id: 'c12', level: 1, hanzi: '妈妈看电视。', pinyin: 'Māma kàn diànshì.', vi: 'Mẹ xem tivi.' },
  { id: 'c13', level: 1, hanzi: '他来了。', pinyin: 'Tā lái le.', vi: 'Anh ấy đến rồi.' },
  { id: 'c14', level: 1, hanzi: '我回家。', pinyin: 'Wǒ huí jiā.', vi: 'Tôi về nhà.' },
  { id: 'c15', level: 1, hanzi: '我会开车。', pinyin: 'Wǒ huì kāichē.', vi: 'Tôi biết lái xe.' },
  { id: 'c16', level: 1, hanzi: '早上七点。', pinyin: 'Zǎoshang qī diǎn.', vi: 'Bảy giờ sáng.' },
  { id: 'c17', level: 1, hanzi: '中午十二点。', pinyin: 'Zhōngwǔ shí’èr diǎn.', vi: 'Mười hai giờ trưa.' },
  { id: 'c18', level: 1, hanzi: '晚上九点。', pinyin: 'Wǎnshang jiǔ diǎn.', vi: 'Chín giờ tối.' },
  { id: 'c19', level: 1, hanzi: '五分钟。', pinyin: 'Wǔ fēnzhōng.', vi: 'Năm phút.' },
  { id: 'c20', level: 1, hanzi: '太热了。', pinyin: 'Tài rè le.', vi: 'Nóng quá.' },
  { id: 'c21', level: 1, hanzi: '今天下雨。', pinyin: 'Jīntiān xiàyǔ.', vi: 'Hôm nay trời mưa.' },
  { id: 'c22', level: 1, hanzi: '我很好。', pinyin: 'Wǒ hěn hǎo.', vi: 'Tôi rất khỏe.' },
  { id: 'c23', level: 1, hanzi: '你呢？', pinyin: 'Nǐ ne?', vi: 'Còn bạn thì sao?' },
  { id: 'c24', level: 1, hanzi: '请喝茶。', pinyin: 'Qǐng hē chá.', vi: 'Mời uống trà.' },
  { id: 'c25', level: 1, hanzi: '我有钱。', pinyin: 'Wǒ yǒu qián.', vi: 'Tôi có tiền.' },
  { id: 'c26', level: 1, hanzi: '我去商店。', pinyin: 'Wǒ qù shāngdiàn.', vi: 'Tôi đi cửa hàng.' },
  { id: 'c27', level: 1, hanzi: '儿子睡觉。', pinyin: 'Érzi shuìjiào.', vi: 'Con trai đi ngủ.' },
  { id: 'c28', level: 1, hanzi: '他是老师。', pinyin: 'Tā shì lǎoshī.', vi: 'Anh ấy là giáo viên.' },
  { id: 'c29', level: 1, hanzi: '我学习汉语。', pinyin: 'Wǒ xuéxí Hànyǔ.', vi: 'Tôi học tiếng Trung.' },
  { id: 'c30', level: 1, hanzi: '我写字。', pinyin: 'Wǒ xiě zì.', vi: 'Tôi viết chữ.' },

  { id: 'c31', level: 2, hanzi: '现在是几点？', pinyin: 'Xiànzài shì jǐ diǎn?', vi: 'Bây giờ là mấy giờ?' },
  { id: 'c32', level: 2, hanzi: '现在几点了？', pinyin: 'Xiànzài jǐ diǎn le?', vi: 'Bây giờ mấy giờ rồi?' },
  { id: 'c33', level: 2, hanzi: '这东西多少钱？', pinyin: 'Zhè dōngxi duōshao qián?', vi: 'Đồ này bao nhiêu tiền?' },
  { id: 'c34', level: 2, hanzi: '那本书多少钱？', pinyin: 'Nà běn shū duōshao qián?', vi: 'Quyển sách kia bao nhiêu tiền?' },
  { id: 'c35', level: 2, hanzi: '你买什么东西？', pinyin: 'Nǐ mǎi shénme dōngxi?', vi: 'Bạn mua đồ gì?' },
  { id: 'c36', level: 2, hanzi: '妈妈买东西了。', pinyin: 'Māma mǎi dōngxi le.', vi: 'Mẹ mua đồ rồi.' },
  { id: 'c37', level: 2, hanzi: '爸爸晚上回家。', pinyin: 'Bàba wǎnshang huí jiā.', vi: 'Buổi tối bố về nhà.' },
  { id: 'c38', level: 2, hanzi: '我早上喝茶。', pinyin: 'Wǒ zǎoshang hē chá.', vi: 'Buổi sáng tôi uống trà.' },
  { id: 'c39', level: 2, hanzi: '中午我吃饭。', pinyin: 'Zhōngwǔ wǒ chīfàn.', vi: 'Buổi trưa tôi ăn cơm.' },
  { id: 'c40', level: 2, hanzi: '晚上我看电视。', pinyin: 'Wǎnshang wǒ kàn diànshì.', vi: 'Buổi tối tôi xem tivi.' },
  { id: 'c41', level: 2, hanzi: '妈妈在打电话。', pinyin: 'Māma zài dǎ diànhuà.', vi: 'Mẹ đang gọi điện thoại.' },
  { id: 'c42', level: 2, hanzi: '我会说汉语。', pinyin: 'Wǒ huì shuō Hànyǔ.', vi: 'Tôi biết nói tiếng Trung.' },
  { id: 'c43', level: 2, hanzi: '他不会写字。', pinyin: 'Tā bú huì xiě zì.', vi: 'Anh ấy không biết viết chữ.' },
  { id: 'c44', level: 2, hanzi: '姐姐是医生。', pinyin: 'Jiějie shì yīshēng.', vi: 'Chị gái là bác sĩ.' },
  { id: 'c45', level: 2, hanzi: '我有三本书。', pinyin: 'Wǒ yǒu sān běn shū.', vi: 'Tôi có ba quyển sách.' },
  { id: 'c46', level: 2, hanzi: '你有几本书？', pinyin: 'Nǐ yǒu jǐ běn shū?', vi: 'Bạn có mấy quyển sách?' },
  { id: 'c47', level: 2, hanzi: '家里有人。', pinyin: 'Jiā lǐ yǒu rén.', vi: 'Trong nhà có người.' },
  { id: 'c48', level: 2, hanzi: '商店里有水果。', pinyin: 'Shāngdiàn lǐ yǒu shuǐguǒ.', vi: 'Trong cửa hàng có hoa quả.' },
  { id: 'c49', level: 2, hanzi: '这衣服很漂亮。', pinyin: 'Zhè yīfu hěn piàoliang.', vi: 'Bộ quần áo này rất đẹp.' },
  { id: 'c50', level: 2, hanzi: '这本书太好了。', pinyin: 'Zhè běn shū tài hǎo le.', vi: 'Quyển sách này hay quá.' },
  { id: 'c51', level: 2, hanzi: '今天太热了。', pinyin: 'Jīntiān tài rè le.', vi: 'Hôm nay nóng quá.' },
  { id: 'c52', level: 2, hanzi: '昨天我在家。', pinyin: 'Zuótiān wǒ zài jiā.', vi: 'Hôm qua tôi ở nhà.' },
  { id: 'c53', level: 2, hanzi: '明天他来我家。', pinyin: 'Míngtiān tā lái wǒ jiā.', vi: 'Ngày mai anh ấy đến nhà tôi.' },
  { id: 'c54', level: 2, hanzi: '我坐车回家。', pinyin: 'Wǒ zuò chē huí jiā.', vi: 'Tôi đi xe về nhà.' },
  { id: 'c55', level: 2, hanzi: '老师在写字。', pinyin: 'Lǎoshī zài xiě zì.', vi: 'Giáo viên đang viết chữ.' },
  { id: 'c56', level: 2, hanzi: '学生在学校。', pinyin: 'Xuésheng zài xuéxiào.', vi: 'Học sinh ở trường.' },
  { id: 'c57', level: 2, hanzi: '你去哪儿？', pinyin: 'Nǐ qù nǎr?', vi: 'Bạn đi đâu?' },
  { id: 'c58', level: 2, hanzi: '你在做什么？', pinyin: 'Nǐ zài zuò shénme?', vi: 'Bạn đang làm gì?' },
  { id: 'c59', level: 2, hanzi: '他们在吃饭。', pinyin: 'Tāmen zài chīfàn.', vi: 'Họ đang ăn cơm.' },
  { id: 'c60', level: 2, hanzi: '苹果多少钱？', pinyin: 'Píngguǒ duōshao qián?', vi: 'Táo bao nhiêu tiền?' },

  { id: 'c61', level: 3, hanzi: '现在是晚上九点。', pinyin: 'Xiànzài shì wǎnshang jiǔ diǎn.', vi: 'Bây giờ là chín giờ tối.' },
  { id: 'c62', level: 3, hanzi: '我早上七点吃饭。', pinyin: 'Wǒ zǎoshang qī diǎn chīfàn.', vi: 'Bảy giờ sáng tôi ăn cơm.' },
  { id: 'c63', level: 3, hanzi: '妈妈中午十二点回家。', pinyin: 'Māma zhōngwǔ shí’èr diǎn huí jiā.', vi: 'Mười hai giờ trưa mẹ về nhà.' },
  { id: 'c64', level: 3, hanzi: '爸爸晚上八点看电视。', pinyin: 'Bàba wǎnshang bā diǎn kàn diànshì.', vi: 'Tám giờ tối bố xem tivi.' },
  { id: 'c65', level: 3, hanzi: '我晚上十点睡觉。', pinyin: 'Wǒ wǎnshang shí diǎn shuìjiào.', vi: 'Mười giờ tối tôi đi ngủ.' },
  { id: 'c66', level: 3, hanzi: '老师九点来学校。', pinyin: 'Lǎoshī jiǔ diǎn lái xuéxiào.', vi: 'Chín giờ giáo viên đến trường.' },
  { id: 'c67', level: 3, hanzi: '他们三点去商店买东西。', pinyin: 'Tāmen sān diǎn qù shāngdiàn mǎi dōngxi.', vi: 'Ba giờ họ đi cửa hàng mua đồ.' },
  { id: 'c68', level: 3, hanzi: '妈妈买了衣服和书。', pinyin: 'Māma mǎi le yīfu hé shū.', vi: 'Mẹ đã mua quần áo và sách.' },
  { id: 'c69', level: 3, hanzi: '我在商店买水果。', pinyin: 'Wǒ zài shāngdiàn mǎi shuǐguǒ.', vi: 'Tôi mua hoa quả ở cửa hàng.' },
  { id: 'c70', level: 3, hanzi: '现在商店里有人。', pinyin: 'Xiànzài shāngdiàn lǐ yǒu rén.', vi: 'Bây giờ trong cửa hàng có người.' },
  { id: 'c71', level: 3, hanzi: '你今天买什么东西？', pinyin: 'Nǐ jīntiān mǎi shénme dōngxi?', vi: 'Hôm nay bạn mua đồ gì?' },
  { id: 'c72', level: 3, hanzi: '这本书和那本书多少钱？', pinyin: 'Zhè běn shū hé nà běn shū duōshao qián?', vi: 'Quyển sách này và quyển kia bao nhiêu tiền?' },
  { id: 'c73', level: 3, hanzi: '爸爸会开车，妈妈不会。', pinyin: 'Bàba huì kāichē, māma bú huì.', vi: 'Bố biết lái xe, mẹ thì không.' },
  { id: 'c74', level: 3, hanzi: '我会说汉语，他不会。', pinyin: 'Wǒ huì shuō Hànyǔ, tā bú huì.', vi: 'Tôi biết nói tiếng Trung, anh ấy thì không.' },
  { id: 'c75', level: 3, hanzi: '姐姐在医院工作。', pinyin: 'Jiějie zài yīyuàn gōngzuò.', vi: 'Chị gái làm việc ở bệnh viện.' },
  { id: 'c76', level: 3, hanzi: '妹妹在学校学习汉语。', pinyin: 'Mèimei zài xuéxiào xuéxí Hànyǔ.', vi: 'Em gái học tiếng Trung ở trường.' },
  { id: 'c77', level: 3, hanzi: '我儿子是学生。', pinyin: 'Wǒ érzi shì xuésheng.', vi: 'Con trai tôi là học sinh.' },
  { id: 'c78', level: 3, hanzi: '明天下雨，我不去学校。', pinyin: 'Míngtiān xiàyǔ, wǒ bú qù xuéxiào.', vi: 'Ngày mai trời mưa, tôi không đi học.' },
  { id: 'c79', level: 3, hanzi: '昨天太热了，我在家睡觉。', pinyin: 'Zuótiān tài rè le, wǒ zài jiā shuìjiào.', vi: 'Hôm qua nóng quá, tôi ở nhà ngủ.' },
  { id: 'c80', level: 3, hanzi: '你现在做什么呢？', pinyin: 'Nǐ xiànzài zuò shénme ne?', vi: 'Bây giờ bạn đang làm gì thế?' },
  { id: 'c81', level: 3, hanzi: '你是老师，对吗？', pinyin: 'Nǐ shì lǎoshī, duì ma?', vi: 'Bạn là giáo viên, đúng không?' },
  { id: 'c82', level: 3, hanzi: '那是你妹妹，对吗？', pinyin: 'Nà shì nǐ mèimei, duì ma?', vi: 'Kia là em gái bạn, đúng không?' },
  { id: 'c83', level: 3, hanzi: '他们明天来我家吃饭。', pinyin: 'Tāmen míngtiān lái wǒ jiā chīfàn.', vi: 'Ngày mai họ đến nhà tôi ăn cơm.' },
  { id: 'c84', level: 3, hanzi: '我朋友会说汉语。', pinyin: 'Wǒ péngyou huì shuō Hànyǔ.', vi: 'Bạn tôi biết nói tiếng Trung.' },
  { id: 'c85', level: 3, hanzi: '老师在学校写字。', pinyin: 'Lǎoshī zài xuéxiào xiě zì.', vi: 'Giáo viên viết chữ ở trường.' },
  { id: 'c86', level: 3, hanzi: '我看了十分钟电视。', pinyin: 'Wǒ kàn le shí fēnzhōng diànshì.', vi: 'Tôi đã xem tivi mười phút.' },
  { id: 'c87', level: 3, hanzi: '我在家看电视，你呢？', pinyin: 'Wǒ zài jiā kàn diànshì, nǐ ne?', vi: 'Tôi ở nhà xem tivi, còn bạn?' },
  { id: 'c88', level: 3, hanzi: '妈妈买了三本书。', pinyin: 'Māma mǎi le sān běn shū.', vi: 'Mẹ đã mua ba quyển sách.' },
  { id: 'c89', level: 3, hanzi: '现在是五点，我回家。', pinyin: 'Xiànzài shì wǔ diǎn, wǒ huí jiā.', vi: 'Bây giờ là năm giờ, tôi về nhà.' },
  { id: 'c90', level: 3, hanzi: '这苹果很好，多少钱？', pinyin: 'Zhè píngguǒ hěn hǎo, duōshao qián?', vi: 'Táo này ngon lắm, bao nhiêu tiền?' },
];

/**
 * Hai chữ xuất hiện trong câu mà không đứng riêng trong danh sách 89 mục. Trang
 * nói rõ chúng ra thay vì để người học tự hỏi mình đã học chữ này chưa.
 */
export const BORROWED_CHARS: readonly { char: string; from: string; vi: string }[] = [
  { char: '去', from: '去哪儿', vi: 'đi' },
  { char: '车', from: '开车', vi: 'xe' },
];
