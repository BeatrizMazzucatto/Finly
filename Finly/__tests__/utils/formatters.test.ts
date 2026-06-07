import {
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatDateShort,
  formatDateRelative,
  getGreeting,
  getCurrentMonthYear,
  parseMoneyInput,
  formatMoneyInput,
} from '@/utils/formatters';

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formata zero corretamente', () => {
    expect(formatCurrency(0)).toBe('R$\u00a00,00');
  });

  it('formata valor inteiro', () => {
    expect(formatCurrency(1500)).toBe('R$\u00a01.500,00');
  });

  it('formata valor com centavos', () => {
    expect(formatCurrency(99.9)).toBe('R$\u00a099,90');
  });

  it('formata valor negativo', () => {
    expect(formatCurrency(-250.5)).toBe('-R$\u00a0250,50');
  });

  it('formata valor grande (1 milhão)', () => {
    expect(formatCurrency(1000000)).toBe('R$\u00a01.000.000,00');
  });

  it('formata centavos mínimos', () => {
    expect(formatCurrency(0.01)).toBe('R$\u00a00,01');
  });

  it('arredonda corretamente valores com muitas casas decimais', () => {
    expect(formatCurrency(1.999)).toBe('R$\u00a02,00');
  });
});

// ─── formatCurrencyShort ──────────────────────────────────────────────────────

describe('formatCurrencyShort', () => {
  it('exibe valor em milhões com sufixo M', () => {
    expect(formatCurrencyShort(2500000)).toBe('R$ 2.5M');
  });

  it('exibe valor exatamente em 1 milhão', () => {
    expect(formatCurrencyShort(1000000)).toBe('R$ 1.0M');
  });

  it('exibe valor em milhares com sufixo k', () => {
    expect(formatCurrencyShort(3500)).toBe('R$ 3.5k');
  });

  it('exibe valor exatamente em 1000', () => {
    expect(formatCurrencyShort(1000)).toBe('R$ 1.0k');
  });

  it('exibe formato completo para valores menores que 1000', () => {
    expect(formatCurrencyShort(500)).toBe('R$\u00a0500,00');
  });

  it('exibe formato completo para zero', () => {
    expect(formatCurrencyShort(0)).toBe('R$\u00a00,00');
  });

  it('não aplica sufixo para 999', () => {
    expect(formatCurrencyShort(999)).toBe('R$\u00a0999,00');
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('retorna string vazia para entrada vazia', () => {
    expect(formatDate('')).toBe('');
  });

  it('formata data ISO para DD/MM/AAAA', () => {
    expect(formatDate('2024-05-13')).toBe('13/05/2024');
  });

  it('formata data com dia e mês de um dígito', () => {
    expect(formatDate('2024-01-05')).toBe('05/01/2024');
  });

  it('formata último dia do ano', () => {
    expect(formatDate('2024-12-31')).toBe('31/12/2024');
  });

  it('formata primeiro dia do ano', () => {
    expect(formatDate('2024-01-01')).toBe('01/01/2024');
  });
});

// ─── formatDateShort ──────────────────────────────────────────────────────────

describe('formatDateShort', () => {
  it('retorna string vazia para entrada vazia', () => {
    expect(formatDateShort('')).toBe('');
  });

  it('formata mês de janeiro', () => {
    expect(formatDateShort('2024-01-01')).toBe('01 Jan');
  });

  it('formata mês de fevereiro', () => {
    expect(formatDateShort('2024-02-14')).toBe('14 Fev');
  });

  it('formata mês de março', () => {
    expect(formatDateShort('2024-03-15')).toBe('15 Mar');
  });

  it('formata mês de abril', () => {
    expect(formatDateShort('2024-04-10')).toBe('10 Abr');
  });

  it('formata mês de maio', () => {
    expect(formatDateShort('2024-05-13')).toBe('13 Mai');
  });

  it('formata mês de junho', () => {
    expect(formatDateShort('2024-06-20')).toBe('20 Jun');
  });

  it('formata mês de julho', () => {
    expect(formatDateShort('2024-07-04')).toBe('04 Jul');
  });

  it('formata mês de agosto', () => {
    expect(formatDateShort('2024-08-10')).toBe('10 Ago');
  });

  it('formata mês de setembro', () => {
    expect(formatDateShort('2024-09-01')).toBe('01 Set');
  });

  it('formata mês de outubro', () => {
    expect(formatDateShort('2024-10-31')).toBe('31 Out');
  });

  it('formata mês de novembro', () => {
    expect(formatDateShort('2024-11-11')).toBe('11 Nov');
  });

  it('formata mês de dezembro', () => {
    expect(formatDateShort('2024-12-25')).toBe('25 Dez');
  });
});

// ─── formatDateRelative ───────────────────────────────────────────────────────

describe('formatDateRelative', () => {
  const RealDate = global.Date;

  function mockNow(isoStr: string) {
    const fixed = new RealDate(isoStr);
    jest.spyOn(global, 'Date').mockImplementation((arg?: any) =>
      arg === undefined ? (new RealDate(isoStr) as any) : (new RealDate(arg) as any)
    );
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retorna "Hoje" para a data de hoje', () => {
    mockNow('2024-06-01T12:00:00');
    expect(formatDateRelative('2024-06-01')).toBe('Hoje');
  });

  it('retorna "Ontem" para ontem', () => {
    mockNow('2024-06-02T12:00:00');
    expect(formatDateRelative('2024-06-01')).toBe('Ontem');
  });

  it('retorna "3 dias atrás" para 3 dias antes', () => {
    mockNow('2024-06-05T12:00:00');
    expect(formatDateRelative('2024-06-02')).toBe('3 dias atrás');
  });

  it('retorna "1 semanas atrás" para 7 dias', () => {
    mockNow('2024-06-08T12:00:00');
    expect(formatDateRelative('2024-06-01')).toBe('1 semanas atrás');
  });

  it('retorna "3 semanas atrás" para 21 dias', () => {
    mockNow('2024-06-22T12:00:00');
    expect(formatDateRelative('2024-06-01')).toBe('3 semanas atrás');
  });

  it('retorna formatDateShort para datas com mais de 30 dias', () => {
    mockNow('2024-08-01T12:00:00');
    expect(formatDateRelative('2024-06-01')).toBe('01 Jun');
  });
});

// ─── getGreeting ──────────────────────────────────────────────────────────────

describe('getGreeting', () => {
  const RealDate = global.Date;

  function mockHour(hour: number) {
    const iso = `2024-06-01T${String(hour).padStart(2, '0')}:00:00`;
    jest.spyOn(global, 'Date').mockImplementation((arg?: any) =>
      arg === undefined ? (new RealDate(iso) as any) : (new RealDate(arg) as any)
    );
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retorna "Bom dia" às 0h (meia-noite)', () => {
    mockHour(0);
    expect(getGreeting()).toBe('Bom dia');
  });

  it('retorna "Bom dia" às 6h', () => {
    mockHour(6);
    expect(getGreeting()).toBe('Bom dia');
  });

  it('retorna "Bom dia" às 11h', () => {
    mockHour(11);
    expect(getGreeting()).toBe('Bom dia');
  });

  it('retorna "Boa tarde" às 12h', () => {
    mockHour(12);
    expect(getGreeting()).toBe('Boa tarde');
  });

  it('retorna "Boa tarde" às 17h', () => {
    mockHour(17);
    expect(getGreeting()).toBe('Boa tarde');
  });

  it('retorna "Boa noite" às 18h', () => {
    mockHour(18);
    expect(getGreeting()).toBe('Boa noite');
  });

  it('retorna "Boa noite" às 23h', () => {
    mockHour(23);
    expect(getGreeting()).toBe('Boa noite');
  });
});

// ─── getCurrentMonthYear ──────────────────────────────────────────────────────

describe('getCurrentMonthYear', () => {
  const RealDate = global.Date;

  function mockMonth(isoStr: string) {
    jest.spyOn(global, 'Date').mockImplementation((arg?: any) =>
      arg === undefined ? (new RealDate(isoStr) as any) : (new RealDate(arg) as any)
    );
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retorna string não vazia', () => {
    expect(getCurrentMonthYear()).toBeTruthy();
  });

  it('retorna "Janeiro 2024" para janeiro de 2024', () => {
    mockMonth('2024-01-15T12:00:00');
    expect(getCurrentMonthYear()).toBe('Janeiro 2024');
  });

  it('retorna "Fevereiro 2024" para fevereiro de 2024', () => {
    mockMonth('2024-02-10T12:00:00');
    expect(getCurrentMonthYear()).toBe('Fevereiro 2024');
  });

  it('retorna "Junho 2024" para junho de 2024', () => {
    mockMonth('2024-06-01T12:00:00');
    expect(getCurrentMonthYear()).toBe('Junho 2024');
  });

  it('retorna "Dezembro 2024" para dezembro de 2024', () => {
    mockMonth('2024-12-15T12:00:00');
    expect(getCurrentMonthYear()).toBe('Dezembro 2024');
  });

  it('contém o ano correto', () => {
    const year = new Date().getFullYear();
    expect(getCurrentMonthYear()).toContain(String(year));
  });
});

// ─── parseMoneyInput ──────────────────────────────────────────────────────────

describe('parseMoneyInput', () => {
  it('retorna 0 para string vazia', () => {
    expect(parseMoneyInput('')).toBe(0);
  });

  it('parseia valor com vírgula como separador decimal', () => {
    expect(parseMoneyInput('1500,50')).toBe(1500.5);
  });

  it('parseia valor simples inteiro', () => {
    expect(parseMoneyInput('250')).toBe(250);
  });

  it('remove prefixo "R$ " e parseia', () => {
    expect(parseMoneyInput('R$ 1500,00')).toBe(1500);
  });

  it('retorna 0 para string de letras apenas', () => {
    expect(parseMoneyInput('abc')).toBe(0);
  });

  it('retorna 0 para entrada só de símbolos', () => {
    expect(parseMoneyInput('---')).toBe(0);
  });

  it('parseia valor com ponto como separador decimal', () => {
    expect(parseMoneyInput('1500.50')).toBe(1500.5);
  });

  it('parseia zero', () => {
    expect(parseMoneyInput('0')).toBe(0);
  });

  it('parseia valor com espaços', () => {
    expect(parseMoneyInput('  100  ')).toBe(100);
  });
});

// ─── formatMoneyInput ─────────────────────────────────────────────────────────

describe('formatMoneyInput', () => {
  it('retorna vazio para entrada vazia', () => {
    expect(formatMoneyInput('')).toBe('');
  });

  it('formata "1" como "0,01"', () => {
    expect(formatMoneyInput('1')).toBe('0,01');
  });

  it('formata "10" como "0,10"', () => {
    expect(formatMoneyInput('10')).toBe('0,10');
  });

  it('formata "150" como "1,50"', () => {
    expect(formatMoneyInput('150')).toBe('1,50');
  });

  it('formata "100000" como "1.000,00"', () => {
    expect(formatMoneyInput('100000')).toBe('1.000,00');
  });

  it('remove caracteres não numéricos', () => {
    const result = formatMoneyInput('abc123def');
    expect(result).not.toMatch(/[a-z]/i);
  });

  it('retorna string para qualquer entrada numérica', () => {
    expect(typeof formatMoneyInput('5000')).toBe('string');
  });

  it('retorna vazio para entrada composta apenas por letras', () => {
    expect(formatMoneyInput('abc')).toBe('');
  });

  it('formata "1000000" corretamente', () => {
    expect(formatMoneyInput('1000000')).toBe('10.000,00');
  });
});
