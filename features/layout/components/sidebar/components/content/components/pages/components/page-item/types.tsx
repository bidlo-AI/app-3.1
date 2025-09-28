import { Id, Doc } from '@/convex/_generated/dataModel';

//types
export type BaseArgs = {
  id: Id<'blocks'>;
  title: string;
  teamId?: Id<'teams'>;
  /** Optional block icon for this page */
  icon?: Doc<'blocks'>['icon'];
};

export type HandleAddPage = (args: {
  scope: 'private' | 'team';
  teamId?: Id<'teams'>;
  parentId?: Id<'blocks'>;
  title?: string;
}) => Promise<void>;
