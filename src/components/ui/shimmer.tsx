import { cn } from "@/lib/utils";

function Shimmer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      {...props}
      className={cn("absolute inset-0 animate-pulse bg-muted-foreground/10", className)}
    />
  );
}

export { Shimmer };
