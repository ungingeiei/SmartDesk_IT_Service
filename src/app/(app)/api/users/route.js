import pool from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
    const result = await pool.query('SELECT * FROM users')

    if (result.rows.length === 0){
        return NextResponse.json({error: "Not found"}, {status: 404})
    }
    return NextResponse.json(result)
}


export async function POST(req) {
    const { oldPassword, username, newPassword } = await req.json();

    const result = await pool.query('update users set pwd_hash = $1 where username = $2', [newPassword, username])
    
    // if (result.command === "UPDATE"){
    //     return NextResponse.json({message: "Success"}, {status: 200})
    // }
    return NextResponse.json(result)

}