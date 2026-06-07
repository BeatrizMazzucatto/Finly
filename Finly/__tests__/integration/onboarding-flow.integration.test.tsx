import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import OnboardingScreen, {
  ONBOARDING_KEY,
  RENDA_KEY,
  LIMITE_KEY,
} from '@/app/onboarding';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome5: 'FontAwesome5',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;

describe('Integração: onboarding e persistência local', () => {
  beforeEach(() => jest.clearAllMocks());

  it('salva renda, limite e flag de onboarding ao iniciar', async () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText('Começar Agora'));

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(RENDA_KEY, '5000');
      expect(mockSetItem).toHaveBeenCalledWith(LIMITE_KEY, '3500');
      expect(mockSetItem).toHaveBeenCalledWith(ONBOARDING_KEY, 'true');
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('permite pular onboarding marcando apenas a flag', async () => {
    const { getByText } = render(<OnboardingScreen />);

    fireEvent.press(getByText('Pular configuração inicial'));

    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith(ONBOARDING_KEY, 'true');
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });
});
