"use client";

import React, { useState, useEffect } from "react";
import { Phone, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
export const PAKISTAN_PHONE_REGEX = /^(?:\+92|0092|0)?(3\d{9})$/;

interface PhoneInputProps {
  value: string;
  onChange: (val: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
}

export function validatePakistaniPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, "");
  return PAKISTAN_PHONE_REGEX.test(cleaned);
}

export default function PhoneInput({
  value,
  onChange,
  label = "WhatsApp / Mobile Number",
  required = true,
  disabled = false,
  id = "phone-input",
  name = "phone",
  placeholder = "0300-1234567 or +923001234567",
  className = "",
}: PhoneInputProps) {
  const [touched, setTouched] = useState(false);
  const isValid = validatePakistaniPhone(value);

  // Notify parent on change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const valid = validatePakistaniPhone(raw);
    onChange(raw, valid);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-zinc-300 uppercase tracking-wider"
        >
          {label} {required && <span className="text-amber-400">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
          <Phone className="w-4 h-4" />
        </div>

        <input
          id={id}
          name={name}
          type="tel"
          required={required}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-invalid={touched && !isValid}
          className={`w-full pl-10 pr-10 py-3 bg-zinc-900 border rounded-xl text-sm font-medium transition text-white placeholder-zinc-500 focus:outline-none focus:ring-2 ${
            touched && !isValid
              ? "border-rose-500 focus:ring-rose-500/30"
              : touched && isValid
              ? "border-emerald-500/80 focus:ring-emerald-500/30"
              : "border-zinc-700 focus:border-emerald-500 focus:ring-emerald-500/20"
          }`}
        />

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
          {touched && isValid && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          {touched && !isValid && (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
        </div>
      </div>

      {/* Mandatory Helper Notice */}
      <div className="flex items-center gap-1.5 text-xs text-amber-400/90 pt-0.5">
        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        <span className="font-semibold text-[11px]">
          Make sure this phone number has an active WhatsApp account.
        </span>
      </div>

      {/* Validation Error */}
      {touched && !isValid && (
        <p className="text-[11px] text-rose-400 font-medium pl-1">
          Please enter a valid Pakistani phone format (e.g. 03XXXXXXXXX or +923XXXXXXXXX).
        </p>
      )}
    </div>
  );
}
