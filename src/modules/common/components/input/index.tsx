import { Label, clx } from "@medusajs/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
  /**
   * Campo preenchido automaticamente (ex.: pelo CEP/ViaCEP) e travado (jul/26,
   * UX QDB). Usa readOnly + aria-disabled — NUNCA `disabled`, porque input
   * disabled NÃO entra no FormData do submit nativo (as server actions leem o
   * form pelo name). Visual acinzentado com tokens do design system
   * (bg-ui-bg-disabled/text-ui-fg-subtle) pra não quebrar AA no dark mode.
   */
  travado?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, travado, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            type={inputType}
            name={name}
            id={name}
            placeholder=" "
            required={required}
            className={clx(
              "pt-4 pb-1 block w-full h-11 px-4 mt-0 border rounded-md appearance-none focus:outline-none focus:ring-0 border-ui-border-base",
              travado
                ? "bg-ui-bg-disabled text-ui-fg-subtle cursor-default"
                : "bg-ui-bg-field hover:bg-ui-bg-field-hover focus:shadow-borders-interactive-with-active"
            )}
            {...props}
            readOnly={travado ? true : props.readOnly}
            aria-disabled={travado || undefined}
            tabIndex={travado ? -1 : props.tabIndex}
            ref={inputRef}
          />
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ui-fg-subtle"
          >
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ui-fg-subtle px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-3"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
