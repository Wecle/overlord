import * as React from "react"

import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(({ className, ...props }, ref) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} ref={ref} {...props} />
))
Skeleton.displayName = "Skeleton"

export { Skeleton }
