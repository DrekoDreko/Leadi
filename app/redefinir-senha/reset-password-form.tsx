"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { updatePasswordAction } from "./actions";

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={updatePasswordAction} className="mt-6 flex flex-col gap-4">
      <label className="block">
        <span className="text-muted-soft mb-2 block text-sm font-medium">Nova senha</span>
        <div className="relative">
          <input
            className="liquid-input pr-11"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            minLength={8}
            name="password"
            placeholder="••••••••"
            required
            type={showPassword ? "text" : "password"}
            spellCheck={false}
          />
          <button
            type="button"
            className="text-muted-foreground/70 hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 transition"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onMouseDown={() => setShowPassword(true)}
            onMouseUp={() => setShowPassword(false)}
            onMouseLeave={() => setShowPassword(false)}
            onTouchStart={() => setShowPassword(true)}
            onTouchEnd={() => setShowPassword(false)}
            onContextMenu={(event) => event.preventDefault()}
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </label>
      <label className="block">
        <span className="text-muted-soft mb-2 block text-sm font-medium">Confirmar nova senha</span>
        <input
          className="liquid-input"
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect="off"
          minLength={8}
          name="confirmPassword"
          placeholder="••••••••"
          required
          type={showPassword ? "text" : "password"}
          spellCheck={false}
        />
      </label>
      <p className="text-muted-foreground -mt-1 text-xs">
        Use ao menos 8 caracteres, com letras e números.
      </p>
      <button
        className="w-full rounded-full bg-cobalt px-5 py-4 font-semibold text-white transition hover:bg-cobalt/90"
        type="submit"
      >
        Redefinir senha
      </button>
    </form>
  );
}
