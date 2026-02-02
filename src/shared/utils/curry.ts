/**
 * 2개 인자 함수 커링
 */
export function curry2<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R {
  return (a: A) => (b: B) => fn(a, b);
}

/**
 * 3개 인자 함수 커링
 */
export function curry3<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R
): (a: A) => (b: B) => (c: C) => R {
  return (a: A) => (b: B) => (c: C) => fn(a, b, c);
}

/**
 * 일반적인 함수 커링 (런타임)
 * @example
 * const add = (a: number, b: number, c: number) => a + b + c;
 * const curriedAdd = curry(add);
 * curriedAdd(1)(2)(3) // 6
 * curriedAdd(1, 2)(3) // 6
 * curriedAdd(1)(2, 3) // 6
 */
export function curry<T extends (...args: unknown[]) => unknown>(
  fn: T
): (...args: unknown[]) => unknown {
  const arity = fn.length;

  function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  }

  return curried;
}

/**
 * 부분 적용 (Partial Application)
 * @example
 * const add = (a: number, b: number, c: number) => a + b + c;
 * const add5 = partial(add, 5);
 * add5(3, 2) // 10
 */
export function partial<A extends unknown[], R>(
  fn: (...args: A) => R,
  ...presetArgs: Partial<A>
): (...args: unknown[]) => R {
  return (...laterArgs: unknown[]): R => {
    return fn(...([...presetArgs, ...laterArgs] as A));
  };
}
