// Feature 1: ตั้ง/เปลี่ยนรหัสผ่าน (Reset Password)
// Requirement: รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร และต้องมีทั้งตัวอักษรอังกฤษและตัวเลข
import { validatePassword, generatePassword, PASSWORD_MIN_LENGTH } from '@/lib/users';

describe('validatePassword', () => {
  // Positive Test Cases — ผ่านเงื่อนไข จึงต้องได้ '' (ไม่มี error)
  it('should accept a password with the minimum length of 8 characters', () => {
    // Arrange
    const password = 'abcde123';
    // Act
    const result = validatePassword(password);
    // Assert
    expect(result).toBe('');
  });

  it('should accept a password longer than the minimum length', () => {
    expect(validatePassword('Password2026')).toBe('');
  });

  it('should accept a password containing symbols as long as it has letters and digits', () => {
    expect(validatePassword('Pa$$w0rd!')).toBe('');
  });

  // Negative Test Cases — ไม่ผ่านเงื่อนไข จึงต้องได้ข้อความ error
  it('should reject an empty password', () => {
    expect(validatePassword('')).toBe('กรุณากรอกรหัสผ่าน');
  });

  it('should reject a password shorter than 8 characters', () => {
    expect(validatePassword('abc123')).toBe(
      `รหัสผ่านต้องยาวอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`
    );
  });

  it('should reject a password containing only letters', () => {
    expect(validatePassword('abcdefghij')).toBe(
      'รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลข'
    );
  });

  it('should reject a password containing only digits', () => {
    expect(validatePassword('1234567890')).toBe(
      'รหัสผ่านต้องมีทั้งตัวอักษรภาษาอังกฤษและตัวเลข'
    );
  });

  // Boundary Value — ขอบเขตอยู่ที่ความยาว 8 ตัวอักษร
  it('should reject at the boundary - 7 characters', () => {
    expect(validatePassword('abcde12')).toBeTruthy();
  });

  it('should accept at the boundary - 8 characters', () => {
    expect(validatePassword('abcde123')).toBeFalsy();
  });

  it('should accept just above the boundary - 9 characters', () => {
    expect(validatePassword('abcde1234')).toBeFalsy();
  });
});

describe('generatePassword', () => {
  it('should generate a password with the requested length', () => {
    expect(generatePassword(12)).toHaveLength(12);
  });

  it('should always generate a password that passes validatePassword', () => {
    // สุ่ม 50 ครั้ง เพื่อยืนยันว่าทุกครั้งมีทั้งตัวอักษรและตัวเลขเสมอ
    for (let i = 0; i < 50; i += 1) {
      expect(validatePassword(generatePassword())).toBe('');
    }
  });

  it('should not generate look-alike characters (0, O, 1, l, I)', () => {
    expect(generatePassword(20)).not.toMatch(/[0O1lI]/);
  });
});
