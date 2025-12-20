import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { todoActions } from '@/features/todo/model/todoSlice';
import type { Todo } from '@/features/todo/model/types';

interface TodoItemProps {
  readonly todo: Todo;
}

export const TodoItem = memo(({ todo }: TodoItemProps) => {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = useCallback(() => {
    dispatch(todoActions.toggleTodo(todo.id));
  }, [dispatch, todo.id]);

  const handleRemove = useCallback(() => {
    dispatch(todoActions.removeTodo(todo.id));
  }, [dispatch, todo.id]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditText(todo.text);
  }, [todo.text]);

  const handleSubmit = useCallback(() => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      dispatch(todoActions.updateTodoText({ id: todo.id, text: trimmed }));
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  }, [editText, todo.id, todo.text, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        setEditText(todo.text);
        setIsEditing(false);
      }
    },
    [handleSubmit, todo.text]
  );

  if (isEditing) {
    return (
      <li className="flex items-center p-3 bg-white border border-indigo-300 rounded-lg mb-2 shadow-sm">
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg mb-2 shadow-sm hover:shadow transition-shadow group">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        className="w-5 h-5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
      />
      <span
        onDoubleClick={handleDoubleClick}
        className={`flex-1 cursor-pointer select-none ${
          todo.completed ? 'line-through text-gray-400' : 'text-gray-700'
        }`}
        title="Double-click to edit"
      >
        {todo.text}
      </span>
      <button
        onClick={handleRemove}
        className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded
                   opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </li>
  );
});

TodoItem.displayName = 'TodoItem';
