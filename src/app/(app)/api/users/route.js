import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { NextResponse } from 'next/server'

const SAFE_SELECT = {
    id: true,
    employee_code: true,
    name: true,
    username: true,
    email: true,
    role: true,
    title: true,
    last_login_at: true,
    created_at: true,
}

export async function GET() {
    const users = await prisma.users.findMany({ select: SAFE_SELECT })

    if (users.length === 0){
        return NextResponse.json({error: "Not found"}, {status: 404})
    }
    return NextResponse.json(users)
}


export async function POST(req) {
    const { username, newPassword } = await req.json();

    const user = await prisma.users.findUnique({ where: { username }, select: { id: true } })
    if (!user) {
        return NextResponse.json({error: "Not found"}, {status: 404})
    }

    const pwd_hash = await hashPassword(newPassword)
    await prisma.users.update({ where: { id: user.id }, data: { pwd_hash } })

    return NextResponse.json({message: "Success"}, {status: 200})
}
