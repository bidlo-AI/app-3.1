import { Label as RawLabel } from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Label = ({
  children,
  ...props
}: React.ComponentProps<typeof RawLabel>) => (
  <RawLabel
    {...props}
    className={cn(
      "text-[13px] leading-[16px] mt-3.5 mb-1.5 text-muted-foreground font-semibold",
      props.className
    )}
  >
    {children}
  </RawLabel>
);
