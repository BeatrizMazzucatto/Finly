import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renderiza children', () => {
    const { getByText } = render(
      <Card>
        <Text>Conteúdo</Text>
      </Card>
    );
    expect(getByText('Conteúdo')).toBeTruthy();
  });

  it('renderiza título e subtítulo', () => {
    const { getByText } = render(
      <Card title="Resumo" subtitle="Junho 2024">
        <Text>Body</Text>
      </Card>
    );
    expect(getByText('Resumo')).toBeTruthy();
    expect(getByText('Junho 2024')).toBeTruthy();
  });

  it('renderiza com variante success', () => {
    const { getByText } = render(
      <Card title="Meta atingida" variant="success">
        <Text>OK</Text>
      </Card>
    );
    expect(getByText('Meta atingida')).toBeTruthy();
  });

  it('renderiza com variante outlined', () => {
    const { getByText } = render(
      <Card title="Sem fundo" variant="outlined">
        <Text>OK</Text>
      </Card>
    );
    expect(getByText('Sem fundo')).toBeTruthy();
  });
});
