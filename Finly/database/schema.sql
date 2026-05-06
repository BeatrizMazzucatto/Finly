CREATE DATABASE IF NOT EXISTS finly_db;
USE finly_db;

-- TABELAS
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carteiras (
    id_carteira INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255),
    tipo ENUM('PESSOAL', 'CONJUNTA') DEFAULT 'PESSOAL',
    limite_gastos_mensal DECIMAL(10, 2) DEFAULT 0.00,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios_carteiras (
    id_usuario INT NOT NULL,
    id_carteira INT NOT NULL,
    papel ENUM('PROPRIETARIO', 'MEMBRO') DEFAULT 'PROPRIETARIO',
    renda_mensal_alocada DECIMAL(10, 2) DEFAULT 0.00,
    data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_carteira),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_carteira) REFERENCES carteiras(id_carteira) ON DELETE CASCADE
);

CREATE TABLE categorias (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    id_carteira INT NULL,
    nome VARCHAR(50) NOT NULL,
    cor_hex VARCHAR(7) DEFAULT '#CCCCCC',
    icone VARCHAR(50) DEFAULT 'fa-circle',
    FOREIGN KEY (id_carteira) REFERENCES carteiras(id_carteira) ON DELETE CASCADE
);

CREATE TABLE transacoes (
    id_transacao INT PRIMARY KEY AUTO_INCREMENT,
    id_carteira INT NOT NULL,
    id_usuario INT NOT NULL,
    id_categoria INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    tipo ENUM('RECEITA', 'DESPESA') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    status ENUM('PAGO', 'PENDENTE') DEFAULT 'PAGO',
    forma_pagamento VARCHAR(50),
    data_transacao DATE NOT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carteira) REFERENCES carteiras(id_carteira) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT
);

CREATE TABLE metas (
    id_meta INT PRIMARY KEY AUTO_INCREMENT,
    id_carteira INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_alvo DECIMAL(10, 2) NOT NULL CHECK (valor_alvo > 0),
    valor_atual DECIMAL(10, 2) DEFAULT 0.00,
    data_limite DATE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_carteira) REFERENCES carteiras(id_carteira) ON DELETE CASCADE
);

CREATE TABLE alertas (
    id_alerta INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    tipo ENUM('VENCIMENTO', 'LIMITE_ATINGIDO', 'SISTEMA', 'CONVITE_CARTEIRA') NOT NULL,
    lido BOOLEAN DEFAULT FALSE,
    data_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- ÍNDICES
CREATE INDEX idx_transacoes_carteira_data ON transacoes(id_carteira, data_transacao DESC);
CREATE INDEX idx_transacoes_carteira_categoria ON transacoes(id_carteira, id_categoria);
CREATE INDEX idx_alertas_usuario_lido ON alertas(id_usuario, lido);

-- CATEGORIAS PADRÃO
INSERT INTO categorias (id_carteira, nome, cor_hex, icone) VALUES 
(NULL, 'Alimentação', '#FF6B6B', 'fa-utensils'),
(NULL, 'Mercado', '#FF8787', 'fa-shopping-cart'),
(NULL, 'Moradia', '#6BCB77', 'fa-home'),
(NULL, 'Contas Residenciais', '#4E9F3D', 'fa-file-invoice-dollar'),
(NULL, 'Transporte', '#4D96FF', 'fa-bus'),
(NULL, 'Combustível', '#2B4865', 'fa-gas-pump'),
(NULL, 'Saúde', '#FF4A4A', 'fa-heartbeat'),
(NULL, 'Farmácia', '#F2789F', 'fa-pills'),
(NULL, 'Educação', '#FCA652', 'fa-graduation-cap'),
(NULL, 'Lazer e Diversão', '#9D4EDD', 'fa-theater-masks'),
(NULL, 'Bares e Restaurantes', '#C77DFF', 'fa-glass-cheers'),
(NULL, 'Assinaturas e TV', '#E0B0FF', 'fa-tv'),
(NULL, 'Vestuário', '#FFD166', 'fa-tshirt'),
(NULL, 'Beleza e Cuidados', '#FF9F1C', 'fa-cut'),
(NULL, 'Pets', '#8D99AE', 'fa-paw'),
(NULL, 'Viagem', '#06D6A0', 'fa-plane'),
(NULL, 'Salário', '#118AB2', 'fa-money-check-alt'),
(NULL, 'Investimentos', '#073B4C', 'fa-chart-line'),
(NULL, 'Renda Extra', '#2A9D8F', 'fa-hand-holding-usd'),
(NULL, 'Transferências', '#7B2CBF', 'fa-exchange-alt');

-- USUÁRIOS
INSERT INTO usuarios (id_usuario, nome, email, senha_hash) VALUES 
(1, 'Julia', 'julia@finly.com', 'hash_senha_123'),
(2, 'Carlos', 'carlos@finly.com', 'hash_senha_123'),
(3, 'Beatriz Teste', 'beatriz@finly.com', '123456');

-- CARTEIRAS
INSERT INTO carteiras (id_carteira, nome, tipo, limite_gastos_mensal) VALUES 
(1, 'Pessoal - Julia', 'PESSOAL', 2000.00),
(2, 'Pessoal - Carlos', 'PESSOAL', 1500.00),
(3, 'Despesas da Casa', 'CONJUNTA', 5000.00),
(4, 'Pessoal - Beatriz', 'PESSOAL', 1000.00);

-- VÍNCULOS
INSERT INTO usuarios_carteiras (id_usuario, id_carteira, papel, renda_mensal_alocada) VALUES 
(1, 1, 'PROPRIETARIO', 3000.00),
(2, 2, 'PROPRIETARIO', 4000.00),
(1, 3, 'PROPRIETARIO', 2500.00),
(2, 3, 'MEMBRO', 2500.00),
(3, 4, 'PROPRIETARIO', 2500.00);

-- TRANSAÇÕES JULIA
INSERT INTO transacoes (id_carteira, id_usuario, id_categoria, titulo, tipo, valor, data_transacao) VALUES
(1, 1, 17, 'Salário Maio', 'RECEITA', 3000.00, '2026-05-01'),
(1, 1, 1,  'Supermercado', 'DESPESA', 320.50, '2026-05-03'),
(1, 1, 5,  'Uber', 'DESPESA', 35.00, '2026-05-04'),
(1, 1, 7,  'Farmácia', 'DESPESA', 89.90, '2026-05-04'),
(1, 1, 12, 'Spotify', 'DESPESA', 21.90, '2026-05-05');

-- TRANSAÇÕES BEATRIZ
INSERT INTO transacoes (id_carteira, id_usuario, id_categoria, titulo, tipo, valor, data_transacao) VALUES
(4, 3, 17, 'Salário Abril', 'RECEITA', 2500.00, '2026-04-01'),
(4, 3, 19, 'Freelance Site', 'RECEITA', 800.00, '2026-04-10'),
(4, 3, 1,  'Supermercado', 'DESPESA', 350.00, '2026-04-05'),
(4, 3, 5,  'Uber', 'DESPESA', 120.00, '2026-04-06'),
(4, 3, 3,  'Aluguel', 'DESPESA', 900.00, '2026-04-03'),
(4, 3, 10, 'Cinema', 'DESPESA', 80.00, '2026-04-08'),
(4, 3, 8,  'Farmácia', 'DESPESA', 60.00, '2026-04-09'),
(4, 3, 9,  'Curso online', 'DESPESA', 150.00, '2026-04-12');

SELECT * FROM transacoes ORDER BY id_transacao DESC LIMIT 5;