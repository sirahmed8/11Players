import { Variants, Transition } from 'framer-motion';

/**
 * Standard Framer Motion Stagger Container Variants for smooth staggered list/grid entrances.
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

/**
 * Standard Framer Motion Stagger Item Variants for list/grid items.
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const springTransition: Transition = { type: 'spring', stiffness: 400, damping: 25 };
const springButtonTransition: Transition = { type: 'spring', stiffness: 450, damping: 20 };
const springRowTransition: Transition = { type: 'spring', stiffness: 400, damping: 30 };

/**
 * Micro-Spring Physics Props for interactive buttons, cards, tabs, and pills.
 */
export const microSpringProps = {
  whileHover: { scale: 1.025, y: -2 },
  whileTap: { scale: 0.96 },
  transition: springTransition,
};

/**
 * Strong Micro-Spring Props for smaller buttons and icons.
 */
export const microSpringButtonProps = {
  whileHover: { scale: 1.05, y: -2 },
  whileTap: { scale: 0.95 },
  transition: springButtonTransition,
};

/**
 * Subtler Micro-Spring Props for table rows and wide cards.
 */
export const microSpringRowProps = {
  whileHover: { scale: 1.008, x: 3 },
  whileTap: { scale: 0.995 },
  transition: springRowTransition,
};

