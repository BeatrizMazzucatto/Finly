import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoryCard } from '@/components/CategoryCard';

const mockFormatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

describe('CategoryCard', () => {
  it('exibe nome da categoria', () => {
    const { getByText } = render(
      <CategoryCard
        category="Alimentação"
        value={250}
        formatCurrency={mockFormatCurrency}
      />
    );
    expect(getByText('Alimentação')).toBeTruthy();
  });

  it('exibe valor formatado', () => {
    const { getByText } = render(
      <CategoryCard
        category="Transporte"
        value={89.5}
        formatCurrency={mockFormatCurrency}
      />
    );
    expect(getByText('R$ 89.50')).toBeTruthy();
  });

  it('chama formatCurrency com o valor correto', () => {
    const spy = jest.fn((v: number) => `R$ ${v}`);
    render(
      <CategoryCard
        category="Lazer"
        value={120}
        formatCurrency={spy}
      />
    );
    expect(spy).toHaveBeenCalledWith(120);
  });
});
