/**
 * ============================================================
 * Feature 3: Ticket & SLA Logic - Test Overview
 * ============================================================
 *
 * ไฟล์นี้ใช้ทดสอบฟังก์ชันต่าง ๆ ใน src/lib/logic.js
 *
 * ฟังก์ชันที่ทดสอบ:
 *
 * 1. calcPriority()
 *    - คำนวณระดับความสำคัญของ Ticket
 *      จากค่า Impact และ Urgency
 *
 * 2. slaInfo()
 *    - ตรวจสอบสถานะ SLA ของ Ticket
 *    - ตรวจว่า Ticket ปิดงานแล้วหรือไม่
 *    - ตรวจว่า SLA เกินกำหนดหรือยัง
 *    - ตรวจเวลาที่เหลือเป็นนาทีหรือชั่วโมง
 *
 * 3. guessCategory()
 *    - คาดเดาหมวดหมู่ของ Ticket
 *      จาก Keyword/Tag ของ Knowledge Base
 *
 * 4. formatThaiDate()
 *    - แปลงวันที่ให้อยู่ในรูปแบบวันที่ภาษาไทย
 *
 * 5. formatThaiDateTime()
 *    - แปลงวันที่และเวลาให้อยู่ในรูปแบบภาษาไทย
 *
 * 6. formatThaiTime()
 *    - แปลงเวลาให้อยู่ในรูปแบบ HH:MM
 *
 * 7. bannerTheme()
 *    - ตรวจสอบ Theme ของ Banner ตามหมวดหมู่
 *    - ถ้าไม่พบหมวดหมู่ ต้องใช้ Theme เริ่มต้น
 *
 * 8. initialOf()
 *    - ดึงตัวอักษรตัวแรกจากชื่อ
 *
 * ------------------------------------------------------------
 * Positive Test
 * ------------------------------------------------------------
 * ตรวจสอบกรณีที่ข้อมูลถูกต้องและระบบควรทำงานสำเร็จ
 *
 * ------------------------------------------------------------
 * Negative Test
 * ------------------------------------------------------------
 * ตรวจสอบกรณีข้อมูลไม่ถูกต้อง ข้อมูลหาย หรือกรณีที่ระบบ
 * ต้องคืนค่า null / ค่าเริ่มต้น / ผลลัพธ์ที่ปฏิเสธ
 *
 * ============================================================
 */

import {
  calcPriority,
  slaInfo,
  guessCategory,
  formatThaiDate,
  formatThaiDateTime,
  formatThaiTime,
  bannerTheme,
  initialOf,
} from '@/lib/logic';

describe('Feature 3: Ticket & SLA Logic', () => {

  // ==========================================================
  // calcPriority
  // ==========================================================

  describe('calcPriority', () => {

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าถ้า Impact = 1 และ Urgency = 1
     * ระบบจะคำนวณ Priority เป็นระดับ low
     */
    it('should return low priority for impact 1 and urgency 1', () => {
      expect(calcPriority(1, 1)).toBe('low');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าถ้า Impact = 3 และ Urgency = 3
     * ระบบจะคำนวณ Priority เป็นระดับ critical
     */
    it('should return critical priority for impact 3 and urgency 3', () => {
      expect(calcPriority(3, 3)).toBe('critical');
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจว่าถ้า Impact และ Urgency
     * เป็นค่าที่ไม่ถูกต้อง ระบบต้องไม่สามารถคำนวณ Priority ได้
     * และต้องคืนค่า null
     */
    it('should return null for an invalid combination', () => {
      expect(
        calcPriority('invalid-impact', 'invalid-urgency')
      ).toBeNull();
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจกรณีที่ไม่มีค่า Impact
     * ระบบต้องคืนค่า null
     */
    it('should return null when impact is missing', () => {
      expect(
        calcPriority(null, 'medium')
      ).toBeNull();
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจกรณีที่ไม่มีค่า Urgency
     * ระบบต้องคืนค่า null
     */
    it('should return null when urgency is missing', () => {
      expect(
        calcPriority('person', null)
      ).toBeNull();
    });
  });


  // ==========================================================
  // slaInfo
  // ==========================================================

  describe('slaInfo', () => {

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า Ticket ที่มีสถานะ resolved
     * จะแสดงข้อความว่าปิดงานภายใน SLA
     */
    it('should show completed SLA message for a resolved ticket', () => {
      const ticket = {
        status: 'resolved',
        priority: 'High',
        createdAt: Date.now(),
      };

      const result = slaInfo(ticket, Date.now());

      expect(result.label).toBe('ปิดงานภายในกำหนด SLA');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า Ticket ที่มีสถานะ closed
     * จะแสดงข้อความว่าปิดงานภายใน SLA
     */
    it('should show completed SLA message for a closed ticket', () => {
      const ticket = {
        status: 'closed',
        priority: 'High',
        createdAt: Date.now(),
      };

      const result = slaInfo(ticket, Date.now());

      expect(result.label).toBe('ปิดงานภายในกำหนด SLA');
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจกรณีที่ไม่มีเวลาปัจจุบัน (current time)
     * ระบบต้องไม่สามารถคำนวณ SLA ได้
     * และต้องคืนค่า null
     */
    it('should return null when current time is not available', () => {
      const ticket = {
        status: 'open',
        priority: 'High',
        createdAt: Date.now(),
      };

      expect(
        slaInfo(ticket, null)
      ).toBeNull();
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจว่า Ticket ที่เปิดมานานจนเกินเวลาที่กำหนด
     * ระบบต้องแสดงข้อความว่า SLA เกินกำหนดแล้ว
     */
    it('should show overdue message when SLA has expired', () => {
      const now = Date.now();

      const ticket = {
        status: 'open',
        priority: 'High',
        createdAt: now - 48 * 60 * 60 * 1000,
      };

      const result = slaInfo(ticket, now);

      expect(result.label).toBe('เกินกำหนด SLA แล้ว');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจกรณีที่ Ticket เหลือเวลาตาม SLA
     * น้อยกว่า 1 ชั่วโมง
     *
     * ระบบต้องแสดงเวลาที่เหลือเป็น "นาที"
     */
    it('should show remaining minutes when less than one hour remains', () => {
      const now = Date.now();

      const ticket = {
        status: 'open',
        priority: 'High',
        createdAt: now - 23.5 * 60 * 60 * 1000,
      };

      const result = slaInfo(ticket, now);

      expect(result.label).toContain('เหลือเวลาตาม SLA');
      expect(result.label).toContain('นาที');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจกรณีที่ Ticket ยังเหลือเวลาตาม SLA
     * มากกว่า 1 ชั่วโมง
     *
     * ระบบต้องแสดงเวลาที่เหลือเป็น "ชั่วโมง"
     */
    it('should show remaining hours when more than one hour remains', () => {
      const now = Date.now();

      const ticket = {
        status: 'open',
        priority: 'High',
        createdAt: now - 2 * 60 * 60 * 1000,
      };

      const result = slaInfo(ticket, now);

      expect(result.label).toContain('เหลือเวลาตาม SLA');
      expect(result.label).toContain('ชั่วโมง');
    });
  });


  // ==========================================================
  // guessCategory
  // ==========================================================

  describe('guessCategory', () => {

    // ข้อมูล Knowledge Base ตัวอย่างสำหรับใช้ทดสอบการค้นหา Category
    const kb = [
      {
        id: '1',
        cat: 'เครือข่าย',
        tags: ['wifi', 'internet'],
      },
      {
        id: '2',
        cat: 'อีเมล',
        tags: ['outlook', 'email'],
      },
    ];

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าระบบสามารถหา Category
     * จาก Tag ที่ตรงกับคำอธิบาย Ticket ได้
     */
    it('should guess a category from a matching KB tag', () => {
      expect(
        guessCategory(kb, 'wifi ใช้งานไม่ได้')
      ).toBe('เครือข่าย');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าระบบสามารถจับคู่ Tag
     * โดยไม่สนใจตัวพิมพ์เล็ก/ตัวพิมพ์ใหญ่
     *
     * เช่น "OUTLOOK" ต้องสามารถ match กับ "outlook" ได้
     */
    it('should match tags without case sensitivity', () => {
      expect(
        guessCategory(kb, 'OUTLOOK เปิดไม่ได้')
      ).toBe('อีเมล');
    });

    /**
     * POSITIVE / FALLBACK TEST
     *
     * ตรวจว่าเมื่อไม่พบ Tag ที่ตรงกับคำอธิบาย
     * ระบบยังสามารถคืน Category บางอย่างกลับมาได้
     */
    it('should return a category when no tag matches', () => {
      const result = guessCategory(
        kb,
        'เครื่องพิมพ์เสีย'
      );

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    /**
     * NEGATIVE / EDGE CASE TEST
     *
     * ตรวจกรณีที่ Description เป็นค่าว่าง
     * ระบบต้องยังสามารถคืน Category กลับมาได้
     * แทนที่จะเกิด Error หรือคืนค่า undefined
     */
    it('should still return a category for an empty description', () => {
      const result = guessCategory(kb, '');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });


  // ==========================================================
  // Date & Time Formatting
  // ==========================================================

  describe('date and time formatting', () => {

    // วันที่ตัวอย่าง: 2 กันยายน 2026 เวลา 08:40 น.
    const date = new Date('2026-09-02T08:40:00+07:00');

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าระบบสามารถแปลงวันที่
     * เป็นรูปแบบวันที่ภาษาไทยได้
     *
     * ต้องมี:
     * - วันที่ 2
     * - เดือน ก.ย.
     * - ปี พ.ศ. 2569
     */
    it('should format a Thai date', () => {
      const result = formatThaiDate(date);

      expect(result).toContain('2');
      expect(result).toContain('ก.ย.');
      expect(result).toContain('2569');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าระบบสามารถแปลงวันที่พร้อมเวลา
     * เป็นรูปแบบภาษาไทยได้
     */
    it('should format a Thai date and time', () => {
      const result = formatThaiDateTime(date);

      expect(result).toContain('2');
      expect(result).toContain('ก.ย.');
      expect(result).toContain('2569');

      // ตรวจว่ามีเวลาในรูปแบบ HH:MM
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า formatThaiTime()
     * คืนค่าเวลาในรูปแบบ HH:MM
     *
     * ตัวอย่างเช่น 08:40
     */
    it('should format Thai time as HH:MM', () => {
      const result = formatThaiTime(date);

      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });


  // ==========================================================
  // bannerTheme
  // ==========================================================

  describe('bannerTheme', () => {

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าหมวดหมู่ที่ระบบรู้จัก
     * จะมี Theme ของ Banner กลับมา
     */
    it('should return the theme for a known category', () => {
      const result = bannerTheme('ซอฟต์แวร์');

      expect(result).toBeDefined();
    });

    /**
     * NEGATIVE / FALLBACK TEST
     *
     * ตรวจว่าถ้าใส่หมวดหมู่ที่ไม่มีอยู่ในระบบ
     * ระบบจะใช้ Default Theme
     *
     * โดยเปรียบเทียบกับ Theme ของหมวดหมู่
     * ที่ใช้เป็น Default คือ "ซอฟต์แวร์"
     */
    it('should return the default theme for an unknown category', () => {
      const result = bannerTheme('ไม่มีหมวดหมู่นี้');
      const defaultTheme = bannerTheme('ซอฟต์แวร์');

      expect(result).toEqual(defaultTheme);
    });
  });


  // ==========================================================
  // initialOf
  // ==========================================================

  describe('initialOf', () => {

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าสามารถดึงตัวอักษรตัวแรก
     * จากชื่อภาษาอังกฤษได้
     */
    it('should return the first character of a name', () => {
      expect(
        initialOf('SmartDesk')
      ).toBe('S');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าสามารถดึงตัวอักษรตัวแรก
     * จากชื่อภาษาไทยได้
     */
    it('should return the first Thai character', () => {
      expect(
        initialOf('สมชาย')
      ).toBe('ส');
    });

    /**
     * NEGATIVE / EDGE CASE TEST
     *
     * ตรวจกรณีที่ส่ง String ว่าง
     * ระบบต้องคืนค่า ? แทนที่จะเกิด Error
     */
    it('should return ? when the value is empty', () => {
      expect(
        initialOf('')
      ).toBe('?');
    });

    /**
     * NEGATIVE / EDGE CASE TEST
     *
     * ตรวจกรณีที่ส่งค่า null
     * ระบบต้องคืนค่า ? แทนที่จะเกิด Error
     */
    it('should return ? when the value is null', () => {
      expect(
        initialOf(null)
      ).toBe('?');
    });
  });
});