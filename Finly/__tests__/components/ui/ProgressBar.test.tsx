import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Colors } from '@/constants/theme';

describe('ProgressBar', () => {
  it('renderiza com progresso de 50%', () => {
    const { toJSON } = render(<ProgressBar progress={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it('limita progresso entre 0 e 100 por padrão', () => {
    const { rerender, toJSON } = render(<ProgressBar progress={-10} />);
    const negative = toJSON();

    rerender(<ProgressBar progress={150} />);
    const overflow = toJSON();

    expect(negative).toBeTruthy();
    expect(overflow).toBeTruthy();
  });

  it('permite overflow quando showOverflow é true', () => {
    const { toJSON } = render(
      <ProgressBar progress={150} showOverflow />
    );

    const tree = toJSON() as any;
    const fill = tree.children[0];
    expect(fill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: Colors.error,
        }),
      ])
    );
  });

  it('usa cor primária por padrão quando progresso está dentro do limite', () => {
    const { toJSON } = render(<ProgressBar progress={75} />);

    const tree = toJSON() as any;
    const fill = tree.children[0];
    expect(fill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: Colors.primary,
          width: '75%',
        }),
      ])
    );
  });

  it('aceita cor customizada', () => {
    const customColor = '#FF0000';
    const { toJSON } = render(
      <ProgressBar progress={30} color={customColor} />
    );

    const tree = toJSON() as any;
    const fill = tree.children[0];
    expect(fill.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: customColor }),
      ])
    );
  });

  it('aceita altura customizada', () => {
    const { toJSON } = render(<ProgressBar progress={50} height={12} />);

    const tree = toJSON() as any;
    expect(tree.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ height: 12 }),
      ])
    );
  });
});
