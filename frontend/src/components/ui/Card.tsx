import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        w-full
        rounded-[28px]
        border
        border-white/15
        bg-white/95
        p-10
        shadow-[0_25px_80px_rgba(0,0,0,0.35)]
        backdrop-blur-xl
        transition-all
        duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;