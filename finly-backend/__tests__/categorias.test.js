const request = require("supertest");
const { createMockDb } = require("./helpers/mockDb");

const mockDb = createMockDb();

jest.mock("../database/connection", () => mockDb);

const app = require("../app");

beforeEach(() => mockDb.clearQueue());

describe("GET /categorias", () => {
  it("retorna lista de categorias", async () => {
    mockDb.pushResult({
      rows: [{ id_categoria: 1, nome: "Alimentação", cor_hex: "#F59E0B", icone: "coffee" }],
      rowCount: 1,
    });

    const res = await request(app).get("/categorias");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nome).toBe("Alimentação");
  });

  it("retorna array vazio quando não há categorias", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app).get("/categorias");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("POST /categorias", () => {
  it("retorna 400 sem campos obrigatórios", async () => {
    const res = await request(app).post("/categorias").send({ nome: "Viagem" });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it("cria categoria com sucesso", async () => {
    mockDb.pushResult({
      rows: [{ id_categoria: 20, nome: "Viagem", cor_hex: "#3B82F6", icone: "map" }],
      rowCount: 1,
    });

    const res = await request(app).post("/categorias").send({
      nome: "Viagem",
      icone: "map",
      cor_hex: "#3B82F6",
    });

    expect(res.status).toBe(201);
    expect(res.body.nome).toBe("Viagem");
  });

  it("retorna 409 para categoria duplicada", async () => {
    const dupError = new Error("duplicate");
    dupError.code = "23505";
    mockDb.pushError(dupError);

    const res = await request(app).post("/categorias").send({
      nome: "Viagem",
      icone: "map",
      cor_hex: "#3B82F6",
    });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/já existe/i);
  });
});

describe("GET /categorias/:id_carteira", () => {
  it("retorna categorias da carteira", async () => {
    mockDb.pushResult({
      rows: [
        { id_categoria: 1, nome: "Alimentação", cor_hex: "#F59E0B", icone: "coffee" },
        { id_categoria: 15, nome: "Personalizada", cor_hex: "#000", icone: "tag" },
      ],
      rowCount: 2,
    });

    const res = await request(app).get("/categorias/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
