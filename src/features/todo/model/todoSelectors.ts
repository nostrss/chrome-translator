import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import type { Todo, FilterType } from '@/features/todo/model/types';

// Base selectors
const selectTodoState = (state: RootState) => state.todo;
export const selectItems = (state: RootState) => state.todo.items;
export const selectFilter = (state: RootState) => state.todo.filter;
export const selectLoading = (state: RootState) => state.todo.loading;
export const selectError = (state: RootState) => state.todo.error;

// Filtering logic (pure function)
const filterTodos = (todos: readonly Todo[], filter: FilterType): Todo[] => {
  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    default:
      return [...todos];
  }
};

// Memoized selectors
export const selectFilteredTodos = createSelector(
  [selectItems, selectFilter],
  filterTodos
);

export const selectTodoStats = createSelector([selectItems], (items) => ({
  total: items.length,
  active: items.filter((t) => !t.completed).length,
  completed: items.filter((t) => t.completed).length,
}));

export const selectAllCompleted = createSelector(
  [selectItems],
  (items) => items.length > 0 && items.every((t) => t.completed)
);

export const selectHasTodos = createSelector(
  [selectItems],
  (items) => items.length > 0
);

export const selectTodoById = (id: string) =>
  createSelector([selectItems], (items) => items.find((t) => t.id === id));

// Export all selectors as object
export const todoSelectors = {
  selectTodoState,
  selectItems,
  selectFilter,
  selectLoading,
  selectError,
  selectFilteredTodos,
  selectTodoStats,
  selectAllCompleted,
  selectHasTodos,
  selectTodoById,
};
