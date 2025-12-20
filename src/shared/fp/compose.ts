/**
 * 오른쪽에서 왼쪽으로 함수 합성
 * @example
 * const addOneAndDouble = compose(x => x * 2, x => x + 1);
 * addOneAndDouble(5) // 12 (먼저 +1 후 *2)
 */
export function compose<A, B>(ab: (a: A) => B): (a: A) => B;
export function compose<A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C;
export function compose<A, B, C, D>(
  cd: (c: C) => D,
  bc: (b: B) => C,
  ab: (a: A) => B
): (a: A) => D;
export function compose<A, B, C, D, E>(
  de: (d: D) => E,
  cd: (c: C) => D,
  bc: (b: B) => C,
  ab: (a: A) => B
): (a: A) => E;
export function compose<A, B, C, D, E, F>(
  ef: (e: E) => F,
  de: (d: D) => E,
  cd: (c: C) => D,
  bc: (b: B) => C,
  ab: (a: A) => B
): (a: A) => F;
export function compose(
  ...fns: Array<(x: unknown) => unknown>
): (a: unknown) => unknown {
  return (a: unknown) => fns.reduceRight((acc, fn) => fn(acc), a);
}
