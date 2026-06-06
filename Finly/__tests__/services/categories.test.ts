import { getCategories, createCategory } from '@/src/services/categories';

jest.mock('@/src/services/api', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@/src/services/api';

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const mockCategory = {
  id_categoria: 1,
  nome: 'Alimentação',
  cor_hex: '#F59E0B',
  icone: 'coffee',
};

describe('getCategories', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna lista de categorias da API', async () => {
    mockApiRequest.mockResolvedValue([mockCategory]);

    const result = await getCategories();

    expect(result).toEqual([mockCategory]);
    expect(mockApiRequest).toHaveBeenCalledWith('/categorias');
  });

  it('propaga erro da API', async () => {
    mockApiRequest.mockRejectedValue(new Error('Erro na API'));

    await expect(getCategories()).rejects.toThrow('Erro na API');
  });
});

describe('createCategory', () => {
  beforeEach(() => jest.clearAllMocks());

  const payload = {
    nome: 'Viagem',
    icone: 'map',
    cor_hex: '#3B82F6',
  };

  it('cria categoria via POST', async () => {
    mockApiRequest.mockResolvedValue({ ...mockCategory, ...payload, id_categoria: 15 });

    const result = await createCategory(payload);

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/categorias',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    expect(result.nome).toBe('Viagem');
  });

  it('propaga erro da API', async () => {
    mockApiRequest.mockRejectedValue(new Error('Nome duplicado'));

    await expect(createCategory(payload)).rejects.toThrow('Nome duplicado');
  });
});
