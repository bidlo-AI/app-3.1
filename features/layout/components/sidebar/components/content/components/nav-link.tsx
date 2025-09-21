import { memo } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SquarePlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const buttonClassName = 'px-2 justify-start font-medium w-full text-muted-foreground-opaque h-[30px] truncate';

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onAddChild?: () => void;
  indent?: number;
};

const NavLinkComponent = ({ href, label, icon, onAddChild, indent = 0 }: NavLinkProps) => {
  return (
    <div className="group/nav-row flex items-center h-7.5 rounded hover:bg-hover">
      {/* Enable Next.js route prefetching for faster navigation */}
      <Link href={href} prefetch aria-label={label} className="flex-1 min-w-0">
        <Button
          className={buttonClassName}
          style={{ padding: '0 8px', paddingLeft: 8 + indent * 8 }}
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
                'opacity-0 group-hover/nav-row:opacity-100 focus:opacity-100 transition-opacity duration-150 px-1',
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

export const NavLink = memo(NavLinkComponent);

type NavButtonProps = { label: string; icon: React.ReactNode; onClick: () => void };

const NavButtonComponent = ({ label, icon, onClick }: NavButtonProps) => {
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

export const NavButton = memo(NavButtonComponent);
