import { createContext } from 'react';

interface AppContextValue {
  userId?: string;
  name?: string;
  age?: number;
}

export const AppContext = createContext<AppContextValue>({
  userId: '518715',
  name: 'jiangwei',
  age: 30,
});
