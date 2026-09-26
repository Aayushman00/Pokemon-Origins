// config/db.js
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "myuser",
  password: process.env.DB_PASSWORD || "mypassword",
  database: process.env.DB_NAME || "pokedex",
  port: process.env.DB_PORT || 3306,
  charset: "utf8mb4",
  connectTimeout: 10000, // 10 seconds timeout
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // The DB runs behind a remote proxy (see DB_HOST). It silently drops
  // connections that sit idle in the pool; keepalive pings stop that from
  // happening instead of finding out via a failed query.
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database Connection Failed:", err);
  } else {
    console.log("Connected to MySQL Database");
    connection.release();
  }
});

const promisePool = pool.promise();
const rawQuery = promisePool.query.bind(promisePool);

// A connection can still go stale between the keepalive ping and the next
// query (proxy-side idle cut, network blip). Those failures are transient —
// retrying once against a fresh pooled connection clears them instead of
// bubbling a 500 up for what is really just a dead connection.
const TRANSIENT_ERROR_CODES = new Set([
  "PROTOCOL_CONNECTION_LOST",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
]);

promisePool.query = async (...args) => {
  try {
    return await rawQuery(...args);
  } catch (error) {
    if (!error.fatal && !TRANSIENT_ERROR_CODES.has(error.code)) {
      throw error;
    }
    console.warn("Query failed on a stale connection, retrying once:", error.code || error.message);
    return rawQuery(...args);
  }
};

module.exports = promisePool;
