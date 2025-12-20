// Core functions
export { pipe, flow } from './pipe';
export { compose } from './compose';
export { curry, curry2, curry3, partial } from './curry';

// Monads
export {
  type Option,
  type Some,
  type None,
  some,
  none,
  isSome,
  isNone,
  fromNullable as optionFromNullable,
  fromPredicate,
  map as optionMap,
  flatMap as optionFlatMap,
  flatten as optionFlatten,
  ap as optionAp,
  getOrElse as optionGetOrElse,
  getOrElseW as optionGetOrElseW,
  toNullable,
  toUndefined,
  fold as optionFold,
  match as optionMatch,
  filter as optionFilter,
  alt as optionAlt,
  orElse as optionOrElse,
  tap as optionTap,
  contains,
} from './option';

export {
  type Result,
  type Ok,
  type Err,
  ok,
  err,
  isOk,
  isErr,
  map as resultMap,
  mapErr,
  flatMap as resultFlatMap,
  flatten as resultFlatten,
  ap as resultAp,
  getOrElse as resultGetOrElse,
  getOrElseW as resultGetOrElseW,
  getOrThrow,
  fold as resultFold,
  match as resultMatch,
  orElse as resultOrElse,
  recover,
  tryCatch,
  tryCatchAsync,
  fromNullable as resultFromNullable,
  tap as resultTap,
  tapErr,
  swap,
} from './result';

// Array utilities
export * as Arr from './array';

// Common utilities
export const identity = <T>(x: T): T => x;
export const constant =
  <T>(x: T) =>
  (): T =>
    x;
export const not = (x: boolean): boolean => !x;
export const noop = (): void => undefined;
