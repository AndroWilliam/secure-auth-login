"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, CheckCircle, XCircle } from "lucide-react"

interface SecurityQuestion {
  question: string
}

interface SecurityQuestionsStepProps {
  userId: string
  onNext: (verified: boolean) => void
  isLoading?: boolean
}

export function SecurityQuestionsStep({ userId, onNext, isLoading }: SecurityQuestionsStepProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "loading" | "verifying" | "success" | "error">(
    "loading",
  )
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([])

  useEffect(() => {
    const fetchSecurityQuestions = async () => {
      try {
        const response = await fetch(`/api/user-info/get-security-questions?userId=${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch security questions")
        }

        const data = await response.json()
        setSecurityQuestions(data.questions)
        setVerificationStatus("idle")
      } catch (error) {
        console.error("Failed to fetch security questions:", error)
        setError("Failed to load security questions. Please try again.")
        setVerificationStatus("error")
      }
    }

    fetchSecurityQuestions()
  }, [userId])

  const currentQuestion = securityQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === securityQuestions.length - 1

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerificationStatus("verifying")
    setError(null)

    try {
      const response = await fetch("/api/user-info/verify-security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          answers: [{ answer: userAnswer }],
        }),
      })

      if (!response.ok) {
        throw new Error("Verification failed")
      }

      const data = await response.json()
      const isCorrect = data.correct

      if (isCorrect) {
        const newCorrectAnswers = correctAnswers + 1
        setCorrectAnswers(newCorrectAnswers)

        if (isLastQuestion) {
          // All questions answered
          const verificationPassed = newCorrectAnswers >= Math.ceil(securityQuestions.length / 2)
          setVerificationStatus(verificationPassed ? "success" : "error")

          setTimeout(() => {
            onNext(verificationPassed)
          }, 1500)
        } else {
          // Move to next question
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          setUserAnswer("")
          setVerificationStatus("idle")
        }
      } else {
        setError("Incorrect answer. Please try again.")
        setVerificationStatus("error")
        setTimeout(() => {
          setVerificationStatus("idle")
          setError(null)
        }, 2000)
      }
    } catch (error) {
      setError("Verification failed. Please try again.")
      setVerificationStatus("error")
    }
  }

  if (verificationStatus === "loading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Security Questions</CardTitle>
          <CardDescription>Loading your security questions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Security Questions</CardTitle>
        <CardDescription>Answer your security questions to complete login verification</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {currentQuestionIndex + 1} of {securityQuestions.length}
            </span>
            <span>{correctAnswers} correct</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / securityQuestions.length) * 100}%` }}
            />
          </div>

          {verificationStatus === "success" ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">Verification Complete!</h3>
              <p className="text-sm text-muted-foreground">Security questions verified successfully. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Question
                </Label>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{currentQuestion?.question}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer</Label>
                <Input
                  id="answer"
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  disabled={verificationStatus === "verifying"}
                  className={error ? "border-destructive" : ""}
                  autoFocus
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!userAnswer.trim() || verificationStatus === "verifying"}
              >
                {verificationStatus === "verifying" ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : isLastQuestion ? (
                  "Complete Verification"
                ) : (
                  "Next Question"
                )}
              </Button>
            </form>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Can't remember your answers? <button className="text-primary hover:underline">Contact Support</button>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
