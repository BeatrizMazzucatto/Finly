CREATE DATABASE finly_db;
USE finly_db;

-- 1. Tabela de Usuários (US01 e US09)
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    renda_mensal_inicial DECIMAL(10, 2) DEFAULT 0.00,
    limite_gastos_mensal DECIMAL(10, 2) DEFAULT 0.00,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Categorias (US01  e US02)
CREATE TABLE categorias (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT, -- Pode ser NULL se for uma categoria padrão do sistema
    nome VARCHAR(50) NOT NULL,
    cor_hex VARCHAR(7), -- Ex: '#BDE0FE' (para o design visual do app)
    icone VARCHAR(50),  -- Nome do ícone (ex: 'fa-car')
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 3. Tabela de Transações (US02, US03, US04 e US05)
CREATE TABLE transacoes (
    id_transacao INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_categoria INT,
    titulo VARCHAR(100) NOT NULL, -- Ex: "Burger King", "Salário"
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
    valor DECIMAL(10, 2) NOT NULL, -- Validação de valor válido
    data_transacao DATE NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE SET NULL
);

-- Para outras Sprints 

-- 4. Tabela de Metas 
CREATE TABLE metas (
    id_meta INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    titulo VARCHAR(100) NOT NULL, -- Ex: "Reserva de Emergência"
    valor_alvo DECIMAL(10, 2) NOT NULL,
    valor_atual DECIMAL(10, 2) DEFAULT 0.00,
    data_limite DATE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- 5. Tabela de Alertas/Notificações
CREATE TABLE alertas (
    id_alerta INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    tipo_alerta VARCHAR(50), -- Ex: 'VENCIMENTO', 'LIMITE_ATINGIDO'
    lido BOOLEAN DEFAULT FALSE,
    data_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Seed para teste de login no app (backend atual compara senha em texto)
INSERT INTO usuarios (nome, email, senha_hash, renda_mensal_inicial, limite_gastos_mensal)
VALUES ('Julia', 'julia@gmail.com', '12345', 0.00, 0.00)
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  senha_hash = VALUES(senha_hash);