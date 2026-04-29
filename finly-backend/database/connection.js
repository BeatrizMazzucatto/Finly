const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "senha",
  database: "finly_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err.message);
    return;
  }
  console.log("MySQL conectado!");
  connection.release();
});

module.exports = pool;