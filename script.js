// Navegação de Telas
function navTo(screenId, el) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    if (el) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }

    // Esconder Navbar no Onboarding
    const nav = document.getElementById('main-nav');
    if (screenId === 'screen-onboarding') {
        nav.style.display = 'none';
    } else {
        nav.style.display = 'flex';
    }
}

// Modal Nova Transação
function openSheet() {
    document.getElementById('sheet-new').classList.add('open');
    document.getElementById('sheet-overlay').classList.add('open');
}

function closeSheet() {
    document.getElementById('sheet-new').classList.remove('open');
    document.getElementById('sheet-overlay').classList.remove('open');
}

// Lógica do Toggle "Pessoal / Conjunto" no Modal de Nova Transação (US13)
function toggleTxContext(checkbox) {
    const title = document.getElementById('tx-context-title');
    const icon = document.getElementById('tx-context-icon');

    if (checkbox.checked) {
        title.innerText = "Lançamento Conjunto";
        icon.className = "fa-solid fa-users";
        icon.style.color = "var(--joint-primary)";
    } else {
        title.innerText = "Lançamento Pessoal";
        icon.className = "fa-solid fa-user";
        icon.style.color = "var(--primary-blue)";
    }
}

// Dados Mockados para as visões do Dashboard
const dataPersonal = {
    balance: "2.450,00",
    totalDespesas: "1.250",
    chartColor: "conic-gradient(var(--cat-alimentacao) 0% 40%, var(--cat-transporte) 40% 70%, var(--cat-saude) 70% 90%, var(--cat-lazer) 90% 100%)",
    cards: `
    <div class="cat-card" style="background: var(--cat-alimentacao);">
        <div class="cat-icon" style="background: white; color: var(--icon-alimentacao);"><i class="fa-solid fa-burger"></i></div>
        <div><b style="display:block; font-size: 15px;">Alimentação</b><small style="color: var(--text-gray); font-size: 12px;">R$ 500,00</small></div>
    </div>
    <div class="cat-card" style="background: var(--cat-transporte);">
        <div class="cat-icon" style="background: white; color: var(--icon-transporte);"><i class="fa-solid fa-car"></i></div>
        <div><b style="display:block; font-size: 15px;">Transporte</b><small style="color: var(--text-gray); font-size: 12px;">R$ 375,00</small></div>
    </div>
    <div class="cat-card" style="background: var(--cat-saude);">
        <div class="cat-icon" style="background: white; color: var(--icon-saude);"><i class="fa-solid fa-pills"></i></div>
        <div><b style="display:block; font-size: 15px;">Saúde</b><small style="color: var(--text-gray); font-size: 12px;">R$ 250,00</small></div>
    </div>
`,
    txs: `
    <div class="tx-item">
        <div class="tx-icon" style="background: var(--cat-alimentacao); color: var(--icon-alimentacao);"><i class="fa-solid fa-burger"></i></div>
        <div class="tx-info"><b>Burger King</b><small>Alimentação • 14:20</small></div>
        <div class="tx-value negative">- R$ 42,00</div>
    </div>
    <div class="tx-item">
        <div class="tx-icon" style="background: var(--cat-transporte); color: var(--icon-transporte);"><i class="fa-solid fa-gas-pump"></i></div>
        <div class="tx-info"><b>Posto Shell</b><small>Transporte • Ontem</small></div>
        <div class="tx-value negative">- R$ 150,00</div>
    </div>
`
};

const dataJoint = {
    balance: "1.180,00",
    totalDespesas: "1.820",
    chartColor: "conic-gradient(var(--joint-primary) 0% 50%, var(--cat-joint-1) 50% 80%, var(--cat-joint-3) 80% 100%)",
    cards: `
    <div class="cat-card" style="background: var(--cat-joint-1);">
        <div class="cat-icon" style="background: white; color: var(--joint-primary);"><i class="fa-solid fa-cart-shopping"></i></div>
        <div><b style="display:block; font-size: 15px;">Supermercado</b><small style="color: var(--text-gray); font-size: 12px;">R$ 910,00</small></div>
    </div>
    <div class="cat-card" style="background: var(--cat-joint-2);">
        <div class="cat-icon" style="background: white; color: var(--joint-primary);"><i class="fa-solid fa-house"></i></div>
        <div><b style="display:block; font-size: 15px;">Aluguel</b><small style="color: var(--text-gray); font-size: 12px;">R$ 546,00</small></div>
    </div>
    <div class="cat-card" style="background: var(--cat-joint-3);">
        <div class="cat-icon" style="background: white; color: var(--joint-primary);"><i class="fa-solid fa-bolt"></i></div>
        <div><b style="display:block; font-size: 15px;">Contas</b><small style="color: var(--text-gray); font-size: 12px;">R$ 364,00</small></div>
    </div>
`,
    txs: `
    <div class="tx-item">
        <div class="tx-icon" style="background: var(--joint-bg-light); color: var(--joint-primary);"><i class="fa-solid fa-cart-shopping"></i></div>
        <div class="tx-info">
            <div style="display: flex; justify-content: space-between; align-items: center;"><b>Carrefour</b><span class="badge-joint">CONJUNTO</span></div>
            <small><img src="https://ui-avatars.com/api/?name=Maria&background=9333EA&color=fff" class="avatar-mini"> Maria • Hoje</small>
        </div>
        <div class="tx-value negative">- R$ 450,00</div>
    </div>
    <div class="tx-item">
        <div class="tx-icon" style="background: var(--joint-bg-light); color: var(--joint-primary);"><i class="fa-solid fa-bolt"></i></div>
        <div class="tx-info">
            <div style="display: flex; justify-content: space-between; align-items: center;"><b>Conta de Luz</b><span class="badge-joint">CONJUNTO</span></div>
            <small><img src="https://ui-avatars.com/api/?name=Lucas&background=9333EA&color=fff" class="avatar-mini"> Lucas • Ontem</small>
        </div>
        <div class="tx-value negative">- R$ 180,00</div>
    </div>
`
};

// Lógica do Toggle "Minha Carteira / Conjunta" no Dashboard (US14)
function toggleWallet(mode) {
    const btnPersonal = document.getElementById('btn-personal');
    const btnJoint = document.getElementById('btn-joint');
    const ring = document.getElementById('main-chart');

    if (mode === 'personal') {
        btnPersonal.className = 'active-personal';
        btnJoint.className = '';
        btnJoint.style.color = "var(--text-gray)";

        document.getElementById('balance-label').innerText = "Saldo Pessoal";
        document.getElementById('balance-value').innerHTML = "<span>R$</span> " + dataPersonal.balance;
        document.getElementById('chart-total').innerText = "R$ " + dataPersonal.totalDespesas;
        ring.style.background = dataPersonal.chartColor;
        document.getElementById('category-cards').innerHTML = dataPersonal.cards;
        document.getElementById('recent-transactions').innerHTML = dataPersonal.txs;

    } else {
        btnJoint.className = 'active-joint';
        btnPersonal.className = '';

        document.getElementById('balance-label').innerText = "Saldo Conjunto";
        document.getElementById('balance-value').innerHTML = "<span>R$</span> " + dataJoint.balance;
        document.getElementById('chart-total').innerText = "R$ " + dataJoint.totalDespesas;
        ring.style.background = dataJoint.chartColor;
        document.getElementById('category-cards').innerHTML = dataJoint.cards;
        document.getElementById('recent-transactions').innerHTML = dataJoint.txs;
    }
}

// Iniciar na tela de dashboard com visão pessoal
window.onload = () => {
    // Inicializa dados do dashboard
    toggleWallet('personal');
    // Apenas para demo do fluxo começar no onboarding
    navTo('screen-onboarding');
};
