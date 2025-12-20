import { useState, useCallback, type FormEvent } from 'react';
import { useAppDispatch } from '@/store';
import { todoActions } from '@/features/todo/model/todoSlice';

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const TodoInput = () => {
  const [text, setText] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (trimmed) {
        dispatch(todoActions.addTodo({ id: generateId(), text: trimmed }));
        setText('');
      }
    },
    [text, dispatch]
  );

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        autoFocus
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg
                   hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500
                   transition-colors disabled:opacity-50"
        disabled={!text.trim()}
      >
        Add
      </button>
    </form>
  );
};
