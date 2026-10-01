/**
 * ============================================================
 * Feature 5: User DTO - Test Overview
 * ============================================================
 *
 * ไฟล์นี้ใช้ทดสอบฟังก์ชัน toUserDTO() ใน src/lib/userDto.js
 *
 * จุดประสงค์หลัก:
 * 1. ตรวจว่าสามารถแปลงข้อมูล User เป็น User DTO ได้
 * 2. ตรวจว่าข้อมูลสำคัญ เช่น id, name, username และ role
 *    ยังคงถูกต้องหลังจากแปลงข้อมูล
 * 3. ตรวจว่า employee_code ถูกเปลี่ยนเป็น code
 * 4. ตรวจสอบสถานะของ User ว่าเป็น active หรือ locked
 *
 * Positive Test:
 * - ตรวจกรณีที่ข้อมูลถูกต้องและระบบควรทำงานสำเร็จ
 *
 * Negative Test:
 * - ในไฟล์นี้ยังไม่มี Negative Test โดยตรง
 *   เพราะ toUserDTO() ปัจจุบันไม่ได้มี validation/error handling
 *   สำหรับข้อมูลผิดรูปแบบ
 * ============================================================
 */

import { toUserDTO } from '@/lib/userDto';

describe('Feature 5: User DTO', () => {
  // ข้อมูล User ตัวอย่างที่ใช้สำหรับทดสอบ
  const user = {
    id: 1,
    name: 'สมหญิง รักงาน',
    username: 'emp256',
    email: 'emp256@smartdesk.co.th',
    role: 'employee',
    title: 'พนักงานฝ่ายการตลาด',
    employee_code: 'EMP-256',
    locked_until: null,
  };

  describe('toUserDTO', () => {

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า toUserDTO() สามารถรับข้อมูล User
     * และคืนค่าเป็น User DTO ได้
     */
    it('should return a user DTO', () => {
      const result = toUserDTO(user);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่าชื่อของ User ยังคงเดิม
     * หลังจากแปลงข้อมูลเป็น DTO
     */
    it('should keep the user name', () => {
      const result = toUserDTO(user);

      expect(result.name).toBe('สมหญิง รักงาน');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า username ของ User ยังคงเดิม
     * หลังจากแปลงข้อมูลเป็น DTO
     */
    it('should keep the username', () => {
      const result = toUserDTO(user);

      expect(result.username).toBe('emp256');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า role ของ User ยังคงเดิม
     * หลังจากแปลงข้อมูลเป็น DTO
     */
    it('should keep the user role', () => {
      const result = toUserDTO(user);

      expect(result.role).toBe('employee');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า employee_code จากข้อมูล Database
     * ถูกแปลงชื่อเป็น code ใน DTO
     */
    it('should convert employee_code to code', () => {
      const result = toUserDTO(user);

      expect(result.code).toBe('EMP-256');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า User ที่ไม่ได้ถูกล็อก
     * จะมีสถานะเป็น active
     *
     * locked_until = null หมายถึงไม่มีการล็อก User
     */
    it('should return active when user is not locked', () => {
      const result = toUserDTO(user);

      expect(result.status).toBe('active');
    });

    /**
     * POSITIVE TEST
     *
     * ตรวจว่า User ที่มี locked_until เป็นวันที่ในอนาคต
     * จะถูกแปลงสถานะเป็น locked
     */
    it('should return locked when locked_until is in the future', () => {
      const lockedUser = {
        ...user,
        locked_until: '2999-12-31T00:00:00Z',
      };

      const result = toUserDTO(lockedUser);

      expect(result.status).toBe('locked');
    });
  });
});