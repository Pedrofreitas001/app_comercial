"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PERIODO_OPTIONS, type PeriodoPreset } from "@/lib/mock-data";

export function PeriodoFilter({
  value,
  onChange,
  className,
}: {
  value: PeriodoPreset;
  onChange: (value: PeriodoPreset) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v as PeriodoPreset) ?? "todos")}>
      <SelectTrigger className={className ?? "sm:w-44"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODO_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
