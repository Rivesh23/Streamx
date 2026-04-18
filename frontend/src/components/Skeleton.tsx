import { memo } from 'react';

export const Skeleton = memo(({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
));

export const PosterSkeleton = memo(() => (
  <div className="flex-none w-52 aspect-[2/3] space-y-4">
    <Skeleton className="w-full h-full rounded-[2rem]" />
  </div>
));

export const RowSkeleton = memo(() => (
  <div className="space-y-6 px-12 py-8">
    <Skeleton className="h-4 w-48 mb-6" />
    <div className="flex gap-4 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <PosterSkeleton key={i} />
      ))}
    </div>
  </div>
));

export const HeroSkeleton = memo(() => (
  <div className="relative h-screen w-full bg-dark overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-black/80" />
    <div className="absolute inset-0 flex flex-col justify-end px-20 pb-32">
      <Skeleton className="h-20 w-3/4 mb-8" />
      <Skeleton className="h-6 w-1/2 mb-12" />
      <div className="flex gap-6">
        <Skeleton className="h-16 w-40 rounded-full" />
        <Skeleton className="h-16 w-40 rounded-full" />
      </div>
    </div>
  </div>
));
