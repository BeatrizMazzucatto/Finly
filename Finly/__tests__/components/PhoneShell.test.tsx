import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, Platform } from 'react-native';
import { PhoneShell } from '@/components/PhoneShell';

describe('PhoneShell', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('renderiza children diretamente em plataformas nativas', () => {
    Platform.OS = 'ios';
    const { getByText } = render(
      <PhoneShell>
        <Text>App nativo</Text>
      </PhoneShell>
    );
    expect(getByText('App nativo')).toBeTruthy();
  });

  it('envolve children em moldura no web', () => {
    Platform.OS = 'web';
    const { getByText, toJSON } = render(
      <PhoneShell>
        <Text>App web</Text>
      </PhoneShell>
    );
    expect(getByText('App web')).toBeTruthy();
    const tree = toJSON() as any;
    expect(tree.children.length).toBeGreaterThan(0);
  });
});
