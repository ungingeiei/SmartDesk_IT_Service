/**
 * ============================================================
 * Feature 6: Knowledge Base Review - Test Overview
 * ============================================================
 *
 * ไฟล์นี้ใช้ทดสอบฟังก์ชันใน src/lib/kbReview.js
 *
 * ฟังก์ชันที่ทดสอบ:
 * 1. isAdmin()
 *    - ตรวจว่า User มี role เป็น admin หรือไม่
 *
 * 2. visibleArticlesWhere()
 *    - ตรวจว่า User แต่ละประเภทสามารถเห็นบทความ
 *      Knowledge Base ได้ตามสิทธิ์ที่กำหนดหรือไม่
 *
 * สิ่งที่ต้องการตรวจสอบ:
 * - Admin สามารถเห็นบทความ approved และ pending
 *   รวมถึงบทความที่ตัวเองสร้าง
 * - User ทั่วไปเห็นบทความ approved
 *   และบทความที่ตัวเองสร้าง
 * - Agent เห็นบทความ approved
 *   และบทความที่ตัวเองสร้าง
 * - ผู้ที่ไม่ได้ Login เห็นเฉพาะบทความ approved
 *
 * Positive Test:
 * - ตรวจกรณีที่ User มีสิทธิ์และระบบควรอนุญาต
 *
 * Negative Test:
 * - ตรวจกรณีที่ User ไม่มีสิทธิ์
 *   หรือไม่มี User และระบบต้องปฏิเสธ/จำกัดข้อมูล
 * ============================================================
 */

import {
  isAdmin,
  visibleArticlesWhere,
} from '@/lib/kbReview';

describe('Feature 6: Knowledge Base Review', () => {

  describe('isAdmin', () => {

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า User ที่มี role เป็น admin
     * ถูกตรวจพบว่าเป็น Admin
     */
    it('should return true for an admin', () => {
      expect(
        isAdmin({ role: 'admin' })
      ).toBe(true);
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจว่า User ที่เป็น agent
     * ไม่ถูกระบุว่าเป็น Admin
     */
    it('should return false for an agent', () => {
      expect(
        isAdmin({ role: 'agent' })
      ).toBe(false);
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจว่า User ที่เป็น employee
     * ไม่ถูกระบุว่าเป็น Admin
     */
    it('should return false for an employee', () => {
      expect(
        isAdmin({ role: 'employee' })
      ).toBe(false);
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจว่าเมื่อไม่มีข้อมูล User
     * ระบบต้องไม่ถือว่าเป็น Admin
     */
    it('should return false for a missing user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    /**
     * NEGATIVE TEST
     *
     * ตรวจว่า role ที่ระบบไม่รู้จัก เช่น guest
     * จะไม่ถูกระบุว่าเป็น Admin
     */
    it('should return false for an unknown role', () => {
      expect(
        isAdmin({ role: 'guest' })
      ).toBe(false);
    });
  });

  describe('visibleArticlesWhere', () => {

    /**
     * POSITIVE TEST
     *
     * ตรวจสิทธิ์ของ Admin
     *
     * Admin สามารถเห็น:
     * - บทความที่ approved
     * - บทความที่ pending
     * - บทความที่ตัวเองสร้าง
     */
    it('should allow an admin to see approved and pending articles', () => {
      const result = visibleArticlesWhere({
        id: 1,
        role: 'admin',
      });

      expect(result).toEqual({
        OR: [
          { status: 'approved' },
          { status: 'pending' },
          { created_by: 1 },
        ],
      });
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจสิทธิ์ของ User ทั่วไป
     *
     * User ทั่วไปสามารถเห็น:
     * - บทความที่ approved
     * - บทความที่ตัวเองสร้าง
     *
     * แต่ไม่สามารถเห็น pending ของคนอื่น
     */
    it('should allow a normal user to see approved articles and their own articles', () => {
      const result = visibleArticlesWhere({
        id: 2,
        role: 'employee',
      });

      expect(result).toEqual({
        OR: [
          { status: 'approved' },
          { created_by: 2 },
        ],
      });
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจสิทธิ์ของ Agent
     *
     * Agent สามารถเห็น:
     * - บทความที่ approved
     * - บทความที่ตัวเองสร้าง
     */
    it('should allow an agent to see approved articles and their own articles', () => {
      const result = visibleArticlesWhere({
        id: 3,
        role: 'agent',
      });

      expect(result).toEqual({
        OR: [
          { status: 'approved' },
          { created_by: 3 },
        ],
      });
    });

    /**
     * NEGATIVE / ACCESS CONTROL TEST
     *
     * ตรวจกรณีที่ไม่มี User
     *
     * เมื่อยังไม่ได้ Login ระบบต้องให้เห็นเฉพาะ
     * บทความที่ approved เท่านั้น
     */
    it('should only allow approved articles for a missing user', () => {
      const result = visibleArticlesWhere(null);

      expect(result).toEqual({
        status: 'approved',
      });
    });
  });
});