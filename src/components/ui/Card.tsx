import { motion } from 'framer-motion';
import { cn } from '@/utils';
import type { ReactNode, MouseEvent } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

export default function Card({ children, className, hover = true, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' } : {}}
      transition={{ duration: 0.2 }}
      className={cn('card', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
