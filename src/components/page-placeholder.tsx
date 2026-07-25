import type { LucideIcon } from "lucide-react";

export function PagePlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
