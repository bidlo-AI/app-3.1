import { Icon } from '@/assets/Icon';
import { MoreMenu } from '@/features/layout/components/sidebar/components/content/components/pages/components/buttons/more-button';
import { DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { LogoutButton } from '@/features/auth/components/header/menu/logout';
// import { Progress } from "@/features/auth/components/layout-onboarding/header/progress";

export function Header({
  title,
  // hideProgress,
}: {
  title: string;
  // hideProgress?: boolean;
}) {
  return (
    <div className="px-3 h-11 flex justify-between items-center text-sm">
      <div className="flex items-center gap-2">
        <a
          href="https://bidlo.ai"
          className="rounded bg-foreground text-background size-5 flex items-center justify-center"
        >
          <Icon height={14} />
        </a>
        <div className="border-l h-5 mx-0.5" />
        <p className="font-medium">{title}</p>
        {/* {!hideProgress && <Progress />} */}
      </div>
      <MoreMenu className="text-muted-foreground">
        <DropdownMenuGroup>
          <LogoutButton />
        </DropdownMenuGroup>
      </MoreMenu>
    </div>
  );
}
