import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function Button({
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        w-full
        rounded-2xl
        bg-gradient-to-r
        from-teal-500
        to-cyan-500
        px-5
        py-3.5
        text-base
        font-semibold
        text-white
        shadow-lg
        shadow-teal-500/20
        transition-all
        duration-300

        hover:-translate-y-0.5
        hover:shadow-xl
        hover:shadow-teal-500/30

        active:translate-y-0
        active:scale-[0.98]

        focus:outline-none
        focus:ring-4
        focus:ring-teal-400/30

        disabled:cursor-not-allowed
        disabled:opacity-60

        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;