import { combineEpics } from 'redux-observable';
import { todoEpics } from '@/features/todo/intent/todoEpic';

export const rootEpic = combineEpics(...todoEpics);
