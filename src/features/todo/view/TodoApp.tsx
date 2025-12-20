import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { todoActions } from '@/features/todo/model/todoSlice';
import { selectLoading, selectError } from '@/features/todo/model/todoSelectors';
import { TodoInput } from './TodoInput';
import { TodoList } from './TodoList';
import { TodoFilter } from './TodoFilter';

export const TodoApp = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);

  useEffect(() => {
    dispatch(todoActions.fetchTodos());
  }, [dispatch]);

  return (
    <div className="max-w-lg mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">Todo MVI</h1>
        <p className="text-gray-500 text-sm">
          Redux Toolkit + redux-observable + RxJS
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <TodoInput />

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <>
            <TodoList />
            <TodoFilter />
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            Error: {error}
          </div>
        )}
      </div>

      <footer className="text-center mt-6 text-xs text-gray-400">
        <p>Double-click to edit a todo</p>
        <p className="mt-1">
          Built with{' '}
          <span className="text-indigo-400">MVI Pattern</span> +{' '}
          <span className="text-indigo-400">Functional Programming</span>
        </p>
      </footer>
    </div>
  );
};
