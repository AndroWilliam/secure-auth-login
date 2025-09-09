"use client";
import { useRef, useEffect } from "react";

export function OtpInputBasic({
  value,
  onChange,
  length = 6,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  const refs = Array.from({ length }, () => useRef<HTMLInputElement>(null));

  useEffect(() => {
    // focus first empty slot on mount
    const i = Math.max(0, value.length);
    refs[i]?.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(-1); // keep last digit
    const next = (value.slice(0, i) + digit + value.slice(i + 1)).slice(0, length);
    onChange(next);
    if (digit && i < length - 1) refs[i + 1]?.current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) refs[i - 1]?.current?.focus();
    if (e.key === "ArrowLeft" && i > 0) refs[i - 1]?.current?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs[i + 1]?.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, ""));
    const idx = Math.min(pasted.length, length - 1);
    refs[idx]?.current?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-12 h-12 rounded-md border bg-background text-center text-lg font-semibold"
        />
      ))}
    </div>
  );
}
