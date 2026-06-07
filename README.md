# 📱 Finly

<div align="center">

![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-54.0.33-black?style=for-the-badge&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql)

**Aplicativo mobile de controle financeiro pessoal**

[Funcionalidades](#-funcionalidades) • [Tecnologias](#-tecnologias) • [Instalação](#-instalação) • [Banco de Dados](#-banco-de-dados) • [Paleta de Cores](#-paleta-de-cores)

</div>

---

## 📋 Sobre o Projeto

O **Finly** é um aplicativo mobile de controle financeiro pessoal desenvolvido com **React Native (Expo)** no frontend e **Node.js/Express** no backend. O projeto foi estruturado seguindo a arquitetura **MVVM (Model-View-ViewModel)**, garantindo uma separação limpa e escalável entre a interface de usuário (UI), a lógica de negócios e o gerenciamento de estado.

### 🎯 Objetivo

Fornecer uma solução robusta, leve e acessível para gestão das finanças pessoais, com suporte a:

- 📊 Dashboard com visão geral do saldo e gastos por categoria
- 💳 Múltiplas carteiras, incluindo carteiras conjuntas sincronizadas em tempo real
- 💸 Registro de receitas e despesas com gerenciamento dinâmico de categorias
- 📈 Estatísticas e gráficos detalhados
- 🔐 Autenticação, sessão persistente e componentes nativos otimizados

---

## ✨ Funcionalidades

<table>
<tr>
<td width="50%">

### 📊 Dashboard

- ✅ Visão geral do saldo atual
- ✅ Gráfico de gastos por categoria (donut chart)
- ✅ Listagem de transações recentes
- ✅ Navegação rápida entre seções

### 💸 Transações

- ✅ Cadastro de despesas e receitas
- ✅ Seleção de categoria
- ✅ Vinculação a carteiras
- ✅ Histórico completo com filtros

</td>
<td width="50%">

### 📈 Estatísticas

- ✅ Gráficos de barras e linha
- ✅ Ranking de categorias
- ✅ Análise por período

### 👥 Grupos

- ✅ Carteira conjunta compartilhada
- ✅ Visão consolidada entre usuários
- ✅ Histórico de transações do grupo

</td>
</tr>
</table>

### 🔐 Autenticação

- ✅ Login via e-mail e senha
- ✅ Sessão persistente com AsyncStorage
- ✅ Tela de onboarding para novos usuários
- ✅ Logout e gerenciamento de conta

---

## 🛠 Tecnologias

### Frontend

<div align="center">

| Tecnologia | Versão |
|---|---|
| React Native | 0.81.5 |
| Expo | ~54.0.33 |
| Expo Router | ~6.0.23 |
| TypeScript | — |
| react-native-gifted-charts | — |
| React Navigation (Bottom Tabs) | — |
| date-fns | — |
| AsyncStorage | — |

</div>

### Backend

<div align="center">

| Tecnologia | Versão |
|---|---|
| Node.js + Express | 5.2.1 |
| PostgreSQL (Supabase) | — |
| pg (driver) | 8.20.0 |
| cors | 2.8.6 |

</div>

---

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

```bash
# Node.js 18 ou superior
node -v

# npm ou yarn
npm -v

# Expo CLI
npm install -g expo-cli

# Emulador Android/iOS ou dispositivo físico com Expo Go
```

---

## 🚀 Instalação

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/seu-usuario/finly.git
cd finly
```

### 2️⃣ Configure as variáveis de ambiente

Crie um arquivo `.env` na pasta `Finly/`:

```env
EXPO_PUBLIC_API_URL=http://<SEU_IP_LOCAL>:3000
```

> ⚠️ **Dica para rodar no Celular Físico:** Para rodar o app no seu celular usando o **Expo Go**, certifique-se de que o computador e o celular estão no mesmo Wi-Fi. O backend já está configurado para ouvir conexões externas (`0.0.0.0`). Substitua `<SEU_IP_LOCAL>` pelo IP da sua máquina na rede (ex: `192.168.0.x`).

### 3️⃣ Instale as dependências e rode o projeto

---

## 💻 Como Usar

### 🖥️ Backend

```bash
cd finly-backend
npm install
node app.js
```

O servidor sobe na porta **3000**.

### 📱 Frontend

```bash
cd Finly
npm install
npm start
```

Escolha a plataforma no menu do Expo:

| Plataforma | Comando |
|---|---|
| Android | `npm run android` |
| iOS | `npm run ios` |
| Web | `npm run web` |

### 📲 Fluxo de Uso

1. **🔐 Autenticação**
   - Criar uma nova conta no onboarding
   - Login com e-mail e senha

2. **📋 Dashboard**
   - Visualize saldo e gastos por categoria
   - Acesse transações recentes

3. **💸 Nova Transação**
   - Registre receitas ou despesas
   - Selecione categoria e carteira

4. **📊 Estatísticas**
   - Explore gráficos de barras e linha
   - Veja o ranking de categorias por período

---

## 📁 Estrutura do Projeto (Arquitetura MVVM)

```
Finly/
├── 📂 Finly/                        # Frontend React Native
│   ├── app/                         # Rotas e Views (UI)
│   │   ├── (tabs)/                  # Telas principais (Dashboard, Histórico, etc.)
│   │   ├── login.tsx                # Tela de login
│   │   ├── onboarding.tsx           # Onboarding inicial
│   │   └── transaction-form.tsx     # Formulário de transação
│   ├── components/                  # Componentes Visuais Isolados
│   │   ├── ui/                      # Base (Button, Input, Avatar Nativo)
│   │   ├── CategoryManagerModal.tsx # Modal de Gerenciamento de Categorias
│   │   └── TransactionModal.tsx
│   ├── src/
│   │   ├── viewmodels/              # Lógica de Negócios e Estado (MVVM)
│   │   │   ├── useDashboardViewModel.ts
│   │   │   ├── useHistoryViewModel.ts
│   │   │   ├── useGroupsViewModel.ts
│   │   │   └── useSettingsViewModel.ts
│   │   ├── models/                  # Tipagens e Interfaces de Dados
│   │   ├── services/                # Configuração do Axios e Rotas API
│   │   └── context/                 # Contextos globais (AuthContext)
│   └── constants/                   # Cores, espaçamentos, categorias padrão
│
└── 📂 finly-backend/                # Backend Node.js
    ├── app.js                       # Servidor (0.0.0.0 para acesso mobile)
    ├── database/connection.js
    └── routes/                      # Endpoints da API REST
        ├── usuarios.js
        ├── transacoes.js
        ├── categorias.js
        └── carteiras.js
```

---

## 🗄 Banco de Dados

O projeto usa **PostgreSQL** hospedado no **Supabase**.

<div align="center">

| Tabela | Descrição |
|---|---|
| `usuarios` | Contas de usuário |
| `carteiras` | Carteiras pessoais e conjuntas |
| `transacoes` | Transações financeiras (RECEITA / DESPESA) |
| `categorias` | Categorias de transações |
| `usuarios_carteiras` | Vínculo entre usuários e carteiras |

</div>

---

## 🧪 Testes

```bash
cd Finly
npm test
```

Testes unitários com **Jest** e **@testing-library/react-native** cobrindo contextos, utilitários e componentes principais.

---

## 🎨 Paleta de Cores

<div align="center">

| Uso | Cor | Hex |
|---|---|---|
| Primária | 🟣 Índigo | `#4F46E5` |
| Receita | 🟢 Verde | `#10B981` |
| Despesa | 🔴 Vermelho | `#EF4444` |
| Conjunta | 🟣 Roxo | `#9333EA` |
| Texto principal | ⚫ Escuro | `#0F172A` |
| Texto secundário | 🔘 Cinza | `#64748B` |

</div>

---

## 📜 Scripts Disponíveis

<details>
<summary><b>📱 Frontend (pasta Finly/)</b></summary>

```bash
npm start          # Inicia o servidor Expo
npm run android    # Abre no emulador Android
npm run ios        # Abre no simulador iOS
npm run web        # Abre no navegador
npm test           # Roda os testes
npm run lint       # Verifica o código com ESLint
```

</details>

<details>
<summary><b>🖥️ Backend (pasta finly-backend/)</b></summary>

```bash
npm start          # Inicia o servidor Express
npm run dev        # Inicia com nodemon (watch mode)
```

</details>

---

## 👥 Autores

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/analayslla">
        <img src="https://github.com/analayslla.png" width="100px;" alt="Ana Layslla"/><br>
        <sub><b>Ana Layslla</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/annakitice">
        <img src="https://github.com/annakitice.png" width="100px;" alt="Anna Kitice"/><br>
        <sub><b>Anna Kitice</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/BeatrizMazzucatto">
        <img src="https://github.com/BeatrizMazzucatto.png" width="100px;" alt="Beatriz Mazzucatto"/><br>
        <sub><b>Beatriz Mazzucatto</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/juliagarciac">
        <img src="https://github.com/juliagarciac.png" width="100px;" alt="Julia Garcia"/><br>
        <sub><b>Julia Garcia</b></sub>
      </a>
    </td>
  </tr>
</table>

---

<div align="center">

⭐ **Se este projeto foi útil, considere dar uma estrela!** ⭐

</div>
