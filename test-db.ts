import "dotenv/config";
import { Pool } from "pg";

console.log("DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();

  const result = await client.query("SELECT current_database()");

  console.log(result.rows);

  client.release();

  await pool.end();
}

main().catch(console.error);