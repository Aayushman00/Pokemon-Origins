// const mysql = require("mysql2");

// const pool = mysql.createPool({
// 	host: process.env.DB_HOST || "127.0.0.1",
// 	user: process.env.DB_USER || "myuser",
// 	password: process.env.DB_PASSWORD || "mypassword",
// 	database: process.env.DB_NAME || "pokedex",
// 	port: process.env.DB_PORT || 3306,
// 	connectTimeout: 10000, // 10 seconds timeout
// 	waitForConnections: true,
// 	connectionLimit: 10,
// 	queueLimit: 0,
//   });
  
// pool.getConnection((err, connection) => {
// 	if (err) {
// 		console.error("Database Connection Failed:", err);
// 	} else {
// 		console.log("Connected to MySQL Database");
// 		connection.release();
// 	}
// });

// module.exports = pool.promise();

// config/db.js (or config/trainerDb.js)
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "myuser",
  password: process.env.DB_PASSWORD || "mypassword",
  database: process.env.DB_NAME || "pokedex", // Change to "trainer" if needed
  port: process.env.DB_PORT || 3306,
  charset: "utf8mb4",
  connectTimeout: 10000, // 10 seconds timeout
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optionally test connection using callback, but the exported pool will be promise-based.
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database Connection Failed:", err);
  } else {
    console.log("Connected to MySQL Database");
    connection.release();
  }
});

// Export the promise-enabled pool
module.exports = pool.promise();


// Create a wrapper function that logs queries
const createLoggingPool = () => {
  // Get the promise-based pool
  const promisePool = pool.promise();
  
  // Store the original query method
  const originalQuery = promisePool.query.bind(promisePool);
  
  // Override the query method to add logging
  promisePool.query = async (...args) => {
    const sql = args[0];
    const params = args[1];
    
    // Log the SQL query
    console.log("Executing query:", typeof sql === 'string' ? sql : sql.sql);
    
    // Log parameters if they exist
    if (params) {
      console.log("Query parameters:", params);
    }
    
    // Execute the original query
    try {
      const result = await originalQuery(...args);
      console.log("------------------------------------------------------------");
      return result;
    } catch (error) {
      console.error("Query failed:", error);
      throw error;
    }
  };
  
  return promisePool;
};

// Create and export the logging pool
module.exports = createLoggingPool();