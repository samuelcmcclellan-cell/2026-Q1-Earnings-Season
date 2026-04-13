import { cn } from '../../lib/utils';

type Variant = 'beat' | 'miss' | 'meet' | 'pending' | 'raised' | 'lowered' | 'maintained';

const variantStyles: Record<Variant, string> = {
  beat: 'bg-accent-green/20 text-accent-green border-accent-green/30',
  miss: 'bg-accent-red/20 text-accent-red border-accent-red/30',
  meet: 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/30',
  pending: 'bg-border/40 text-text-muted border-border',
  raised: 'bg-accent-green/20 text-accent-green border-accent-green/30',
  lowered: 'bg-accent-red/20 text-accent-red border-accent-red/30',
  maintained: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
};

const variantLabels: Record<Variant, string> = {
  beat: 'BEAT',
  miss: 'MISS',
  meet: 'MEET',
  pending: 'PENDING',
  raised: 'RAISED',
  lowered: 'LOWERED',
  maintained: 'MAINTAINED',
};

interface BadgeProps {
  variant: Variant;
  label?: string;
  className?: string;
}

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border tracking-wider',
      variantStyles[variant],
      className
    )}>
      {label || variantLabels[variant]}
    </span>
  );
}
