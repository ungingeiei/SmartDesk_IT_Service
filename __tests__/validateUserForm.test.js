// Feature 2: จัดการผู้ใช้ (เพิ่ม/แก้ไขผู้ใช้โดยหัวหน้าทีม IT)
// Requirement: ต้องกรอกชื่อ, อีเมลต้องถูกรูปแบบและห้ามซ้ำ, รหัสพนักงานห้ามซ้ำ
//              และต้องแปลงเป็น username ได้
import { validateUserForm, usernameFromCode, isValidEmail } from '@/lib/users';

const others = [
  { name: 'ธนกร วัฒนกิจ', email: 'it014@smartdesk.co.th', code: 'IT-014', title: 'IT Support' },
  { name: 'สมหญิง รักงาน', email: 'emp256@smartdesk.co.th', code: 'EMP-256', title: 'การตลาด' },
];

/** ฟอร์มที่กรอกถูกต้องทุกช่อง ใช้เป็นฐานแล้วค่อยแก้ทีละช่องในแต่ละ test case */
const validForm = {
  name: 'วรพล เจริญสุข',
  email: 'it007@smartdesk.co.th',
  code: 'IT-007',
  password: 'abcde123',
};

describe('usernameFromCode', () => {
  it('should convert an employee code into a lowercase username', () => {
    expect(usernameFromCode('IT-MGR-01')).toBe('itmgr01');
  });

  it('should strip every non-alphanumeric character', () => {
    expect(usernameFromCode('EMP_256 /ก')).toBe('emp256');
  });

  it('should return an empty string when the code has no usable character', () => {
    expect(usernameFromCode('---')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('should accept a well-formed email', () => {
    expect(isValidEmail('user@smartdesk.co.th')).toBe(true);
  });

  it('should reject an email without "@"', () => {
    expect(isValidEmail('user.smartdesk.co.th')).toBe(false);
  });

  it('should reject an email without a domain dot', () => {
    expect(isValidEmail('user@smartdesk')).toBe(false);
  });

  it('should reject an email containing a space', () => {
    expect(isValidEmail('user name@smartdesk.co.th')).toBe(false);
  });
});

describe('validateUserForm', () => {
  // Positive Test Cases
  it('should accept a fully valid form when a password is required', () => {
    // Arrange / Act
    const errors = validateUserForm(validForm, others, { requirePassword: true });
    // Assert
    expect(errors).toEqual({});
  });

  it('should not require a password when editing an existing user', () => {
    const form = { ...validForm, password: '' };
    expect(validateUserForm(form, others, { requirePassword: false })).toEqual({});
  });

  it('should ignore surrounding whitespace in the name, email and code', () => {
    const form = { ...validForm, name: '  วรพล  ', email: ' it007@smartdesk.co.th ', code: ' IT-007 ' };
    expect(validateUserForm(form, others, { requirePassword: true })).toEqual({});
  });

  // Negative Test Cases
  it('should reject a blank name', () => {
    const errors = validateUserForm({ ...validForm, name: '   ' }, others, { requirePassword: true });
    expect(errors.name).toBe('กรุณากรอกชื่อ-นามสกุล');
  });

  it('should reject a malformed email', () => {
    const errors = validateUserForm({ ...validForm, email: 'it007' }, others, { requirePassword: true });
    expect(errors.email).toBe('รูปแบบอีเมลไม่ถูกต้อง');
  });

  it('should reject an email already taken by another user', () => {
    const errors = validateUserForm({ ...validForm, email: 'IT014@smartdesk.co.th' }, others, {
      requirePassword: true,
    });
    expect(errors.email).toBe('อีเมลนี้ถูกใช้งานแล้ว');
  });

  it('should reject an employee code already taken by another user', () => {
    const errors = validateUserForm({ ...validForm, code: 'it-014' }, others, { requirePassword: true });
    expect(errors.code).toBe('รหัสพนักงานนี้ถูกใช้งานแล้ว');
  });

  it('should reject a different code that collapses into an existing username', () => {
    // "IT.014" -> "it014" ชนกับ username ของ IT-014
    const errors = validateUserForm({ ...validForm, code: 'IT.014' }, others, { requirePassword: true });
    expect(errors.code).toBe('รหัสพนักงานนี้ถูกใช้งานแล้ว');
  });

  it('should reject a code that cannot become a username', () => {
    const errors = validateUserForm({ ...validForm, code: '###' }, others, { requirePassword: true });
    expect(errors.code).toBe('รหัสพนักงานต้องมีตัวอักษรภาษาอังกฤษหรือตัวเลข');
  });

  it('should reject a weak password when a password is required', () => {
    const errors = validateUserForm({ ...validForm, password: 'abc' }, others, { requirePassword: true });
    expect(errors.password).toBeTruthy();
  });

  it('should report every invalid field at once', () => {
    const errors = validateUserForm(
      { name: '', email: 'bad', code: '', password: '' },
      others,
      { requirePassword: true }
    );
    expect(Object.keys(errors).sort()).toEqual(['code', 'email', 'name', 'password']);
  });
});
