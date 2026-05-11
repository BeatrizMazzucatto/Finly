const { Pool } = require("pg");

// Configurando o Pool para o Supabase (PostgreSQL)
const pool = new Pool({
  connectionString: "postgres://postgres:Y3FkvdFiymFRgpwj@db.lfevhjfwicqxqagrlxws.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Testando a conexão
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Erro ao conectar no PostgreSQL (Supabase):", err.message);
  }
  console.log("Conectado ao Supabase (PostgreSQL)!");
  release();
});

module.exports = pool;