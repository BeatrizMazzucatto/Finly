const request = require("supertest");
const { createMockDb } = require("./helpers/mockDb");

const mockDb = createMockDb();

jest.mock("../database/connection", () => mockDb);

const app = require("../app");

beforeEach(() => mockDb.clearQueue());

describe("GET /carteiras/:id/limite", () => {
  it("retorna 404 para carteira inexistente", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app).get("/carteiras/99/limite");

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não encontrada/i);
  });

  it("retorna limite da carteira", async () => {
    mockDb.pushResult({ rows: [{ limite_gastos_mensal: 2000 }], rowCount: 1 });

    const res = await request(app).get("/carteiras/1/limite");

    expect(res.status).toBe(200);
    expect(res.body.limite).toBe(2000);
  });
});

describe("POST /carteiras", () => {
  it("retorna 400 sem nome ou id_usuario", async () => {
    const res = await request(app).post("/carteiras").send({ nome: "Família" });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it("cria carteira conjunta com código de convite", async () => {
    mockDb.pushResult({ rows: [{ id_carteira: 8 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const res = await request(app)
      .post("/carteiras")
      .send({ nome: "Família", id_usuario: 1, limite_gastos_mensal: 3000 });

    expect(res.status).toBe(201);
    expect(res.body.id_carteira).toBe(8);
    expect(res.body.codigo_convite).toMatch(/^JOIN-/);
  });
});

describe("POST /carteiras/entrar", () => {
  it("retorna 400 sem código ou id_usuario", async () => {
    const res = await request(app).post("/carteiras/entrar").send({ codigo_convite: "JOIN-ABC" });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it("retorna 404 para código inválido", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post("/carteiras/entrar")
      .send({ codigo_convite: "JOIN-INVALID", id_usuario: 2 });

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/inválido/i);
  });

  it("entra na carteira com sucesso", async () => {
    mockDb.pushResult({ rows: [{ id_carteira: 3 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const res = await request(app)
      .post("/carteiras/entrar")
      .send({ codigo_convite: "JOIN-ABC123", id_usuario: 2 });

    expect(res.status).toBe(200);
    expect(res.body.id_carteira).toBe(3);
  });
});

describe("DELETE /carteiras/:id", () => {
  it("deleta carteira e dependências", async () => {
    mockDb.pushResult({ rows: [], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const res = await request(app).delete("/carteiras/5");

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toMatch(/deletada/i);
  });
});
