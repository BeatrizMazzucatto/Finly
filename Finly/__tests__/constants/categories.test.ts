import {
  CATEGORIAS,
  getCategoryById,
  getCategoryByName,
  getCategoryIcon,
  getCategoryColor,
} from '@/constants/categories';
import { Colors } from '@/constants/theme';

describe('CATEGORIAS', () => {
  it('contém 14 categorias', () => {
    expect(CATEGORIAS).toHaveLength(14);
  });

  it('cada categoria tem id, nome, icon e cor', () => {
    CATEGORIAS.forEach((cat) => {
      expect(cat.id).toBeGreaterThan(0);
      expect(cat.nome).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.cor).toMatch(/^#/);
    });
  });
});

describe('getCategoryById', () => {
  it('retorna categoria existente pelo id', () => {
    expect(getCategoryById(1)?.nome).toBe('Alimentação');
    expect(getCategoryById(12)?.nome).toBe('Salário');
  });

  it('retorna undefined para id inexistente', () => {
    expect(getCategoryById(999)).toBeUndefined();
  });
});

describe('getCategoryByName', () => {
  it('encontra categoria pelo nome exato', () => {
    expect(getCategoryByName('Transporte')?.id).toBe(3);
  });

  it('é case-insensitive', () => {
    expect(getCategoryByName('alimentação')?.id).toBe(1);
    expect(getCategoryByName('SALÁRIO')?.id).toBe(12);
  });

  it('retorna undefined para nome inexistente', () => {
    expect(getCategoryByName('Categoria Fantasma')).toBeUndefined();
  });
});

describe('getCategoryIcon', () => {
  it('retorna ícone da categoria conhecida', () => {
    expect(getCategoryIcon('Alimentação')).toBe('coffee');
    expect(getCategoryIcon('Transporte')).toBe('truck');
  });

  it('retorna "tag" como fallback para categoria desconhecida', () => {
    expect(getCategoryIcon('Inexistente')).toBe('tag');
  });
});

describe('getCategoryColor', () => {
  it('retorna cor da categoria conhecida', () => {
    expect(getCategoryColor('Alimentação')).toBe(Colors.categories.alimentacao);
    expect(getCategoryColor('Saúde')).toBe(Colors.categories.saude);
  });

  it('retorna cor de "outros" como fallback', () => {
    expect(getCategoryColor('Desconhecida')).toBe(Colors.categories.outros);
  });
});
