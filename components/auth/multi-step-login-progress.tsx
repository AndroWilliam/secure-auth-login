interface LoginProgressProps {
  currentStep: number
  totalSteps: number
}

export function LoginProgress({ currentStep = 1, totalSteps = 4 }: LoginProgressProps) {
  const safeCurrentStep = Math.max(1, Math.min(currentStep || 1, totalSteps || 4))
  const safeTotalSteps = totalSteps || 4

  const steps = Array.from({ length: safeTotalSteps }, (_, index) => ({
    number: index + 1,
    isActive: index + 1 === safeCurrentStep,
    isCompleted: index + 1 < safeCurrentStep,
  }))

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.isCompleted
                  ? "bg-primary text-primary-foreground"
                  : step.isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div className={`h-px w-full mx-2 ${step.isCompleted ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-2 text-center">
        Step {safeCurrentStep} of {safeTotalSteps}
      </p>
    </div>
  )
}
