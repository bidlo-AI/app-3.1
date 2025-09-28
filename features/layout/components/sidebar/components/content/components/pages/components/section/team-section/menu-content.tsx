import { Plus } from 'lucide-react';
import { MenuItem } from '@/components/menus/menu-item';
import { useQueryState } from 'nuqs';

export const MenuContent = () => {
  // We only need the setter; omit the state to avoid unused var lint.
  const [, setOpen] = useQueryState('new-team');

  return (
    <>
      <MenuItem onClick={() => setOpen('true')}>
        <Plus className="size-4" />
        Add team
      </MenuItem>
      {/* Render the dialog once so it can respond to the hash param */}
    </>
  );
};
