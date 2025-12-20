# React MVI Template

React + Redux Toolkit + redux-observable (RxJS) 기반 **MVI (Model-View-Intent)** 패턴 템플릿입니다.

## 목차

- [Features](#features)
- [MVI 패턴이란?](#mvi-패턴이란)
- [왜 MVI 패턴을 사용하나요?](#왜-mvi-패턴을-사용하나요)
- [Quick Start](#quick-start)
- [프로젝트 구조](#프로젝트-구조)
- [각 레이어 상세 설명](#각-레이어-상세-설명)
- [새로운 기능 만들기 (단계별 가이드)](#새로운-기능-만들기-단계별-가이드)
- [Epic 패턴](#epic-패턴)
- [FP 유틸리티](#fp-유틸리티)
- [스크립트](#스크립트)
- [기술 스택](#기술-스택)

## Features

- **MVI Architecture**: 단방향 데이터 흐름의 예측 가능한 상태 관리
- **Redux Toolkit**: 현대적인 Redux 상태 관리
- **redux-observable**: RxJS 기반 사이드 이펙트 처리 (Epic)
- **Functional Programming**: pipe, compose, Option, Result 등 FP 유틸리티
- **TypeScript**: 완벽한 타입 지원
- **Vite**: 빠른 개발 환경
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Vitest**: 빠른 테스트 프레임워크

## MVI 패턴이란?

MVI는 **Model-View-Intent**의 약자로, 단방향 데이터 흐름을 강조하는 아키텍처 패턴입니다.

```
┌─────────────────────────────────────────────────────────────┐
│  View (React Component)                                      │
│    │                                         ▲               │
│    │ dispatch(action)                        │ useSelector   │
│    ▼                                         │               │
│  Intent (Redux Action) ──────────────────► Model (State)    │
│    │                                         ▲               │
│    │ ofType filter                           │               │
│    ▼                                         │               │
│  Epic (RxJS) ────── side effects ────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 각 레이어의 역할

| 레이어 | 구현체 | 설명 |
|--------|--------|------|
| **View** | React Component | 사용자에게 UI를 보여주고, 사용자 입력을 받습니다 |
| **Intent** | Redux Action | 사용자의 "의도"를 표현합니다 (예: "할 일 추가하기") |
| **Model** | Redux State + Reducer | 애플리케이션의 상태를 저장하고 관리합니다 |
| **Side Effects** | redux-observable Epic | API 호출, 로컬 스토리지 저장 등 부수 효과를 처리합니다 |

### 데이터 흐름 예시

사용자가 "할 일 추가" 버튼을 클릭했을 때:

1. **View**: 버튼 클릭 → `dispatch(addTodo({ text: "새 할 일" }))`
2. **Intent**: `addTodo` 액션이 Redux로 전달됨
3. **Model**: Reducer가 액션을 받아 상태를 업데이트
4. **Epic**: 상태 변경을 감지하고 localStorage에 저장 (side effect)
5. **View**: 새로운 상태를 `useSelector`로 받아 UI 업데이트

## 왜 MVI 패턴을 사용하나요?

### 1. 예측 가능한 상태 관리
모든 상태 변경이 Action → Reducer를 통해 일어나므로, 상태가 어떻게 변경되는지 추적하기 쉽습니다.

### 2. 테스트 용이성
각 레이어가 분리되어 있어 단위 테스트가 쉽습니다:
- Reducer: 순수 함수이므로 입력/출력만 테스트
- Selector: 순수 함수이므로 입력/출력만 테스트
- Epic: RxJS의 marble testing으로 비동기 로직 테스트

### 3. 디버깅 용이성
Redux DevTools로 모든 액션과 상태 변화를 시간순으로 확인할 수 있습니다.

### 4. 관심사 분리
UI 로직(View), 비즈니스 로직(Model), 부수 효과(Epic)가 명확히 분리됩니다.

## Quick Start

```bash
# 저장소 클론
git clone https://github.com/yourusername/react-mvi-template.git
cd react-mvi-template

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 테스트 실행
npm run test

# 프로덕션 빌드
npm run build
```

## 프로젝트 구조

```
src/
├── store/                    # Redux 스토어 설정
│   ├── store.ts              # 스토어 생성 + Epic 미들웨어 설정
│   ├── rootReducer.ts        # 모든 리듀서 통합
│   ├── rootEpic.ts           # 모든 Epic 통합
│   ├── hooks.ts              # 타입이 지정된 커스텀 훅
│   └── types.ts              # 루트 타입 정의
│
├── shared/
│   └── fp/                   # 함수형 프로그래밍 유틸리티
│       ├── pipe.ts           # 왼쪽→오른쪽 함수 합성
│       ├── compose.ts        # 오른쪽→왼쪽 함수 합성
│       ├── curry.ts          # 함수 커링
│       ├── option.ts         # Option<T> = Some | None (null 안전 처리)
│       ├── result.ts         # Result<E, T> = Ok | Err (에러 처리)
│       └── array.ts          # 배열 유틸리티
│
├── features/                 # 기능별 모듈
│   └── todo/                 # Todo 기능 예시
│       ├── model/            # Model 레이어 (상태 관리)
│       │   ├── types.ts      # 타입 정의
│       │   ├── todoSlice.ts  # Redux Slice (상태 + 리듀서 + 액션)
│       │   └── todoSelectors.ts # 상태 조회 셀렉터
│       │
│       ├── intent/           # Intent 레이어 (부수 효과)
│       │   └── todoEpic.ts   # RxJS Epic
│       │
│       ├── view/             # View 레이어 (UI)
│       │   ├── TodoApp.tsx   # 메인 컨테이너 컴포넌트
│       │   ├── TodoList.tsx  # 할 일 목록
│       │   ├── TodoItem.tsx  # 개별 할 일 항목
│       │   ├── TodoInput.tsx # 입력 폼
│       │   └── TodoFilter.tsx # 필터 컨트롤
│       │
│       └── index.ts          # 배럴 파일 (외부 export)
│
├── pages/                    # 페이지 컴포넌트
│   ├── HomePage.tsx
│   ├── TodoPage.tsx
│   └── NotFoundPage.tsx
│
├── router/                   # React Router 설정
│   ├── routes.tsx
│   └── RootLayout.tsx
│
├── App.tsx                   # 루트 앱 컴포넌트
└── main.tsx                  # 앱 진입점
```

## 각 레이어 상세 설명

### Model 레이어 (`model/`)

Model 레이어는 **애플리케이션의 상태**를 정의하고 관리합니다.

#### types.ts - 타입 정의
```typescript
// 개별 할 일 항목의 타입
export interface Todo {
  readonly id: string;      // 고유 식별자
  readonly text: string;    // 할 일 내용
  readonly completed: boolean; // 완료 여부
}

// 전체 Todo 상태의 타입
export interface TodoState {
  readonly items: readonly Todo[];  // 할 일 목록
  readonly loading: boolean;        // 로딩 상태
  readonly filter: 'all' | 'active' | 'completed'; // 필터
}
```

> **readonly를 사용하는 이유**: 상태의 불변성을 보장하기 위해 모든 속성을 readonly로 선언합니다. 이렇게 하면 실수로 상태를 직접 수정하는 것을 방지할 수 있습니다.

#### todoSlice.ts - Redux Slice
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: TodoState = {
  items: [],
  loading: false,
  filter: 'all',
};

export const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    // 할 일 추가
    addTodo: (state, action: PayloadAction<{ id: string; text: string }>) => {
      state.items.push({ ...action.payload, completed: false });
    },
    // 완료 상태 토글
    toggleTodo: (state, action: PayloadAction<string>) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
    // 할 일 삭제
    removeTodo: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    },
  },
});

// 액션 생성자 export
export const todoActions = todoSlice.actions;
// 리듀서 export
export const todoReducer = todoSlice.reducer;
```

> **createSlice란?**: Redux Toolkit에서 제공하는 함수로, 액션 타입, 액션 생성자, 리듀서를 한 번에 생성합니다. 보일러플레이트 코드를 크게 줄여줍니다.

#### todoSelectors.ts - 셀렉터
```typescript
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

// 기본 셀렉터: 상태에서 직접 값을 가져옴
const selectTodoState = (state: RootState) => state.todo;
const selectItems = (state: RootState) => state.todo.items;
const selectFilter = (state: RootState) => state.todo.filter;

// 메모이제이션 셀렉터: 입력이 바뀌지 않으면 이전 결과를 재사용
export const selectFilteredTodos = createSelector(
  [selectItems, selectFilter],
  (items, filter) => {
    switch (filter) {
      case 'active':
        return items.filter(todo => !todo.completed);
      case 'completed':
        return items.filter(todo => todo.completed);
      default:
        return items;
    }
  }
);

// 통계 셀렉터
export const selectTodoStats = createSelector(
  [selectItems],
  (items) => ({
    total: items.length,
    active: items.filter(t => !t.completed).length,
    completed: items.filter(t => t.completed).length,
  })
);
```

> **createSelector를 사용하는 이유**: 셀렉터의 결과를 메모이제이션하여 불필요한 재계산을 방지합니다. 입력 값이 변하지 않으면 이전에 계산한 결과를 그대로 반환합니다.

### Intent 레이어 (`intent/`)

Intent 레이어는 **부수 효과(side effects)**를 처리합니다. API 호출, 로컬 스토리지 저장, 로깅 등이 여기에 해당합니다.

#### todoEpic.ts - RxJS Epic
```typescript
import { Epic, ofType } from 'redux-observable';
import { switchMap, map, catchError, debounceTime, withLatestFrom, tap, ignoreElements } from 'rxjs/operators';
import { from, of } from 'rxjs';

// 앱 시작 시 localStorage에서 할 일 목록 불러오기
const fetchTodosEpic: Epic = (action$) =>
  action$.pipe(
    ofType(todoActions.fetchTodos.type),  // fetchTodos 액션만 필터링
    switchMap(() => {
      const saved = localStorage.getItem('todos');
      const todos = saved ? JSON.parse(saved) : [];
      return of(todoActions.fetchTodosSuccess(todos));
    })
  );

// 상태가 변경될 때마다 localStorage에 자동 저장 (500ms 디바운스)
const autoSaveEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(
      todoActions.addTodo.type,
      todoActions.toggleTodo.type,
      todoActions.removeTodo.type
    ),
    debounceTime(500),  // 500ms 동안 추가 액션이 없을 때만 실행
    withLatestFrom(state$),  // 현재 상태 가져오기
    tap(([, state]) => {
      localStorage.setItem('todos', JSON.stringify(state.todo.items));
    }),
    ignoreElements()  // 새로운 액션을 발생시키지 않음
  );

// Epic 배열로 export (rootEpic에서 통합)
export const todoEpics = [fetchTodosEpic, autoSaveEpic];
```

> **Epic이란?**: Redux-Observable에서 부수 효과를 처리하는 함수입니다. 액션 스트림을 받아 새로운 액션 스트림을 반환합니다. RxJS의 강력한 연산자를 사용하여 복잡한 비동기 로직을 선언적으로 처리할 수 있습니다.

### View 레이어 (`view/`)

View 레이어는 **사용자 인터페이스**를 담당합니다.

```typescript
import { useAppDispatch, useAppSelector } from '@/store';
import { todoActions } from '../model/todoSlice';
import { selectFilteredTodos } from '../model/todoSelectors';

export const TodoList = () => {
  // 타입이 지정된 dispatch 훅
  const dispatch = useAppDispatch();
  // 필터링된 할 일 목록 구독
  const todos = useAppSelector(selectFilteredTodos);

  const handleToggle = (id: string) => {
    dispatch(todoActions.toggleTodo(id));
  };

  if (todos.length === 0) {
    return <p className="text-gray-500">할 일이 없습니다</p>;
  }

  return (
    <ul className="space-y-2">
      {todos.map(todo => (
        <li
          key={todo.id}
          onClick={() => handleToggle(todo.id)}
          className={todo.completed ? 'line-through text-gray-400' : ''}
        >
          {todo.text}
        </li>
      ))}
    </ul>
  );
};
```

> **useAppDispatch와 useAppSelector**: `store/hooks.ts`에 정의된 타입이 지정된 훅입니다. 일반 `useDispatch`와 `useSelector` 대신 이 훅을 사용하면 TypeScript의 타입 추론이 정확하게 작동합니다.

## 새로운 기능 만들기 (단계별 가이드)

예시: "사용자(User)" 기능을 추가한다고 가정합니다.

### 1단계: 디렉토리 구조 생성

```
src/features/user/
├── model/
│   ├── types.ts
│   ├── userSlice.ts
│   └── userSelectors.ts
├── intent/
│   └── userEpic.ts
├── view/
│   └── UserProfile.tsx
└── index.ts
```

### 2단계: 타입 정의 (`model/types.ts`)

```typescript
export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface UserState {
  readonly currentUser: User | null;
  readonly loading: boolean;
  readonly error: string | null;
}
```

### 3단계: Slice 생성 (`model/userSlice.ts`)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState, User } from './types';

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 로그인 시작
    login: (state) => {
      state.loading = true;
      state.error = null;
    },
    // 로그인 성공
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.loading = false;
    },
    // 로그인 실패
    loginFailure: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    // 로그아웃
    logout: (state) => {
      state.currentUser = null;
    },
  },
});

export const userActions = userSlice.actions;
export const userReducer = userSlice.reducer;
```

### 4단계: 셀렉터 생성 (`model/userSelectors.ts`)

```typescript
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

export const selectUserState = (state: RootState) => state.user;
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;

export const selectIsLoggedIn = createSelector(
  [selectCurrentUser],
  (user) => user !== null
);
```

### 5단계: Epic 생성 (`intent/userEpic.ts`)

```typescript
import { Epic, ofType } from 'redux-observable';
import { switchMap, map, catchError } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { userActions } from '../model/userSlice';

// API 함수 (실제로는 별도 파일에서 import)
const loginApi = async (credentials: { email: string; password: string }) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return response.json();
};

const loginEpic: Epic = (action$) =>
  action$.pipe(
    ofType(userActions.login.type),
    switchMap((action) =>
      from(loginApi(action.payload)).pipe(
        map((user) => userActions.loginSuccess(user)),
        catchError((error) => of(userActions.loginFailure(error.message)))
      )
    )
  );

export const userEpics = [loginEpic];
```

### 6단계: 스토어에 등록

**rootReducer.ts**
```typescript
import { combineReducers } from '@reduxjs/toolkit';
import { todoReducer } from '@/features/todo';
import { userReducer } from '@/features/user';

export const rootReducer = combineReducers({
  todo: todoReducer,
  user: userReducer,  // 추가
});
```

**rootEpic.ts**
```typescript
import { combineEpics } from 'redux-observable';
import { todoEpics } from '@/features/todo';
import { userEpics } from '@/features/user';

export const rootEpic = combineEpics(
  ...todoEpics,
  ...userEpics,  // 추가
);
```

### 7단계: View 컴포넌트 생성 (`view/UserProfile.tsx`)

```typescript
import { useAppDispatch, useAppSelector } from '@/store';
import { userActions } from '../model/userSlice';
import { selectCurrentUser, selectIsLoggedIn } from '../model/userSelectors';

export const UserProfile = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  if (!isLoggedIn) {
    return <button onClick={() => dispatch(userActions.login())}>로그인</button>;
  }

  return (
    <div>
      <p>안녕하세요, {user?.name}님!</p>
      <button onClick={() => dispatch(userActions.logout())}>로그아웃</button>
    </div>
  );
};
```

## Epic 패턴

### 자주 사용되는 패턴

| 패턴 | 사용 사례 | RxJS 연산자 |
|------|----------|-------------|
| API 호출 | 서버 통신 | `switchMap`, `mergeMap` |
| 디바운싱 | 자동 저장, 검색 | `debounceTime` |
| 낙관적 업데이트 | 빠른 UI 반응 | `withLatestFrom`, `catchError` |
| 폴링 | 실시간 동기화 | `interval`, `takeUntil` |
| 순차 실행 | 연속된 액션 | `concatMap` |

### 패턴별 예제 코드

#### API 호출 (기본)
```typescript
const fetchDataEpic: Epic = (action$) =>
  action$.pipe(
    ofType(actions.fetchData.type),
    switchMap(() =>
      from(api.getData()).pipe(
        map(data => actions.fetchDataSuccess(data)),
        catchError(error => of(actions.fetchDataFailure(error.message)))
      )
    )
  );
```

#### 디바운싱 (검색)
```typescript
const searchEpic: Epic = (action$) =>
  action$.pipe(
    ofType(actions.search.type),
    debounceTime(300),  // 300ms 동안 입력이 없을 때만 실행
    switchMap((action) =>
      from(api.search(action.payload)).pipe(
        map(results => actions.searchSuccess(results)),
        catchError(error => of(actions.searchFailure(error.message)))
      )
    )
  );
```

#### 낙관적 업데이트
```typescript
const optimisticUpdateEpic: Epic = (action$, state$) =>
  action$.pipe(
    ofType(actions.updateItem.type),
    withLatestFrom(state$),
    switchMap(([action, state]) => {
      const originalItem = state.items.find(i => i.id === action.payload.id);
      return from(api.updateItem(action.payload)).pipe(
        map(() => actions.updateItemSuccess()),
        catchError(error => of(
          actions.updateItemFailure(error.message),
          actions.revertItem(originalItem)  // 실패 시 원래 상태로 복원
        ))
      );
    })
  );
```

#### 폴링 (실시간 데이터)
```typescript
const pollingEpic: Epic = (action$) =>
  action$.pipe(
    ofType(actions.startPolling.type),
    switchMap(() =>
      interval(5000).pipe(  // 5초마다 실행
        takeUntil(action$.pipe(ofType(actions.stopPolling.type))),
        switchMap(() =>
          from(api.getData()).pipe(
            map(data => actions.updateData(data)),
            catchError(() => EMPTY)  // 에러 무시
          )
        )
      )
    )
  );
```

## FP 유틸리티

`shared/fp/` 디렉토리에는 함수형 프로그래밍을 위한 유틸리티가 있습니다.

### pipe - 함수 합성 (왼쪽→오른쪽)

데이터를 여러 함수를 통해 순차적으로 변환합니다.

```typescript
import { pipe } from '@/shared/fp';

// 숫자를 변환하는 예제
const result = pipe(
  5,
  x => x * 2,      // 10
  x => x + 1,      // 11
  x => x.toString() // "11"
);

// 배열 처리 예제
const processUsers = (users: User[]) =>
  pipe(
    users,
    filter(u => u.isActive),
    map(u => u.name),
    take(5)
  );
```

### Option - null 안전 처리

`null`이나 `undefined`를 안전하게 처리합니다.

```typescript
import { some, none, map, getOrElse, flatMap } from '@/shared/fp';

// 0으로 나누기 방지
const safeDivide = (a: number, b: number) =>
  b === 0 ? none : some(a / b);

const result = pipe(
  some(100),
  flatMap(n => safeDivide(n, 2)),  // some(50)
  map(n => n * 2),                  // some(100)
  getOrElse(() => 0)                // 100
);

// 객체 속성 안전하게 접근
const getName = (user: User | null) =>
  pipe(
    fromNullable(user),
    map(u => u.name),
    getOrElse(() => '익명')
  );
```

### Result - 에러 처리

에러가 발생할 수 있는 연산을 안전하게 처리합니다.

```typescript
import { ok, err, map, fold, tryCatch } from '@/shared/fp';

// JSON 파싱
const parseJson = (input: string) =>
  tryCatch(
    () => JSON.parse(input),
    (error) => `파싱 에러: ${error.message}`
  );

const result = pipe(
  parseJson('{"name": "홍길동"}'),
  map(data => data.name),
  fold(
    error => `에러 발생: ${error}`,
    name => `안녕하세요, ${name}님!`
  )
);
// 결과: "안녕하세요, 홍길동님!"

// 에러 케이스
const errorResult = pipe(
  parseJson('잘못된 JSON'),
  fold(
    error => `에러 발생: ${error}`,
    name => `안녕하세요, ${name}님!`
  )
);
// 결과: "에러 발생: 파싱 에러: ..."
```

### 배열 유틸리티

```typescript
import { map, filter, groupBy, partition, zip } from '@/shared/fp/array';

// 그룹화
const usersByRole = groupBy(users, u => u.role);
// { admin: [...], user: [...] }

// 분할
const [activeUsers, inactiveUsers] = partition(users, u => u.isActive);

// 두 배열 결합
const pairs = zip([1, 2, 3], ['a', 'b', 'c']);
// [[1, 'a'], [2, 'b'], [3, 'c']]
```

## 스크립트

```bash
npm run dev           # 개발 서버 시작 (http://localhost:5173)
npm run build         # 프로덕션 빌드 (타입 체크 포함)
npm run preview       # 프로덕션 빌드 미리보기
npm run test          # 테스트 실행 (watch 모드)
npm run test:ui       # 테스트 UI로 실행
npm run test:coverage # 테스트 커버리지 리포트 생성
npm run lint          # ESLint로 코드 검사
npm run typecheck     # TypeScript 타입 체크
```

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.2 | UI 라이브러리 |
| Redux Toolkit | 2.5 | 상태 관리 |
| redux-observable | 3.0 | 사이드 이펙트 처리 |
| RxJS | 7.8 | 반응형 프로그래밍 |
| TypeScript | 5.6 | 타입 안전성 |
| Vite | 6.0 | 빌드 도구 |
| Tailwind CSS | 3.4 | 스타일링 |
| Vitest | 2.1 | 테스트 프레임워크 |
| React Router | 7.11 | 라우팅 |

## License

MIT
