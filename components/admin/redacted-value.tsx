"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import { isSensitiveField, formatSensitiveValue } from "@/lib/admin/redaction"

interface RedactedValueProps {
  fieldKey: string
  value: any
  className?: string
}

export function RedactedValue({ fieldKey, value, className }: RedactedValueProps) {
  const [revealed, setRevealed] = useState(false)
  const sensitive = isSensitiveField(fieldKey)

  if (!sensitive) {
    return <span className={className}>{String(value)}</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className={className}>{formatSensitiveValue(fieldKey, value, revealed)}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setRevealed(!revealed)}
        className="h-6 w-6 p-0"
        title={revealed ? "Hide sensitive data" : "Reveal sensitive data"}
      >
        {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
    </div>
  )
}
