"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div key={step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all",
                    isCompleted && "border-indigo-600 bg-indigo-600 text-white",
                    isCurrent && "border-indigo-600 bg-white text-indigo-600",
                    !isCompleted && !isCurrent && "border-gray-300 bg-white text-gray-400",
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                </div>
                <p
                  className={cn(
                    "text-xs font-medium transition-colors",
                    (isCompleted || isCurrent) && "text-indigo-600",
                    !isCompleted && !isCurrent && "text-gray-400",
                  )}
                >
                  {step}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn("mx-2 h-0.5 flex-1 transition-colors", isCompleted ? "bg-indigo-600" : "bg-gray-300")}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
