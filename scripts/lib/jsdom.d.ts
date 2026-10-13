/**
 * Khai báo tối thiểu cho jsdom: gói không kèm kiểu, mà lệnh nhập bài nghe chỉ
 * cần dựng một `Document` từ chuỗi HTML. Thêm cả gói `@types/jsdom` cho đúng
 * một dòng `new JSDOM(html)` thì không đáng.
 */
declare module 'jsdom' {
  export class JSDOM {
    constructor(html: string);
    readonly window: { readonly document: Document };
  }
}
