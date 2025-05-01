import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function SidebarProfileSkeleton() {
  return (
    <Card className="p-4 border-2 border-sidebar-border">
      <div className="flex flex-col items-center">
        {/* Avatar skeleton */}
        <Skeleton className="w-20 h-20 rounded-full mb-2" />
        
        {/* Username skeleton */}
        <Skeleton className="h-6 w-32 mb-2" />
        
        {/* Bio skeleton */}
        <Skeleton className="h-4 w-48 mb-4" />
        
        {/* Button skeleton */}
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </Card>
  );
}

export function SidebarPeopleSkeleton() {
  return (
    <Card className="p-6 border-2 overflow-y-auto max-h-[52vh]">
      {/* Header skeleton */}
      <Skeleton className="h-6 w-24 mb-6" />
      
      {/* People list skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </Card>
  );
} 