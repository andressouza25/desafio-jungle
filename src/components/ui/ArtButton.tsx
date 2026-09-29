import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ArtButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function ArtButton({ children, variant = 'primary', className = '', ...props }: ArtButtonProps) {
  return (
    <button className={`art-button art-button--${variant} ${className}`.trim()} {...props}>
      <span>{children}</span>
    </button>
  );
}
