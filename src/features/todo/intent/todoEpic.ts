import { type Epic, ofType } from 'redux-observable';
import {
  debounceTime,
  switchMap,
  withLatestFrom,
  tap,
  ignoreElements,
  delay,
} from 'rxjs/operators';
import { of } from 'rxjs';
import type { RootState } from '@/store';
import { todoActions, type TodoAction } from '@/features/todo/model/todoSlice';
import type { Todo } from '@/features/todo/model/types';

type TodoEpic = Epic<TodoAction, TodoAction, RootState>;

// Storage key
const STORAGE_KEY = 'react-mvi-todos';

// Storage helpers
const loadFromStorage = (): Todo[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (todos: readonly Todo[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('Failed to save todos:', error);
  }
};

/**
 * Epic: Load todos from localStorage
 * Triggers on: fetchTodos action
 * Emits: fetchTodosSuccess or fetchTodosFailure
 */
const fetchTodosEpic: TodoEpic = (action$) =>
  action$.pipe(
    ofType(todoActions.fetchTodos.type),
    delay(300), // Simulate network delay
    switchMap(() => {
      try {
        const todos = loadFromStorage();
        return of(todoActions.fetchTodosSuccess(todos));
      } catch (error) {
        return of(
          todoActions.fetchTodosFailure(
            error instanceof Error ? error.message : 'Failed to load todos'
          )
        );
      }
    })
  );

/**
 * Epic: Auto-save todos to localStorage
 * Triggers on: any mutation action
 * Emits: nothing (side effect only)
 */
const autoSaveEpic: TodoEpic = (action$, state$) =>
  action$.pipe(
    ofType(
      todoActions.addTodo.type,
      todoActions.toggleTodo.type,
      todoActions.removeTodo.type,
      todoActions.updateTodoText.type,
      todoActions.clearCompleted.type,
      todoActions.toggleAll.type
    ),
    debounceTime(500),
    withLatestFrom(state$),
    tap(([, state]) => saveToStorage(state.todo.items)),
    ignoreElements()
  );

/**
 * Epic: Log analytics events
 * Triggers on: addTodo action
 * Emits: nothing (side effect only)
 */
const analyticsEpic: TodoEpic = (action$) =>
  action$.pipe(
    ofType(todoActions.addTodo.type),
    tap((action) => {
      // Analytics event (console.log for demo)
      console.log('[Analytics] Todo added:', action.payload);
    }),
    ignoreElements()
  );

// Export all epics as array
export const todoEpics = [fetchTodosEpic, autoSaveEpic, analyticsEpic];
