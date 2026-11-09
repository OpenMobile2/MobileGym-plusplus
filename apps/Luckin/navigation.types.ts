export type Primitive = string | number | boolean | null;
export type EntryPointDeclaration = 'none' | 'home' | 'deepLink' | 'both';
export type GestureType = 'tap' | 'longPress' | 'doubleTap' | 'back';

export interface ActionDeclaration {
  id: string;
  label: string;
  description?: string;
  behavior: 'toggle' | 'select' | 'submit' | 'input' | 'open' | 'close' | 'modify' | 'other';
  scope?: 'item';
  paramsSchema?: Record<string, 'string' | 'number' | 'boolean'>;
}

export interface RouteDeclaration {
  path: string;
  component: string;
  params: Record<string, 'string' | 'number'>;
  entryPoint: EntryPointDeclaration;
  scrollContainers?: readonly { name: string; direction: 'vertical' | 'horizontal'; description: string }[];
  uiStates: Array<{
    id: string;
    search: Record<string, string | null>;
    description: string;
    actions?: ActionDeclaration[];
  }>;
  queryParams: Record<string, 'string' | 'number'>;
  description: string;
}

export interface FromConstraint {
  path: string;
  search?: Record<string, string | '*' | null>;
}

export interface TransitionDeclaration {
  id: string;
  from: '*' | string | FromConstraint | Array<'*' | string | FromConstraint>;
  to: string;
  search: Record<string, string | null>;
  searchParams: Record<string, 'string' | 'number'>;
  preserveParams?: string[];
  mode: 'push' | 'replace';
  params: Record<string, 'string' | 'number'>;
  label: string;
  ui: { placement: 'topbar' | 'tabbar' | 'content' | 'fab' | 'none'; icon: string; gesture: GestureType };
}

export interface NavigationDeclaration {
  app: string;
  routes: RouteDeclaration[];
  transitions: TransitionDeclaration[];
  capabilities: { historyBack: boolean };
}
