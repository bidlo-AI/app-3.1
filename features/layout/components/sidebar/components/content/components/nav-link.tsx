'use client';
import { memo } from 'react';
import Link from 'next/link';
import { SquarePlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const buttonClassName =
  'cursor-pointer flex items-center gap-2 hover:[&_svg]:text-muted-foreground-opaque px-2 justify-start font-medium w-full text-muted-foreground-opaque h-[30px] truncate';

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onAddChild?: () => void;
  indent?: number;
};

const NavLinkComponent = ({ href, label, icon, onAddChild, indent = 0 }: NavLinkProps) => {
  // Selected state based on current route
  const pathname = usePathname();
  const isSelected = pathname === href;

  return (
    <div className={cn('group/nav-row flex items-center h-7.5 rounded-md hover:bg-hover', isSelected && 'bg-hover')}>
      {/* Enable Next.js route prefetching for faster navigation */}
      <Link
        href={href}
        prefetch
        aria-label={label}
        style={{ padding: '0 8px', paddingLeft: 8 + indent * 8 }}
        className={cn('flex-1 min-w-0', buttonClassName)}
      >
        {icon}
        {/* Only the text should change color on selection, not the icon */}
        <span className={cn(isSelected && 'text-foreground')}>{label}</span>
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

type NavButtonProps = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

const NavButtonComponent = ({ label, icon, onClick }: NavButtonProps) => {
  const ButtonContent = (
    <div
      role="button"
      onClick={onClick}
      aria-label={label}
      className={cn(buttonClassName, 'rounded-md  hover:bg-hover')}
      style={{ padding: '0 8px' }}
    >
      {icon}
      {label}
    </div>
  );
  return ButtonContent;
};

export const NavButton = memo(NavButtonComponent);
