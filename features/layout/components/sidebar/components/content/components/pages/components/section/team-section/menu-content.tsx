import { Plus } from 'lucide-react';
import { MenuItem } from '@/components/menus/menu-item';
import { useQueryState } from 'nuqs';

export const MenuContent = () => {
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
