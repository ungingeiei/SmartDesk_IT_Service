// Feature 4: ค้นหาคลังความรู้ (Knowledge Base search)
// Requirement: ค้นได้จากชื่อเรื่อง, หมวดหมู่ และ tag โดยไม่สนตัวพิมพ์เล็ก/ใหญ่
//              และกรองตามหมวดหมู่ที่เลือกไว้ได้พร้อมกัน
import { matchKB } from '@/lib/logic';

const kb = [
  { id: '1', title: 'รีเซ็ตรหัสผ่าน Wi-Fi องค์กร', cat: 'เครือข่าย', tags: ['wifi', 'password'] },
  { id: '2', title: 'ตั้งค่าอีเมลบนมือถือ', cat: 'อีเมล', tags: ['outlook', 'mobile'] },
  { id: '3', title: 'เครื่องพิมพ์ไม่ทำงาน', cat: 'อุปกรณ์', tags: ['printer'] },
];

describe('matchKB', () => {
  // Positive Test Cases
  it('should return every article when the query is empty and no category is selected', () => {
    expect(matchKB(kb, '', [])).toHaveLength(3);
  });

  it('should find an article by a word in its title', () => {
    const result = matchKB(kb, 'เครื่องพิมพ์', []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('should find an article by its category name', () => {
    expect(matchKB(kb, 'อีเมล', [])).toHaveLength(1);
  });

  it('should find an article by one of its tags', () => {
    expect(matchKB(kb, 'printer', [])[0].id).toBe('3');
  });

  it('should ignore letter case', () => {
    expect(matchKB(kb, 'WIFI', [])[0].id).toBe('1');
  });

  it('should ignore surrounding whitespace in the query', () => {
    expect(matchKB(kb, '   outlook  ', [])[0].id).toBe('2');
  });

  it('should match a partial word', () => {
    expect(matchKB(kb, 'out', [])[0].id).toBe('2');
  });

  it('should filter by a single category', () => {
    const result = matchKB(kb, '', ['เครือข่าย']);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter by several categories at once', () => {
    expect(matchKB(kb, '', ['เครือข่าย', 'อีเมล'])).toHaveLength(2);
  });

  it('should apply the query and the category filter together', () => {
    expect(matchKB(kb, 'password', ['เครือข่าย'])).toHaveLength(1);
  });

  // Negative Test Cases
  it('should return an empty list when nothing matches the query', () => {
    expect(matchKB(kb, 'ไม่มีบทความนี้', [])).toEqual([]);
  });

  it('should return an empty list when the query matches but the category does not', () => {
    expect(matchKB(kb, 'printer', ['อีเมล'])).toEqual([]);
  });

  it('should return an empty list when searching an empty knowledge base', () => {
    expect(matchKB([], 'wifi', [])).toEqual([]);
  });

  it('should treat a null query as "no query"', () => {
    expect(matchKB(kb, null, [])).toHaveLength(3);
  });

  it('should treat a null category list as "no category filter"', () => {
    expect(matchKB(kb, '', null)).toHaveLength(3);
  });
});
