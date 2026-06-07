import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoryCard } from '@/components/CategoryCard';

describe('CategoryCard', () => {
  it('exibe nome da categoria', () => {
    const { getByText } = render(
      <CategoryCard
        category="Alimentação"
        value={250}
      />
    );
    expect(getByText('Alimentação')).toBeTruthy();
  });

  it('exibe valor formatado', () => {
    const { getByText } = render(
      <CategoryCard
        category="Transporte"
        value={89.5}
      />
    );
    // formatCurrency from utils formats as BRL
    expect(getByText(/89/)).toBeTruthy();
  });

  it('renderiza corretamente com valor zero', () => {
    const { getByText } = render(
      <CategoryCard
        category="Lazer"
        value={0}
      />
    );
    expect(getByText('Lazer')).toBeTruthy();
  });
});
