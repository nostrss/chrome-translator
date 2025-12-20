import { describe, it, expect } from 'vitest';
import { pipe, flow } from '@/shared/fp/pipe';

describe('pipe', () => {
  it('should return the value when no functions provided', () => {
    expect(pipe(5)).toBe(5);
  });

  it('should apply a single function', () => {
    expect(pipe(5, (x: number) => x * 2)).toBe(10);
  });

  it('should apply multiple functions left to right', () => {
    const result = pipe(
      5,
      (x: number) => x * 2,
      (x: number) => x + 1,
      (x: number) => x.toString()
    );
    expect(result).toBe('11');
  });

  it('should work with different types', () => {
    const result = pipe(
      'hello',
      (s: string) => s.toUpperCase(),
      (s: string) => s.length,
      (n: number) => n > 3
    );
    expect(result).toBe(true);
  });
});

describe('flow', () => {
  it('should compose functions left to right', () => {
    const addOne = (x: number) => x + 1;
    const double = (x: number) => x * 2;
    const composed = flow(addOne, double);

    expect(composed(5)).toBe(12); // (5 + 1) * 2
  });

  it('should work with a single function', () => {
    const addOne = (x: number) => x + 1;
    const composed = flow(addOne);

    expect(composed(5)).toBe(6);
  });

  it('should work with type transformations', () => {
    const toString = (x: number) => x.toString();
    const getLength = (s: string) => s.length;
    const composed = flow(toString, getLength);

    expect(composed(12345)).toBe(5);
  });
});
