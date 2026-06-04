import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

// Mock use-color-scheme
jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

import { useColorScheme } from '@/hooks/use-color-scheme';

const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('useThemeColor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna a cor do tema "light" quando o esquema é light', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#1E293B'); // Colors.light.text
  });

  it('retorna a cor do tema "dark" quando o esquema é dark', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#F8FAFC'); // Colors.dark.text
  });

  it('retorna cor de props.light quando tema é light e props.light está definido', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({ light: '#CUSTOM_LIGHT', dark: '#CUSTOM_DARK' }, 'text')
    );

    expect(result.current).toBe('#CUSTOM_LIGHT');
  });

  it('retorna cor de props.dark quando tema é dark e props.dark está definido', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({ light: '#CUSTOM_LIGHT', dark: '#CUSTOM_DARK' }, 'text')
    );

    expect(result.current).toBe('#CUSTOM_DARK');
  });

  it('usa tema "light" como padrão quando useColorScheme retorna null', () => {
    mockUseColorScheme.mockReturnValue(null);

    const { result } = renderHook(() =>
      useThemeColor({}, 'text')
    );

    expect(result.current).toBe('#1E293B'); // light text
  });

  it('retorna cor de background do tema light', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({}, 'background')
    );

    expect(result.current).toBe('#F8FAFC');
  });

  it('retorna cor de background do tema dark', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() =>
      useThemeColor({}, 'background')
    );

    expect(result.current).toBe('#0F172A');
  });

  it('ignora props.light quando é undefined e usa Colors', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() =>
      useThemeColor({ dark: '#DARK_OVERRIDE' }, 'text')
    );

    expect(result.current).toBe('#1E293B'); // Colors.light.text
  });
});
