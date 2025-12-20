export interface Todo {
  readonly id: string;
  readonly text: string;
  readonly completed: boolean;
  readonly createdAt: number;
}

export type FilterType = 'all' | 'active' | 'completed';

export interface TodoState {
  readonly items: readonly Todo[];
  readonly filter: FilterType;
  readonly loading: boolean;
  readonly error: string | null;
}
