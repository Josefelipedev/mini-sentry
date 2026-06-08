import type { ResolvedConfig } from './config';
import type { BreadcrumbEntry } from '../types';
import { Throttle } from '../utils/throttle';

export interface SdkState {
  config: ResolvedConfig | null;
  initialized: boolean;
  breadcrumbs: BreadcrumbEntry[];
  sessionId: string | null;
  userId: string | null;
  throttle: Throttle;
}

const state: SdkState = {
  config: null,
  initialized: false,
  breadcrumbs: [],
  sessionId: null,
  userId: null,
  throttle: new Throttle(),
};

export function getState(): SdkState {
  return state;
}

export function setState(updates: Partial<SdkState>): void {
  Object.assign(state, updates);
}
