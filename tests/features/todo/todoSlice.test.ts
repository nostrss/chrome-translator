import { describe, it, expect } from 'vitest';
import { todoReducer, todoActions } from '@/features/todo/model/todoSlice';
import type { TodoState } from '@/features/todo/model/types';

const initialState: TodoState = {
  items: [],
  filter: 'all',
  loading: false,
  error: null,
};

describe('todoSlice', () => {
  describe('addTodo', () => {
    it('should add a new todo', () => {
      const action = todoActions.addTodo({ id: '1', text: 'Test todo' });
      const state = todoReducer(initialState, action);

      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        id: '1',
        text: 'Test todo',
        completed: false,
      });
      expect(state.items[0]?.createdAt).toBeDefined();
    });

    it('should add multiple todos', () => {
      let state = todoReducer(
        initialState,
        todoActions.addTodo({ id: '1', text: 'First' })
      );
      state = todoReducer(
        state,
        todoActions.addTodo({ id: '2', text: 'Second' })
      );

      expect(state.items).toHaveLength(2);
      expect(state.items[0]?.text).toBe('First');
      expect(state.items[1]?.text).toBe('Second');
    });
  });

  describe('toggleTodo', () => {
    it('should toggle todo completion status', () => {
      const stateWithTodo: TodoState = {
        ...initialState,
        items: [{ id: '1', text: 'Test', completed: false, createdAt: 0 }],
      };

      const state = todoReducer(stateWithTodo, todoActions.toggleTodo('1'));

      expect(state.items[0]?.completed).toBe(true);
    });

    it('should toggle back to false', () => {
      const stateWithTodo: TodoState = {
        ...initialState,
        items: [{ id: '1', text: 'Test', completed: true, createdAt: 0 }],
      };

      const state = todoReducer(stateWithTodo, todoActions.toggleTodo('1'));

      expect(state.items[0]?.completed).toBe(false);
    });

    it('should not affect other todos', () => {
      const stateWithTodos: TodoState = {
        ...initialState,
        items: [
          { id: '1', text: 'First', completed: false, createdAt: 0 },
          { id: '2', text: 'Second', completed: false, createdAt: 1 },
        ],
      };

      const state = todoReducer(stateWithTodos, todoActions.toggleTodo('1'));

      expect(state.items[0]?.completed).toBe(true);
      expect(state.items[1]?.completed).toBe(false);
    });
  });

  describe('removeTodo', () => {
    it('should remove a todo', () => {
      const stateWithTodos: TodoState = {
        ...initialState,
        items: [
          { id: '1', text: 'First', completed: false, createdAt: 0 },
          { id: '2', text: 'Second', completed: false, createdAt: 1 },
        ],
      };

      const state = todoReducer(stateWithTodos, todoActions.removeTodo('1'));

      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.id).toBe('2');
    });
  });

  describe('updateTodoText', () => {
    it('should update todo text', () => {
      const stateWithTodo: TodoState = {
        ...initialState,
        items: [{ id: '1', text: 'Original', completed: false, createdAt: 0 }],
      };

      const state = todoReducer(
        stateWithTodo,
        todoActions.updateTodoText({ id: '1', text: 'Updated' })
      );

      expect(state.items[0]?.text).toBe('Updated');
    });
  });

  describe('setFilter', () => {
    it('should update filter', () => {
      const state = todoReducer(initialState, todoActions.setFilter('active'));

      expect(state.filter).toBe('active');
    });
  });

  describe('clearCompleted', () => {
    it('should remove completed todos', () => {
      const stateWithTodos: TodoState = {
        ...initialState,
        items: [
          { id: '1', text: 'Active', completed: false, createdAt: 0 },
          { id: '2', text: 'Completed', completed: true, createdAt: 1 },
          { id: '3', text: 'Also Completed', completed: true, createdAt: 2 },
        ],
      };

      const state = todoReducer(stateWithTodos, todoActions.clearCompleted());

      expect(state.items).toHaveLength(1);
      expect(state.items[0]?.text).toBe('Active');
    });
  });

  describe('toggleAll', () => {
    it('should complete all todos when some are incomplete', () => {
      const stateWithTodos: TodoState = {
        ...initialState,
        items: [
          { id: '1', text: 'First', completed: false, createdAt: 0 },
          { id: '2', text: 'Second', completed: true, createdAt: 1 },
        ],
      };

      const state = todoReducer(stateWithTodos, todoActions.toggleAll());

      expect(state.items.every((t) => t.completed)).toBe(true);
    });

    it('should uncomplete all todos when all are complete', () => {
      const stateWithTodos: TodoState = {
        ...initialState,
        items: [
          { id: '1', text: 'First', completed: true, createdAt: 0 },
          { id: '2', text: 'Second', completed: true, createdAt: 1 },
        ],
      };

      const state = todoReducer(stateWithTodos, todoActions.toggleAll());

      expect(state.items.every((t) => !t.completed)).toBe(true);
    });
  });

  describe('async actions', () => {
    it('fetchTodos should set loading to true', () => {
      const state = todoReducer(initialState, todoActions.fetchTodos());

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('fetchTodosSuccess should set items and loading to false', () => {
      const loadingState: TodoState = { ...initialState, loading: true };
      const todos = [{ id: '1', text: 'Test', completed: false, createdAt: 0 }];

      const state = todoReducer(
        loadingState,
        todoActions.fetchTodosSuccess(todos)
      );

      expect(state.items).toEqual(todos);
      expect(state.loading).toBe(false);
    });

    it('fetchTodosFailure should set error and loading to false', () => {
      const loadingState: TodoState = { ...initialState, loading: true };

      const state = todoReducer(
        loadingState,
        todoActions.fetchTodosFailure('Network error')
      );

      expect(state.error).toBe('Network error');
      expect(state.loading).toBe(false);
    });
  });
});
