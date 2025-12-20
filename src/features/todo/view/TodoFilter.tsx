import { useAppDispatch, useAppSelector } from '@/store';
import { todoActions } from '@/features/todo/model/todoSlice';
import { selectFilter, selectTodoStats, selectAllCompleted, selectHasTodos } from '@/features/todo/model/todoSelectors';
import type { FilterType } from '@/features/todo/model/types';

const filters: { type: FilterType; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'active', label: 'Active' },
  { type: 'completed', label: 'Completed' },
];

export const TodoFilter = () => {
  const dispatch = useAppDispatch();
  const currentFilter = useAppSelector(selectFilter);
  const stats = useAppSelector(selectTodoStats);
  const allCompleted = useAppSelector(selectAllCompleted);
  const hasTodos = useAppSelector(selectHasTodos);

  if (!hasTodos) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
      {/* Toggle All */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={allCompleted}
          onChange={() => dispatch(todoActions.toggleAll())}
          className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
          title="Toggle all"
        />
        <span className="text-sm text-gray-500">
          {stats.active} item{stats.active !== 1 ? 's' : ''} left
        </span>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-1">
        {filters.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => dispatch(todoActions.setFilter(type))}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentFilter === type
                ? 'bg-indigo-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Clear Completed */}
      <button
        onClick={() => dispatch(todoActions.clearCompleted())}
        disabled={stats.completed === 0}
        className="text-sm text-gray-500 hover:text-red-500 disabled:opacity-0 transition-opacity"
      >
        Clear completed ({stats.completed})
      </button>
    </div>
  );
};
