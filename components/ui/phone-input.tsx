"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Country {
  code: string
  name: string
  flag: string
  dialCode: string
}

const countries: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", dialCode: "+20" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dialCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", dialCode: "+966" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  initialCountryCode?: string // e.g., 'EG', 'US'
}

export function PhoneInput({ value, onChange, placeholder, className, id, initialCountryCode }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    countries.find((country) => country.code === (initialCountryCode || "EG")) || countries[0],
  )

  // Per-country national number length (digits only, excluding country code)
  const nationalNumberMaxLength: Record<string, number> = {
    EG: 10, // Egypt
    US: 10,
    GB: 10,
    CA: 10,
    AU: 9,
    DE: 11,
    FR: 9,
    AE: 9,
    SA: 9,
    IN: 10,
  }

  // Sync selected country from incoming value when it includes a known dial code
  // and when the dial code changes (e.g., when editing existing numbers)
  if (typeof window !== 'undefined') {
    const match = countries.find(c => value?.startsWith(c.dialCode))
    if (match && match.code !== selectedCountry.code) {
      setSelectedCountry(match)
    }
  }

  // Extract the phone number without country code
  const getPhoneNumber = () => {
    if (value.startsWith(selectedCountry.dialCode)) {
      return value.slice(selectedCountry.dialCode.length).trim()
    }
    return value
  }

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    const phoneNumber = getPhoneNumber()
    // Enforce max length for new country
    const maxLen = nationalNumberMaxLength[country.code] ?? 15
    const digitsOnly = phoneNumber.replace(/\D/g, "").slice(0, maxLen)
    onChange(`${country.dialCode} ${digitsOnly}`.trim())
  }

  const handlePhoneChange = (phoneNumber: string) => {
    const maxLen = nationalNumberMaxLength[selectedCountry.code] ?? 15
    const digitsOnly = phoneNumber.replace(/\D/g, "").slice(0, maxLen)
    onChange(`${selectedCountry.dialCode} ${digitsOnly}`.trim())
  }

  return (
    <div className="flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 px-3 rounded-r-none border-r-0 min-w-[100px] bg-transparent"
            type="button"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm">{selectedCountry.dialCode}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {countries.map((country) => (
            <DropdownMenuItem
              key={country.code}
              onClick={() => handleCountrySelect(country)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span className="text-lg">{country.flag}</span>
              <span className="flex-1">{country.name}</span>
              <span className="text-sm text-muted-foreground">{country.dialCode}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Input
        id={id}
        type="tel"
        placeholder={placeholder || "Enter phone number"}
        value={getPhoneNumber()}
        onChange={(e) => handlePhoneChange(e.target.value)}
        className={`rounded-l-none ${className || ""}`}
      />
    </div>
  )
}
