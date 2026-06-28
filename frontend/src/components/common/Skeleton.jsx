export const SkeletonBox = ({ className = '' }) => (
  <div className={`shimmer rounded-xl ${className}`} />
)

export const SkeletonCard = () => (
  <div className="card space-y-4">
    <SkeletonBox className="h-4 w-24" />
    <SkeletonBox className="h-8 w-36" />
    <SkeletonBox className="h-3 w-full" />
  </div>
)

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card space-y-3">
    <SkeletonBox className="h-5 w-32 mb-4" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 py-2">
        <SkeletonBox className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-4 w-3/4" />
          <SkeletonBox className="h-3 w-1/2" />
        </div>
        <SkeletonBox className="h-5 w-20" />
      </div>
    ))}
  </div>
)

export const SkeletonDashboard = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonBox className="h-72 w-full" />
      <SkeletonBox className="h-72 w-full" />
    </div>
  </div>
)
