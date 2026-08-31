import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn 标准 cn(): clsx 合并条件类名, tailwind-merge 消解冲突的 utility
 * (例如 'px-2' 与后续 'px-4' 合并为 'px-4' 而非同时输出两者)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
