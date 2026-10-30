require("dotenv").config();

const pool = require("./db/pool");

async function main() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS time"
    );

    console.log(result.rows[0]);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await pool.end();
  }
}

main();
