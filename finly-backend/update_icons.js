const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres.lfevhjfwicqxqagrlxws:Y3FkvdFiymFRgpwj@aws-1-us-west-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

const mapIcons = {
  "fa-utensils": "coffee",
  "fa-shopping-cart": "shopping-cart",
  "fa-home": "home",
  "fa-file-invoice-dollar": "file-text",
  "fa-bus": "truck",
  "fa-gas-pump": "droplet",
  "fa-heartbeat": "heart",
  "fa-pills": "plus-square",
  "fa-graduation-cap": "book",
  "fa-theater-masks": "film",
  "fa-glass-cheers": "coffee",
  "fa-tv": "tv",
  "fa-tshirt": "shopping-bag",
  "fa-cut": "scissors",
  "fa-paw": "smile",
  "fa-plane": "navigation",
  "fa-money-check-alt": "dollar-sign",
  "fa-chart-line": "trending-up",
  "fa-hand-holding-usd": "award",
  "fa-exchange-alt": "repeat"
};

async function updateIcons() {
  const client = await pool.connect();
  try {
    for (const [faIcon, featherIcon] of Object.entries(mapIcons)) {
      await client.query("UPDATE categorias SET icone = $1 WHERE icone = $2", [featherIcon, faIcon]);
    }
    console.log("Ícones atualizados com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar ícones:", error);
  } finally {
    client.release();
    pool.end();
  }
}

updateIcons();
