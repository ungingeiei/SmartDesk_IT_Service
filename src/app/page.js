import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-15">
      <div className="w-full max-w-[420px]">
        <h1 className="mb-1.5 text-center text-[30px] font-extrabold tracking-[-0.02em]">
          SmartDesk
        </h1>
        <div className="mb-8 text-center text-md2 text-ink-soft">
          เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่านของคุณ
        </div>

        <LoginForm />

        <div className="mt-[22px] text-center text-sm text-ink-faint">
          โหมดสาธิต — emp256 / it014 / it021 / itmgr01 / it007 (รหัสผ่าน: Passw0rd1)
        </div>
      </div>
    </div>
  );
}