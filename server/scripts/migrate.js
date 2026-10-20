// Creates (or updates) all tables by running db/schema.sql.  Usage: npm run db:migrate
import { readFile } from 'node:fs/promises'
import { pool } from '../src/db.js'

const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8')
await pool.query(sql) // the file has no parameters, so Postgres accepts many statements in one go
console.log('Schema is up to date.')
await pool.end()
