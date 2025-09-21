import { Skeleton } from '@/components/ui/skeleton';

export const LoadingContent = () => (
  <div className="flex flex-col gap-1">
    <LoadingContentSection />
    <LoadingContentSection />
  </div>
);

const LoadingContentSection = () => (
  <div className="flex flex-col gap-px mb-3 ">
    <div className="flex items-center gap-2 w-full pl-2  h-7.5 justify-start">
      <Skeleton className="h-4 w-14 bg-hover" />
    </div>
    <LoadingContentRow />
    <LoadingContentRow />
    <LoadingContentRow />
  </div>
);
const LoadingContentRow = () => (
  <div className="flex items-center gap-2 w-full pl-2  h-7.5 justify-start">
    <Skeleton className="size-5 bg-hover" />
    <Skeleton className="h-4 w-30 bg-hover" />
  </div>
);
