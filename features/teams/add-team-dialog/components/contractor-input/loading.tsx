import { Skeleton } from "@/components/ui/skeleton";

export const LoadingList = () => (
  <div className="p-1">
    <LoadingBar />
    <LoadingBar />
    <LoadingBar />
    <LoadingBar />
    <LoadingBar />
  </div>
);

const LoadingBar = () => (
  <div className="py-0.5 w-full">
    <Skeleton className="h-7 rounded-[6px] w-full bg-hover" />
  </div>
);
