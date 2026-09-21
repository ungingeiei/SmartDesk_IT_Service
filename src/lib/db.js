import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = global.pgPool ||
    new Pool({
        connectionString: process.env.CONNECTION_STRING,
        max: 20,
        idleTimeoutMillis: 30000,
    })
export default pool