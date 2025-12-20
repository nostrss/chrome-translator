import { combineReducers } from '@reduxjs/toolkit';
import { todoReducer } from '@/features/todo/model/todoSlice';

export const rootReducer = combineReducers({
  todo: todoReducer,
});
