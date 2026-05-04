import { cn } from '../lib/utils.js';

export default function LoadingSpinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(sizes[size], 'border-2 border-surface-500 border-t-rose-500 rounded-full animate-spin')} />
    </div>
  );
}
