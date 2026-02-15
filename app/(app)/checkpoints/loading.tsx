import Skeleton from "@/components/Skeleton"

export default function CheckpointsLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
        <Skeleton className="h-60" />
      </div>
    </div>
  )
}
