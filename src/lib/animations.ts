import { Variants, Transition } from 'framer-motion';

/**
 * Standard Framer Motion Stagger Container Variants for smooth staggered list/grid entrances.
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

/**
 * Standard Framer Motion Stagger Item Variants for list/grid items.
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(12px)', transition: { duration: 0.25 } },
  exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.2 } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 350, damping: 30, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    filter: 'blur(2px)',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const springTransition: Transition = { type: 'spring', stiffness: 380, damping: 26 };
const springButtonTransition: Transition = { type: 'spring', stiffness: 420, damping: 22 };
const springRowTransition: Transition = { type: 'spring', stiffness: 380, damping: 30 };

/**
 * Micro-Spring Physics Props for interactive buttons, cards, tabs, and pills.
 */
export const microSpringProps = {
  whileHover: { scale: 1.025, y: -2, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } },
  whileTap: { scale: 0.96, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } },
  transition: springTransition,
};

/**
 * Drag Physics Props for draggable elements (like the pitch builder).
 */
export const microSpringDragProps = {
  whileDrag: { scale: 1.05, cursor: 'grabbing', zIndex: 50 },
  transition: springTransition,
};

/**
 * Strong Micro-Spring Props for smaller buttons and icons.
 */
export const microSpringButtonProps = {
  whileHover: { scale: 1.04, y: -1 },
  whileTap: { scale: 0.95 },
  transition: springButtonTransition,
};

/**
 * Subtler Micro-Spring Props for table rows and wide cards.
 */
export const microSpringRowProps = {
  whileHover: { scale: 1.006, x: 2 },
  whileTap: { scale: 0.995 },
  transition: springRowTransition,
};

export const cardFlipVariants: Variants = {
  front: { rotateY: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  back: { rotateY: 180, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export const drawerVariants: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 350, damping: 32 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

export const badgePulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.08, 1],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const tabSwitchVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const cardTiltProps = {
  whileHover: { scale: 1.025, y: -3, rotateX: 2, rotateY: -2 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 350, damping: 24 },
};

export const floatingWidgetVariants: Variants = {
  closed: { opacity: 0, scale: 0.85, y: 25 },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export const pitchNodeVariants: Variants = {
  initial: { opacity: 0, scale: 0.7, y: 15 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 22 },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

export const listReorderTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 28,
};

