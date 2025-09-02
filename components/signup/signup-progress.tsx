interface SignupProgressProps {
  currentStep: number
  totalSteps: number
}

export function SignupProgress({ currentStep, totalSteps }: SignupProgressProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i + 1 <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 h-0.5 mx-2 transition-colors ${i + 1 < currentStep ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-sm text-muted-foreground text-center">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  )
}
