import { describe, it, expect } from 'vitest';
import {
  some,
  none,
  isSome,
  isNone,
  fromNullable,
  map,
  flatMap,
  getOrElse,
  fold,
  filter,
} from '@/shared/utils/option';
import { pipe } from '@/shared/utils/pipe';

describe('Option', () => {
  describe('constructors', () => {
    it('some should create a Some', () => {
      const opt = some(5);
      expect(isSome(opt)).toBe(true);
      expect(isNone(opt)).toBe(false);
    });

    it('none should create a None', () => {
      expect(isSome(none)).toBe(false);
      expect(isNone(none)).toBe(true);
    });
  });

  describe('fromNullable', () => {
    it('should return Some for defined values', () => {
      expect(isSome(fromNullable(5))).toBe(true);
      expect(isSome(fromNullable(''))).toBe(true);
      expect(isSome(fromNullable(0))).toBe(true);
      expect(isSome(fromNullable(false))).toBe(true);
    });

    it('should return None for null', () => {
      expect(isNone(fromNullable(null))).toBe(true);
    });

    it('should return None for undefined', () => {
      expect(isNone(fromNullable(undefined))).toBe(true);
    });
  });

  describe('map', () => {
    it('should transform Some values', () => {
      const result = pipe(
        some(5),
        map((x: number) => x * 2)
      );
      expect(isSome(result) && result.value).toBe(10);
    });

    it('should pass through None', () => {
      const result = pipe(
        none as ReturnType<typeof fromNullable<number>>,
        map((x: number) => x * 2)
      );
      expect(isNone(result)).toBe(true);
    });
  });

  describe('flatMap', () => {
    it('should chain Some values', () => {
      const safeDivide = (n: number) => (n === 0 ? none : some(100 / n));

      const result = pipe(
        some(10),
        flatMap(safeDivide)
      );
      expect(isSome(result) && result.value).toBe(10);
    });

    it('should return None when chaining fails', () => {
      const safeDivide = (n: number) => (n === 0 ? none : some(100 / n));

      const result = pipe(
        some(0),
        flatMap(safeDivide)
      );
      expect(isNone(result)).toBe(true);
    });
  });

  describe('getOrElse', () => {
    it('should return value for Some', () => {
      const result = pipe(
        some(5),
        getOrElse(() => 0)
      );
      expect(result).toBe(5);
    });

    it('should return default for None', () => {
      const result = pipe(
        none as ReturnType<typeof fromNullable<number>>,
        getOrElse(() => 0)
      );
      expect(result).toBe(0);
    });
  });

  describe('fold', () => {
    it('should apply onSome for Some', () => {
      const result = pipe(
        some(5),
        fold(
          () => 'empty',
          (n: number) => `value: ${n}`
        )
      );
      expect(result).toBe('value: 5');
    });

    it('should apply onNone for None', () => {
      const result = pipe(
        none as ReturnType<typeof fromNullable<number>>,
        fold(
          () => 'empty',
          (n: number) => `value: ${n}`
        )
      );
      expect(result).toBe('empty');
    });
  });

  describe('filter', () => {
    it('should keep value if predicate is true', () => {
      const result = pipe(
        some(10),
        filter((n: number) => n > 5)
      );
      expect(isSome(result) && result.value).toBe(10);
    });

    it('should return None if predicate is false', () => {
      const result = pipe(
        some(3),
        filter((n: number) => n > 5)
      );
      expect(isNone(result)).toBe(true);
    });
  });
});
