import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearLookups,
  countLookups,
  getRecentLookups,
  MAX_LOOKUPS,
  recordLookup,
  recordLookups,
  removeLookup,
} from './lookups.ts';
import { db, resetDatabase } from './database.ts';

const T0 = 1_700_000_000_000;

beforeEach(async () => {
  await resetDatabase();
});

describe('recordLookup', () => {
  it('ghi một dòng mới với số lần bằng 1', async () => {
    const row = await recordLookup('L1-0001', { query: 'ni hao', at: T0 });
    expect(row).toEqual({
      wordId: 'L1-0001',
      at: T0,
      count: 1,
      query: 'ni hao',
      source: 'search',
    });
    expect(await countLookups()).toBe(1);
  });

  it('tra lại từ cũ thì cập nhật dòng cũ chứ không thêm dòng', async () => {
    await recordLookup('L1-0001', { query: 'ni', at: T0 });
    const again = await recordLookup('L1-0001', { query: 'ni hao', at: T0 + 5000 });

    expect(await countLookups()).toBe(1);
    expect(again?.count).toBe(2);
    expect(again?.at).toBe(T0 + 5000);
    // Giữ nội dung đã gõ ở lần gần nhất, vì đó là thứ người học vừa nhìn thấy.
    expect(again?.query).toBe('ni hao');
  });

  it('bỏ qua mã từ rỗng', async () => {
    expect(await recordLookup('', { at: T0 })).toBeNull();
    expect(await countLookups()).toBe(0);
  });
});

describe('recordLookups', () => {
  it('ghi cả loạt với cùng một mốc thời gian', async () => {
    const rows = await recordLookups(['L1-0001', 'L1-0002', 'L1-0003'], {
      source: 'scan',
      at: T0,
    });
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.at === T0 && row.source === 'scan')).toBe(true);
    expect(await countLookups()).toBe(3);
  });

  it('một đoạn văn lặp lại cùng một từ chỉ tính một lần', async () => {
    const rows = await recordLookups(['L1-0001', 'L1-0001', 'L1-0002'], { at: T0 });
    expect(rows.map((row) => row.wordId)).toEqual(['L1-0001', 'L1-0002']);
    expect(rows[0].count).toBe(1);
  });

  it('cộng dồn với các lần tra trước đó', async () => {
    await recordLookup('L1-0001', { at: T0 });
    const rows = await recordLookups(['L1-0001', 'L1-0002'], { at: T0 + 1000 });
    expect(rows[0].count).toBe(2);
    expect(rows[1].count).toBe(1);
  });

  it('không làm gì với danh sách rỗng', async () => {
    expect(await recordLookups([], { at: T0 })).toEqual([]);
    expect(await countLookups()).toBe(0);
  });

  it('cắt bớt các từ tra lâu nhất khi vượt mức', async () => {
    // Ghi từng dòng một để mỗi dòng có mốc thời gian riêng, xác định được thứ tự cắt.
    for (let i = 0; i < MAX_LOOKUPS + 10; i += 1) {
      await recordLookup(`L1-${i}`, { at: T0 + i });
    }
    expect(await countLookups()).toBe(MAX_LOOKUPS);
    expect(await db.lookups.get('L1-0')).toBeUndefined();
    expect(await db.lookups.get('L1-9')).toBeUndefined();
    expect(await db.lookups.get('L1-10')).toBeDefined();
  });
});

describe('getRecentLookups', () => {
  it('trả về mới trước cũ sau', async () => {
    await recordLookup('L1-0001', { at: T0 });
    await recordLookup('L1-0002', { at: T0 + 2000 });
    await recordLookup('L1-0003', { at: T0 + 1000 });

    const recent = await getRecentLookups(10);
    expect(recent.map((row) => row.wordId)).toEqual(['L1-0002', 'L1-0003', 'L1-0001']);
  });

  it('cắt đúng số dòng được hỏi', async () => {
    await recordLookups(['L1-0001', 'L1-0002', 'L1-0003'], { at: T0 });
    expect(await getRecentLookups(2)).toHaveLength(2);
    expect(await getRecentLookups(0)).toEqual([]);
    expect(await getRecentLookups(-5)).toEqual([]);
  });
});

describe('xoá lịch sử', () => {
  it('xoá được một dòng', async () => {
    await recordLookups(['L1-0001', 'L1-0002'], { at: T0 });
    await removeLookup('L1-0001');
    expect((await getRecentLookups(10)).map((row) => row.wordId)).toEqual(['L1-0002']);
  });

  it('xoá được tất cả', async () => {
    await recordLookups(['L1-0001', 'L1-0002'], { at: T0 });
    await clearLookups();
    expect(await countLookups()).toBe(0);
  });

  it('đặt lại tiến độ cũng xoá lịch sử tra từ', async () => {
    await recordLookup('L1-0001', { at: T0 });
    await resetDatabase();
    expect(await countLookups()).toBe(0);
  });
});
