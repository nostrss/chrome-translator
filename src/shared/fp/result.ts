/**
 * Result 모나드 - 에러 처리
 * Rust의 Result, Haskell의 Either와 유사
 */

export interface Ok<A> {
  readonly _tag: 'Ok';
  readonly value: A;
}

export interface Err<E> {
  readonly _tag: 'Err';
  readonly error: E;
}

export type Result<E, A> = Err<E> | Ok<A>;

// Constructors
export const ok = <A>(value: A): Result<never, A> => ({ _tag: 'Ok', value });
export const err = <E>(error: E): Result<E, never> => ({ _tag: 'Err', error });

// Type guards
export const isOk = <E, A>(result: Result<E, A>): result is Ok<A> =>
  result._tag === 'Ok';
export const isErr = <E, A>(result: Result<E, A>): result is Err<E> =>
  result._tag === 'Err';

// Functor
export const map =
  <A, B>(fn: (a: A) => B) =>
  <E>(result: Result<E, A>): Result<E, B> =>
    isOk(result) ? ok(fn(result.value)) : result;

export const mapErr =
  <E, F>(fn: (e: E) => F) =>
  <A>(result: Result<E, A>): Result<F, A> =>
    isErr(result) ? err(fn(result.error)) : result;

// Monad
export const flatMap =
  <E, A, B>(fn: (a: A) => Result<E, B>) =>
  (result: Result<E, A>): Result<E, B> =>
    isOk(result) ? fn(result.value) : result;

export const flatten = <E, A>(result: Result<E, Result<E, A>>): Result<E, A> =>
  isOk(result) ? result.value : result;

// Applicative
export const ap =
  <E, A, B>(resultFn: Result<E, (a: A) => B>) =>
  (result: Result<E, A>): Result<E, B> =>
    isOk(resultFn) && isOk(result) ? ok(resultFn.value(result.value)) :
    isErr(resultFn) ? resultFn :
    result as Result<E, B>;

// Extractors
export const getOrElse =
  <A>(defaultValue: () => A) =>
  <E>(result: Result<E, A>): A =>
    isOk(result) ? result.value : defaultValue();

export const getOrElseW =
  <B>(defaultValue: () => B) =>
  <E, A>(result: Result<E, A>): A | B =>
    isOk(result) ? result.value : defaultValue();

export const getOrThrow = <E, A>(result: Result<E, A>): A => {
  if (isOk(result)) return result.value;
  throw result.error;
};

// Folding
export const fold =
  <E, A, B>(onErr: (e: E) => B, onOk: (a: A) => B) =>
  (result: Result<E, A>): B =>
    isOk(result) ? onOk(result.value) : onErr(result.error);

export const match = fold;

// Error recovery
export const orElse =
  <E, A, F>(fn: (e: E) => Result<F, A>) =>
  (result: Result<E, A>): Result<F, A> =>
    isErr(result) ? fn(result.error) : result;

export const recover =
  <E, A>(fn: (e: E) => A) =>
  (result: Result<E, A>): Result<never, A> =>
    isErr(result) ? ok(fn(result.error)) : result;

// Try-catch conversion
export const tryCatch = <A>(fn: () => A): Result<Error, A> => {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

export const tryCatchAsync = async <A>(
  fn: () => Promise<A>
): Promise<Result<Error, A>> => {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

// From nullable
export const fromNullable =
  <E>(onNullable: () => E) =>
  <A>(value: A | null | undefined): Result<E, A> =>
    value == null ? err(onNullable()) : ok(value);

// Utilities
export const tap =
  <A>(fn: (a: A) => void) =>
  <E>(result: Result<E, A>): Result<E, A> => {
    if (isOk(result)) fn(result.value);
    return result;
  };

export const tapErr =
  <E>(fn: (e: E) => void) =>
  <A>(result: Result<E, A>): Result<E, A> => {
    if (isErr(result)) fn(result.error);
    return result;
  };

// Swap error and value
export const swap = <E, A>(result: Result<E, A>): Result<A, E> =>
  isOk(result) ? err(result.value) : ok(result.error);
