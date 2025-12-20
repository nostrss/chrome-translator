import { describe, it, expect } from 'vitest';
import {
  selectItems,
  selectFilter,
  selectFilteredTodos,
  selectTodoStats,
  selectAllCompleted,
  selectHasTodos,
} from '@/features/todo/model/todoSelectors';
import type { RootState } from '@/store';
import type { Todo } from '@/features/todo/model/types';

const createState = (
  items: Todo[] = [],
  filter: 'all' | 'active' | 'completed' = 'all'
): RootState => ({
  todo: {
    items,
    filter,
    loading: false,
    error: null,
  },
});

const sampleTodos: Todo[] = [
  { id: '1', text: 'Active 1', completed: false, createdAt: 1 },
  { id: '2', text: 'Completed 1', completed: true, createdAt: 2 },
  { id: '3', text: 'Active 2', completed: false, createdAt: 3 },
  { id: '4', text: 'Completed 2', completed: true, createdAt: 4 },
];

describe('todoSelectors', () => {
  describe('selectItems', () => {
    it('should return all items', () => {
      const state = createState(sampleTodos);
      expect(selectItems(state)).toHaveLength(4);
    });
  });

  describe('selectFilter', () => {
    it('should return current filter', () => {
      const state = createState([], 'active');
      expect(selectFilter(state)).toBe('active');
    });
  });

  describe('selectFilteredTodos', () => {
    it('should return all todos when filter is "all"', () => {
      const state = createState(sampleTodos, 'all');
      expect(selectFilteredTodos(state)).toHaveLength(4);
    });

    it('should return only active todos when filter is "active"', () => {
      const state = createState(sampleTodos, 'active');
      const filtered = selectFilteredTodos(state);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => !t.completed)).toBe(true);
    });

    it('should return only completed todos when filter is "completed"', () => {
      const state = createState(sampleTodos, 'completed');
      const filtered = selectFilteredTodos(state);

      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.completed)).toBe(true);
    });
  });

  describe('selectTodoStats', () => {
    it('should return correct statistics', () => {
      const state = createState(sampleTodos);
      const stats = selectTodoStats(state);

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(2);
      expect(stats.completed).toBe(2);
    });

    it('should return zeros for empty list', () => {
      const state = createState([]);
      const stats = selectTodoStats(state);

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.completed).toBe(0);
    });
  });

  describe('selectAllCompleted', () => {
    it('should return true when all todos are completed', () => {
      const allCompleted: Todo[] = [
        { id: '1', text: 'Done 1', completed: true, createdAt: 1 },
        { id: '2', text: 'Done 2', completed: true, createdAt: 2 },
      ];
      const state = createState(allCompleted);

      expect(selectAllCompleted(state)).toBe(true);
    });

    it('should return false when some todos are incomplete', () => {
      const state = createState(sampleTodos);

      expect(selectAllCompleted(state)).toBe(false);
    });

    it('should return false for empty list', () => {
      const state = createState([]);

      expect(selectAllCompleted(state)).toBe(false);
    });
  });

  describe('selectHasTodos', () => {
    it('should return true when there are todos', () => {
      const state = createState(sampleTodos);

      expect(selectHasTodos(state)).toBe(true);
    });

    it('should return false for empty list', () => {
      const state = createState([]);

      expect(selectHasTodos(state)).toBe(false);
    });
  });
});
