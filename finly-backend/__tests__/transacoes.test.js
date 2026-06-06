const request = require("supertest");
const { createMockDb } = require("./helpers/mockDb");

const mockDb = createMockDb();

jest.mock("../database/connection", () => mockDb);

const app = require("../app");

beforeEach(() => mockDb.clearQueue());

describe("POST /transacoes", () => {
  it("retorna 400 quando campos obrigatórios faltam", async () => {
    const res = await request(app).post("/transacoes").send({ titulo: "Teste" });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it("retorna 400 para valor inválido", async () => {
    const res = await request(app).post("/transacoes").send({
      id_carteira: 1,
      id_usuario: 1,
      id_categoria: 1,
      titulo: "Teste",
      tipo: "DESPESA",
      valor: -10,
      data_transacao: "2024-06-01",
    });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/valor inválido/i);
  });

  it("retorna 400 para tipo inválido", async () => {
    const res = await request(app).post("/transacoes").send({
      id_carteira: 1,
      id_usuario: 1,
      id_categoria: 1,
      titulo: "Teste",
      tipo: "OUTRO",
      valor: 50,
      data_transacao: "2024-06-01",
    });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/RECEITA ou DESPESA/i);
  });

  it("cria transação com sucesso", async () => {
    mockDb.pushResult({ rows: [{ id_transacao: 42 }], rowCount: 1 });

    const res = await request(app).post("/transacoes").send({
      id_carteira: 1,
      id_usuario: 1,
      id_categoria: 2,
      titulo: "Mercado",
      tipo: "DESPESA",
      valor: 150,
      data_transacao: "2024-06-01",
    });

    expect(res.status).toBe(201);
    expect(res.body.id_transacao).toBe(42);
  });
});

describe("GET /transacoes/:id_usuario", () => {
  it("retorna lista vazia quando não há transações", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app).get("/transacoes/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("retorna transações do usuário", async () => {
    mockDb.pushResult({
      rows: [
        {
          id_transacao: 1,
          titulo: "Farmácia",
          tipo: "DESPESA",
          valor: 80,
          data_transacao: "2024-06-01",
          categoria: "Saúde",
        },
      ],
      rowCount: 1,
    });

    const res = await request(app).get("/transacoes/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].titulo).toBe("Farmácia");
  });
});

describe("PUT /transacoes/:id", () => {
  it("retorna 400 quando campos obrigatórios faltam", async () => {
    const res = await request(app).put("/transacoes/1").send({ titulo: "Só título" });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it("retorna 409 em conflito de concorrência", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app).put("/transacoes/5").send({
      titulo: "Editado",
      valor: 100,
      tipo: "DESPESA",
      data_transacao: "2024-06-01",
      updated_at: "2024-06-01T10:00:00Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/Conflito/i);
  });

  it("atualiza transação com sucesso", async () => {
    mockDb.pushResult({ rows: [{ id_transacao: 5 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const res = await request(app).put("/transacoes/5").send({
      titulo: "Editado",
      valor: 200,
      tipo: "DESPESA",
      data_transacao: "2024-06-02",
    });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toMatch(/atualizada/i);
  });
});

describe("DELETE /transacoes/:id", () => {
  it("retorna 404 quando transação não existe", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app).delete("/transacoes/99").send({ id_usuario: 1 });

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não encontrada/i);
  });

  it("exclui transação com sucesso", async () => {
    mockDb.pushResult({
      rows: [{ id_transacao: 7, titulo: "Teste", valor: 50, tipo: "DESPESA", id_carteira: 1, dono: 1 }],
      rowCount: 1,
    });
    mockDb.pushResult({ rows: [], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const res = await request(app).delete("/transacoes/7").send({ id_usuario: 1 });

    expect(res.status).toBe(200);
    expect(res.body.mensagem).toMatch(/excluída/i);
  });
});
