import type { Role } from '../app/router';
import type { PersistedState } from './types';

export type Action =
  | { type: 'setRole'; role: Role | null }
  | { type: 'reset'; state: PersistedState };

export function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'setRole':
      return { ...state, session: { ...state.session, role: action.role } };
    case 'reset':
      return action.state;
  }
}
