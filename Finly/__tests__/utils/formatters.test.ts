import { 
  formatCurrency, 
  formatCurrencyShort, 
  formatDate, 
  formatDateShort,
  getGreeting,
  parseMoneyInput,
  formatMoneyInput
} from '@/utils/formatters';

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

  it('formata valor grande', () => {
    expect(formatCurrency(1000000)).toBe('R$\u00a01.000.000,00');
  });
});

describe('formatCurrencyShort', () => {
  it('exibe valor em milhões com sufixo M', () => {
    expect(formatCurrencyShort(2500000)).toBe('R$ 2.5M');
  });

  it('exibe valor em milhares com sufixo k', () => {
    expect(formatCurrencyShort(3500)).toBe('R$ 3.5k');
  });

  it('exibe valor normal para valores menores que 1000', () => {
    const result = formatCurrencyShort(500);
    expect(result).toBe('R$\u00a0500,00');
  });
});

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
});

describe('formatDateShort', () => {
  it('retorna string vazia para entrada vazia', () => {
    expect(formatDateShort('')).toBe('');
  });

  it('formata data para formato DD Mês abreviado', () => {
    expect(formatDateShort('2024-05-13')).toBe('13 Mai');
  });

  it('formata mês de janeiro corretamente', () => {
    expect(formatDateShort('2024-01-01')).toBe('01 Jan');
  });

  it('formata mês de dezembro corretamente', () => {
    expect(formatDateShort('2024-12-25')).toBe('25 Dez');
  });
});

describe('getGreeting', () => {
  it('retorna uma saudação não vazia', () => {
    const greeting = getGreeting();
    expect(greeting).toBeTruthy();
    expect(['Bom dia', 'Boa tarde', 'Boa noite']).toContain(greeting);
  });
});

describe('parseMoneyInput', () => {
  it('retorna 0 para string vazia', () => {
    expect(parseMoneyInput('')).toBe(0);
  });

  it('parseia valor com vírgula como separador decimal', () => {
    expect(parseMoneyInput('1500,50')).toBe(1500.5);
  });

  it('parseia valor simples', () => {
    expect(parseMoneyInput('250')).toBe(250);
  });

  it('remove caracteres não numéricos e parseia (sem ponto de milhar)', () => {
    // A função remove R$, espaços e mantém números e vírgula
    // "R$ 1500,00" -> "1500,00" -> 1500
    expect(parseMoneyInput('R$ 1500,00')).toBe(1500);
  });
});

describe('formatMoneyInput', () => {
  it('retorna vazio para entrada vazia', () => {
    expect(formatMoneyInput('')).toBe('');
  });

  it('formata centavos corretamente para entrada "150"', () => {
    // "150" = 1,50
    expect(formatMoneyInput('150')).toBe('1,50');
  });

  it('formata corretamente para entrada "100000"', () => {
    // "100000" = 1.000,00
    expect(formatMoneyInput('100000')).toBe('1.000,00');
  });

  it('remove caracteres não numéricos', () => {
    const result = formatMoneyInput('abc123def');
    expect(result).not.toContain('a');
    expect(result).not.toContain('b');
    expect(result).not.toContain('c');
    expect(result).not.toContain('d');
    expect(result).not.toContain('e');
    expect(result).not.toContain('f');
  });

  it('retorna string para qualquer entrada numérica', () => {
    expect(typeof formatMoneyInput('5000')).toBe('string');
  });
});
