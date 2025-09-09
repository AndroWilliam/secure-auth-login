"use client";
import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  componentDidCatch(err: any, info: any) { 
    console.error("[OTP_ERROR_BOUNDARY]", err, info); 
  }
  render() { 
    return this.state.hasError ? (this.props.fallback ?? null) : this.props.children; 
  }
}
