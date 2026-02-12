import { Skeleton } from "~/components/ui/skeleton";

export function TimerViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Stopwatch card */}
      <div className="rounded-xl border border-sidebar-border bg-sidebar p-6">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-16 w-72" />
          <Skeleton className="h-12 w-36 rounded-full" />
          <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 sm:col-span-2" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10 sm:col-span-2" />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-sidebar-border bg-sidebar p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-16" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's entries */}
      <div>
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-sidebar-border bg-sidebar px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-2 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-56" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EntriesViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-sidebar-border bg-sidebar p-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
      </div>

      {/* Date groups */}
      {Array.from({ length: 2 }).map((_, gi) => (
        <div key={gi}>
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="size-3.5" />
            <Skeleton className="h-3 w-24" />
            <div className="h-px flex-1 bg-border" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-sidebar px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-2 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="mt-1 h-3 w-60" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-sidebar-border bg-sidebar p-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-6" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-9 w-[200px]" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-sidebar-border bg-sidebar p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="mt-1 h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, ci) => (
          <div key={ci} className="rounded-xl border border-sidebar-border bg-sidebar p-5">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="size-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="mb-1 flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="rounded-xl border border-sidebar-border bg-sidebar p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsViewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, ci) => (
          <div key={ci} className="rounded-xl border border-sidebar-border bg-sidebar">
            <div className="p-6 pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="px-6 pb-6">
              <Skeleton className="mb-4 h-9 w-full" />
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
