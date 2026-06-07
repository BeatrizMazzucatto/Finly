const request = require("supertest");
const bcrypt = require("bcrypt");
const { createMockDb } = require("./helpers/mockDb");

const mockDb = createMockDb();

jest.mock("../database/connection", () => mockDb);
jest.mock("bcrypt");

const app = require("../app");

beforeEach(() => {
  mockDb.clearQueue();
  jest.clearAllMocks();
});

describe("POST /usuarios/login", () => {

  it("retorna 400 sem email ou senha", async () => {
    const res = await request(app).post("/usuarios/login").send({ email: "a@b.com" });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it("retorna 401 para usuário inexistente", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post("/usuarios/login")
      .send({ email: "nao@existe.com", senha: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.erro).toMatch(/Credenciais inválidas/i);
  });

  it("retorna dados do usuário com senha válida", async () => {
    mockDb.pushResult({
      rows: [
        {
          id_usuario: 2,
          nome: "Maria",
          email: "maria@email.com",
          senha_hash: "hash",
          id_carteira_pessoal: 1,
          id_carteira_conjunta: 3,
        },
      ],
      rowCount: 1,
    });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post("/usuarios/login")
      .send({ email: "maria@email.com", senha: "123456" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id_usuario: 2,
      nome: "Maria",
      email: "maria@email.com",
      id_carteira_pessoal: 1,
      id_carteira_conjunta: 3,
    });
  });
});

describe("POST /usuarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue("hashed_password");
  });

  it("retorna 400 sem campos obrigatórios", async () => {
    const res = await request(app).post("/usuarios").send({ nome: "João" });

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/obrigatórios/i);
  });

  it("cria usuário com sucesso", async () => {
    mockDb.pushResult({ rows: [{ id_usuario: 10 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post("/usuarios")
      .send({ nome: "João", email: "joao@email.com", senha: "123456" });

    expect(res.status).toBe(201);
    expect(res.body.id_usuario).toBe(10);
    expect(bcrypt.hash).toHaveBeenCalled();
  });

  it("retorna 409 para email duplicado", async () => {
    const dupError = new Error("duplicate");
    dupError.code = "23505";
    mockDb.pushError(dupError);

    const res = await request(app)
      .post("/usuarios")
      .send({ nome: "João", email: "joao@email.com", senha: "123456" });

    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/já cadastrado/i);
  });
});

describe("POST /usuarios/:id/onboarding", () => {
  it("retorna 400 para renda inválida", async () => {
    const res = await request(app).post("/usuarios/1/onboarding").send({});

    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Renda mensal inválida/i);
  });

  it("retorna 404 para usuário inexistente", async () => {
    mockDb.pushResult({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post("/usuarios/99/onboarding")
      .send({ renda_mensal: 3000 });

    expect(res.status).toBe(404);
    expect(res.body.erro).toMatch(/não encontrado/i);
  });

  it("conclui onboarding com sucesso", async () => {
    mockDb.pushResult({ rows: [{ nome: "Lucas" }], rowCount: 1 });
    mockDb.pushResult({ rows: [{ id_carteira: 5 }], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });
    mockDb.pushResult({ rows: [], rowCount: 1 });

    const res = await request(app)
      .post("/usuarios/1/onboarding")
      .send({ renda_mensal: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.id_carteira).toBe(5);
    expect(res.body.mensagem).toMatch(/Onboarding concluído/i);
  });
});
