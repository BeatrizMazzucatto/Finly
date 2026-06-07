/**
 * Testa hooks/use-color-scheme.ts (exporta useColorScheme direto do react-native)
 */
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useColorScheme as rnUseColorScheme } from 'react-native';

const mockRN = rnUseColorScheme as jest.MockedFunction<typeof rnUseColorScheme>;

describe('use-color-scheme (native)', () => {
  afterEach(() => jest.clearAllMocks());

  it('re-exporta useColorScheme do react-native', () => {
    mockRN.mockReturnValue('light');
    // O hook é a própria função do RN re-exportada
    expect(useColorScheme).toBe(rnUseColorScheme);
  });
});
