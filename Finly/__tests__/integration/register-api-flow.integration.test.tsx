import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '@/app/register';

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Redirect: ({ href }: { href: string }) =>
      React.createElement(Text, { testID: 'redirect' }, href),
    router: { replace: jest.fn() },
  };
});

jest.mock('@/src/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id_usuario: 1, nome: 'Lucas Silva', email: 'lucas.silva@email.com' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    updateUser: jest.fn(),
  })),
  GUEST_USER: { id_usuario: 1, nome: 'Lucas Silva', email: 'lucas.silva@email.com' },
}));

jest.mock('@/src/services/api', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '@/src/services/api';

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('Integração: cadastro via API REST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('envia POST /usuarios com payload completo e exibe sucesso', async () => {
    mockApiRequest.mockResolvedValue({ mensagem: 'Usuário criado com sucesso', id_usuario: 15 });

    const { getByPlaceholderText, getAllByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome'), 'Ana Costa');
    fireEvent.changeText(getByPlaceholderText('Email'), 'ana@email.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'abc123');
    fireEvent.changeText(getByPlaceholderText('Confirme a senha'), 'abc123');
    fireEvent.press(getAllByText('Criar Conta')[1]);

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nome: 'Ana Costa',
          email: 'ana@email.com',
          senha: 'abc123',
        }),
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sucesso',
        'Conta criada com sucesso. Faça login.',
        expect.any(Array)
      );
    });
  });

  it('propaga erro da API para a interface', async () => {
    mockApiRequest.mockRejectedValue(new Error('Email já cadastrado'));

    const { getByPlaceholderText, getAllByText, getByText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome'), 'Ana');
    fireEvent.changeText(getByPlaceholderText('Email'), 'ana@email.com');
    fireEvent.changeText(getByPlaceholderText('Senha'), 'abc123');
    fireEvent.changeText(getByPlaceholderText('Confirme a senha'), 'abc123');
    fireEvent.press(getAllByText('Criar Conta')[1]);

    await waitFor(() => {
      expect(getByText('Email já cadastrado')).toBeTruthy();
    });
  });
});
