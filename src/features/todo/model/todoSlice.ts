import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Todo, TodoState, FilterType } from '@/features/todo/model/types';

const initialState: TodoState = {
  items: [],
  filter: 'all',
  loading: false,
  error: null,
};

export const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    // === Synchronous Intent Actions ===
    addTodo: (state, action: PayloadAction<{ id: string; text: string }>) => {
      state.items.push({
        id: action.payload.id,
        text: action.payload.text,
        completed: false,
        createdAt: Date.now(),
      });
    },

    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },

    removeTodo: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },

    updateTodoText: (
      state,
      action: PayloadAction<{ id: string; text: string }>
    ) => {
      const todo = state.items.find((t) => t.id === action.payload.id);
      if (todo) {
        todo.text = action.payload.text;
      }
    },

    setFilter: (state, action: PayloadAction<FilterType>) => {
      state.filter = action.payload;
    },

    clearCompleted: (state) => {
      state.items = state.items.filter((t) => !t.completed);
    },

    toggleAll: (state) => {
      const allCompleted = state.items.every((t) => t.completed);
      state.items.forEach((t) => {
        t.completed = !allCompleted;
      });
    },

    // === Async Intent Actions (Epic triggers) ===
    fetchTodos: (state) => {
      state.loading = true;
      state.error = null;
    },

    fetchTodosSuccess: (state, action: PayloadAction<Todo[]>) => {
      state.items = action.payload;
      state.loading = false;
    },

    fetchTodosFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // For optimistic updates rollback
    revertTodo: (state, action: PayloadAction<Todo>) => {
      const index = state.items.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
});

export const todoActions = todoSlice.actions;
export const todoReducer = todoSlice.reducer;

export type TodoAction = ReturnType<
  (typeof todoActions)[keyof typeof todoActions]
>;
