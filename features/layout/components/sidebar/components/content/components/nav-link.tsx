import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SquarePlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const buttonClassName = 'px-2 justify-start font-medium w-full text-muted-foreground-opaque h-[30px] truncate';

export const NavLink = ({
  href,
  label,
  icon,
  onAddChild,
  indent = 0,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onAddChild?: () => void;
  indent?: number;
}) => {
  return (
    <div className="group flex items-center">
      <Link href={href} aria-label={label} className="flex-1 min-w-0">
        <Button
          className={buttonClassName}
          style={{ padding: '0 8px', paddingLeft: 8 + indent * 12 }}
          variant="ghost"
          size="sm"
        >
          {icon}
          {label}
        </Button>
      </Link>
      {onAddChild && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label="Add subpage"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddChild();
              }}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1',
                'text-muted-foreground-opaque',
              )}
            >
              <SquarePlus className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Add subpage</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export const NavButton = ({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) => {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      aria-label={label}
      className={buttonClassName}
      style={{ padding: '0 8px' }}
    >
      {icon}
      {label}
    </Button>
  );
};
