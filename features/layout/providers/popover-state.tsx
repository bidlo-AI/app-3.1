import { observable } from '@legendapp/state';

// Create observable states for each form
export const popOverState$ = observable<PopOverState>({});

type PopOverState = Record<
  string, //<-- teh id of the popover
  {
    open: boolean;
    children?: PopOverState;
  }
>;
