/**
 * Option 모나드 - null/undefined 안전 처리
 * Haskell의 Maybe, Rust의 Option과 유사
 */

export interface Some<A> {
  readonly _tag: 'Some';
  readonly value: A;
}

export interface None {
  readonly _tag: 'None';
}

export type Option<A> = Some<A> | None;

// Constructors
export const some = <A>(value: A): Option<A> => ({ _tag: 'Some', value });
export const none: Option<never> = { _tag: 'None' };

// Type guards
export const isSome = <A>(opt: Option<A>): opt is Some<A> => opt._tag === 'Some';
export const isNone = <A>(opt: Option<A>): opt is None => opt._tag === 'None';

// Constructors from nullable
export const fromNullable = <A>(value: A | null | undefined): Option<A> =>
  value == null ? none : some(value);

export const fromPredicate =
  <A>(predicate: (a: A) => boolean) =>
  (a: A): Option<A> =>
    predicate(a) ? some(a) : none;

// Functor
export const map =
  <A, B>(fn: (a: A) => B) =>
  (opt: Option<A>): Option<B> =>
    isSome(opt) ? some(fn(opt.value)) : none;

// Monad
export const flatMap =
  <A, B>(fn: (a: A) => Option<B>) =>
  (opt: Option<A>): Option<B> =>
    isSome(opt) ? fn(opt.value) : none;

export const flatten = <A>(opt: Option<Option<A>>): Option<A> =>
  isSome(opt) ? opt.value : none;

// Applicative
export const ap =
  <A, B>(optFn: Option<(a: A) => B>) =>
  (opt: Option<A>): Option<B> =>
    isSome(optFn) && isSome(opt) ? some(optFn.value(opt.value)) : none;

// Extractors
export const getOrElse =
  <A>(defaultValue: () => A) =>
  (opt: Option<A>): A =>
    isSome(opt) ? opt.value : defaultValue();

export const getOrElseW =
  <B>(defaultValue: () => B) =>
  <A>(opt: Option<A>): A | B =>
    isSome(opt) ? opt.value : defaultValue();

export const toNullable = <A>(opt: Option<A>): A | null =>
  isSome(opt) ? opt.value : null;

export const toUndefined = <A>(opt: Option<A>): A | undefined =>
  isSome(opt) ? opt.value : undefined;

// Folding
export const fold =
  <A, B>(onNone: () => B, onSome: (a: A) => B) =>
  (opt: Option<A>): B =>
    isSome(opt) ? onSome(opt.value) : onNone();

export const match = fold;

// Filtering
export const filter =
  <A>(predicate: (a: A) => boolean) =>
  (opt: Option<A>): Option<A> =>
    isSome(opt) && predicate(opt.value) ? opt : none;

// Alternative
export const alt =
  <A>(that: () => Option<A>) =>
  (opt: Option<A>): Option<A> =>
    isSome(opt) ? opt : that();

export const orElse = alt;

// Utilities
export const tap =
  <A>(fn: (a: A) => void) =>
  (opt: Option<A>): Option<A> => {
    if (isSome(opt)) fn(opt.value);
    return opt;
  };

export const contains =
  <A>(value: A) =>
  (opt: Option<A>): boolean =>
    isSome(opt) && opt.value === value;
