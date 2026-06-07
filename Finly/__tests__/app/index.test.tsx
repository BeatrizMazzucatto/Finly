import React from 'react';
import { render } from '@testing-library/react-native';
import Index from '@/app/index';

jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    const { Text } = require('react-native');
    return <Text testID="redirect">{href}</Text>;
  },
}));

describe('Index', () => {
  it('redireciona para /login', () => {
    const { getByTestId } = render(<Index />);
    expect(getByTestId('redirect').props.children).toBe('/login');
  });
});
