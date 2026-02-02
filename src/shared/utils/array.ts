import { type Option, some, none } from './option';

/**
 * 배열 FP 유틸리티
 */

// Element access
export const head = <A>(arr: readonly A[]): Option<A> =>
  arr.length > 0 ? some(arr[0]!) : none;

export const last = <A>(arr: readonly A[]): Option<A> =>
  arr.length > 0 ? some(arr[arr.length - 1]!) : none;

export const tail = <A>(arr: readonly A[]): A[] =>
  arr.length > 0 ? arr.slice(1) : [];

export const init = <A>(arr: readonly A[]): A[] =>
  arr.length > 0 ? arr.slice(0, -1) : [];

export const at =
  (index: number) =>
  <A>(arr: readonly A[]): Option<A> => {
    const normalizedIndex = index < 0 ? arr.length + index : index;
    return normalizedIndex >= 0 && normalizedIndex < arr.length
      ? some(arr[normalizedIndex]!)
      : none;
  };

// Predicates
export const isEmpty = <A>(arr: readonly A[]): boolean => arr.length === 0;

export const isNonEmpty = <A>(arr: readonly A[]): boolean => arr.length > 0;

// Finding
export const find =
  <A>(predicate: (a: A, index: number) => boolean) =>
  (arr: readonly A[]): Option<A> => {
    const found = arr.find(predicate);
    return found !== undefined ? some(found) : none;
  };

export const findIndex =
  <A>(predicate: (a: A, index: number) => boolean) =>
  (arr: readonly A[]): Option<number> => {
    const index = arr.findIndex(predicate);
    return index !== -1 ? some(index) : none;
  };

// Transformations (curried versions)
export const map =
  <A, B>(fn: (a: A, index: number) => B) =>
  (arr: readonly A[]): B[] =>
    arr.map(fn);

export const filter =
  <A>(predicate: (a: A, index: number) => boolean) =>
  (arr: readonly A[]): A[] =>
    arr.filter(predicate);

export const flatMap =
  <A, B>(fn: (a: A, index: number) => B[]) =>
  (arr: readonly A[]): B[] =>
    arr.flatMap(fn);

export const reduce =
  <A, B>(fn: (acc: B, a: A, index: number) => B, initial: B) =>
  (arr: readonly A[]): B =>
    arr.reduce(fn, initial);

export const reduceRight =
  <A, B>(fn: (acc: B, a: A, index: number) => B, initial: B) =>
  (arr: readonly A[]): B =>
    arr.reduceRight(fn, initial);

// Sorting
export const sort =
  <A>(compareFn: (a: A, b: A) => number) =>
  (arr: readonly A[]): A[] =>
    [...arr].sort(compareFn);

export const sortBy =
  <A, B>(fn: (a: A) => B) =>
  (arr: readonly A[]): A[] =>
    [...arr].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      return va < vb ? -1 : va > vb ? 1 : 0;
    });

export const reverse = <A>(arr: readonly A[]): A[] => [...arr].reverse();

// Grouping
export const groupBy =
  <A, K extends string | number | symbol>(fn: (a: A) => K) =>
  (arr: readonly A[]): Record<K, A[]> =>
    arr.reduce(
      (acc, item) => {
        const key = fn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<K, A[]>
    );

export const partition =
  <A>(predicate: (a: A) => boolean) =>
  (arr: readonly A[]): [A[], A[]] => {
    const left: A[] = [];
    const right: A[] = [];
    for (const item of arr) {
      if (predicate(item)) {
        left.push(item);
      } else {
        right.push(item);
      }
    }
    return [left, right];
  };

// Uniqueness
export const uniq = <A>(arr: readonly A[]): A[] => [...new Set(arr)];

export const uniqBy =
  <A, K>(fn: (a: A) => K) =>
  (arr: readonly A[]): A[] => {
    const seen = new Set<K>();
    return arr.filter((item) => {
      const key = fn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

// Combination
export const concat =
  <A>(...others: readonly A[][]) =>
  (arr: readonly A[]): A[] =>
    arr.concat(...others);

export const prepend =
  <A>(item: A) =>
  (arr: readonly A[]): A[] =>
    [item, ...arr];

export const append =
  <A>(item: A) =>
  (arr: readonly A[]): A[] =>
    [...arr, item];

export const insertAt =
  <A>(index: number, item: A) =>
  (arr: readonly A[]): A[] => [
    ...arr.slice(0, index),
    item,
    ...arr.slice(index),
  ];

export const removeAt =
  (index: number) =>
  <A>(arr: readonly A[]): A[] => [
    ...arr.slice(0, index),
    ...arr.slice(index + 1),
  ];

export const updateAt =
  <A>(index: number, item: A) =>
  (arr: readonly A[]): Option<A[]> => {
    if (index < 0 || index >= arr.length) return none;
    const result = [...arr];
    result[index] = item;
    return some(result);
  };

// Zipping
export const zip =
  <B>(arrB: readonly B[]) =>
  <A>(arrA: readonly A[]): [A, B][] => {
    const length = Math.min(arrA.length, arrB.length);
    const result: [A, B][] = [];
    for (let i = 0; i < length; i++) {
      result.push([arrA[i]!, arrB[i]!]);
    }
    return result;
  };

export const zipWith =
  <A, B, C>(fn: (a: A, b: B) => C) =>
  (arrB: readonly B[]) =>
  (arrA: readonly A[]): C[] => {
    const length = Math.min(arrA.length, arrB.length);
    const result: C[] = [];
    for (let i = 0; i < length; i++) {
      result.push(fn(arrA[i]!, arrB[i]!));
    }
    return result;
  };

// Predicates on all/any
export const every =
  <A>(predicate: (a: A) => boolean) =>
  (arr: readonly A[]): boolean =>
    arr.every(predicate);

export const some_ =
  <A>(predicate: (a: A) => boolean) =>
  (arr: readonly A[]): boolean =>
    arr.some(predicate);

export const includes =
  <A>(item: A) =>
  (arr: readonly A[]): boolean =>
    arr.includes(item);

// Take/Drop
export const take =
  (n: number) =>
  <A>(arr: readonly A[]): A[] =>
    arr.slice(0, n);

export const drop =
  (n: number) =>
  <A>(arr: readonly A[]): A[] =>
    arr.slice(n);

export const takeWhile =
  <A>(predicate: (a: A) => boolean) =>
  (arr: readonly A[]): A[] => {
    const result: A[] = [];
    for (const item of arr) {
      if (!predicate(item)) break;
      result.push(item);
    }
    return result;
  };

export const dropWhile =
  <A>(predicate: (a: A) => boolean) =>
  (arr: readonly A[]): A[] => {
    let i = 0;
    while (i < arr.length && predicate(arr[i]!)) i++;
    return arr.slice(i);
  };
