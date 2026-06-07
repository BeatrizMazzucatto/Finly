import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SpendingLimitCard from '@/src/components/SpendingLimitCard';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

function renderCard(totalDespesas = 0) {
  return render(<SpendingLimitCard totalDespesas={totalDespesas} />);
}

describe('SpendingLimitCard - carregamento inicial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('exibe indicador de carregamento enquanto lê AsyncStorage', () => {
    mockAsyncStorage.getItem.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 100))
    );

    const { getByTestId, UNSAFE_queryByType } = renderCard();
    const ActivityIndicator = require('react-native').ActivityIndicator;
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
  });

  it('exibe conteúdo após carregamento sem limite salvo', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { getByText } = renderCard();

    await waitFor(() => {
      expect(getByText('Limite mensal')).toBeTruthy();
    });
  });

  it('lê a chave correta do AsyncStorage', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);
    renderCard();

    await waitFor(() =>
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('finly_spending_limit')
    );
  });

  it('renderiza sem limite quando AsyncStorage retorna null', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { getByText } = renderCard();

    await waitFor(() => {
      expect(getByText(/Nenhum limite definido/)).toBeTruthy();
    });
  });

  it('carrega e exibe limite salvo', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('1000');

    const { getByText } = renderCard();

    await waitFor(() => {
      expect(getByText('Limite')).toBeTruthy();
    });
  });

  it('mantém carregamento false mesmo quando AsyncStorage lança erro', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

    const { getByText } = renderCard();

    await waitFor(() => {
      expect(getByText('Limite mensal')).toBeTruthy();
    });
  });
});

describe('SpendingLimitCard - edição', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('exibe botão "Editar"', async () => {
    const { getByText } = renderCard();

    await waitFor(() => {
      expect(getByText('Editar')).toBeTruthy();
    });
  });

  it('mostra campo de input ao pressionar "Editar"', async () => {
    const { getByText, getByPlaceholderText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));

    expect(getByPlaceholderText('R$ 0,00')).toBeTruthy();
  });

  it('muda botão para "Cancelar" quando em modo edição', async () => {
    const { getByText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));

    expect(getByText('Cancelar')).toBeTruthy();
  });

  it('cancela edição ao pressionar "Cancelar"', async () => {
    const { getByText, queryByPlaceholderText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));
    fireEvent.press(getByText('Cancelar'));

    expect(queryByPlaceholderText('R$ 0,00')).toBeNull();
  });

  it('cancela edição restaurando valor anterior (com limite)', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('500');

    const { getByText, queryByPlaceholderText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));
    fireEvent.press(getByText('Cancelar'));

    expect(queryByPlaceholderText('R$ 0,00')).toBeNull();
    expect(getByText('Editar')).toBeTruthy();
  });
});

describe('SpendingLimitCard - salvamento', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  it('salva o limite no AsyncStorage ao clicar "Salvar"', async () => {
    const { getByText, getByPlaceholderText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));
    fireEvent.changeText(getByPlaceholderText('R$ 0,00'), '1000');

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
      'finly_spending_limit',
      expect.any(String)
    );
  });

  it('exibe alerta ao tentar salvar com valor zero', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));
    fireEvent.changeText(getByPlaceholderText('R$ 0,00'), '0');

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Valor inválido', expect.any(String));
    alertSpy.mockRestore();
  });

  it('exibe alerta ao tentar salvar com campo vazio', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));
    // Não digita nada — inputValue permanece ""

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });

    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('fecha modo edição após salvar com sucesso', async () => {
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderCard();

    await waitFor(() => getByText('Editar'));
    fireEvent.press(getByText('Editar'));
    fireEvent.changeText(getByPlaceholderText('R$ 0,00'), '2000');

    await act(async () => {
      fireEvent.press(getByText('Salvar'));
    });

    expect(queryByPlaceholderText('R$ 0,00')).toBeNull();
  });
});

describe('SpendingLimitCard - faixas de progresso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('exibe mensagem normal quando gasto < 80% do limite', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('1000');

    const { getByText } = renderCard(500); // 50%

    await waitFor(() => {
      expect(getByText(/50% do limite utilizado/)).toBeTruthy();
    });
  });

  it('exibe mensagem de atenção quando gasto está entre 80% e 100%', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('1000');

    const { getByText } = renderCard(850); // 85%

    await waitFor(() => {
      expect(getByText(/Atenção/)).toBeTruthy();
    });
  });

  it('exibe mensagem de limite ultrapassado quando gasto >= 100%', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('1000');

    const { getByText } = renderCard(1200); // 120%

    await waitFor(() => {
      expect(getByText(/Limite ultrapassado/)).toBeTruthy();
    });
  });

  it('exibe Gasto e Limite quando há limite definido', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('2000');

    const { getByText } = renderCard(300);

    await waitFor(() => {
      expect(getByText('Gasto')).toBeTruthy();
      expect(getByText('Limite')).toBeTruthy();
    });
  });

  it('exibe "Nenhum limite definido" quando não há limite', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null);

    const { getByText } = renderCard(0);

    await waitFor(() => {
      expect(getByText(/Nenhum limite definido/)).toBeTruthy();
    });
  });
});
