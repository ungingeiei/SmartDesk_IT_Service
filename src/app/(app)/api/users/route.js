import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { usernameFromCode } from '@/lib/users'
import { USER_SAFE_SELECT, toUserDTO } from '@/lib/userDto'
import { NextResponse } from 'next/server'

export async function GET() {
    const users = await prisma.users.findMany({ select: USER_SAFE_SELECT })

    if (users.length === 0){
        return NextResponse.json({error: "Not found"}, {status: 404})
    }
    return NextResponse.json(users.map(toUserDTO))
}

/** "เพิ่มผู้ใช้" — the admin user-management form's add flow. */
export async function POST(req) {
    const { code, name, email, title, role, password } = await req.json()

    if (!code?.trim() || !name?.trim() || !email?.trim() || !role || !password) {
        return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 })
    }

    const pwd_hash = await hashPassword(password)

    try {
        const created = await prisma.users.create({
            data: {
                employee_code: code.trim(),
                name: name.trim(),
                username: usernameFromCode(code),
                email: email.trim().toLowerCase(),
                pwd_hash,
                role,
                title: title?.trim() || null,
            },
            select: USER_SAFE_SELECT,
        })
        return NextResponse.json(toUserDTO(created), { status: 201 })
    } catch (err) {
        if (err.code === 'P2002') {
            return NextResponse.json(
                { error: 'รหัสพนักงาน อีเมล หรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' },
                { status: 409 },
            )
        }
        throw err
    }
}
