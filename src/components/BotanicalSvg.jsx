import { motion } from 'framer-motion';
import styles from './BotanicalSvg.module.css';

const EASE = [0.22, 0.61, 0.36, 1];

const svgVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const branchVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 1.0, ease: EASE } },
};

const dotVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

export default function BotanicalSvg({ flipped = false, opacity = 1 }) {
  return (
    <div
      className={`${styles.wrapper} ${flipped ? styles.flipped : ''}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <motion.svg viewBox="0 0 40 140" className={styles.svg} variants={svgVariants}>
        {/* Main stem — gentle S-curve from bottom to top */}
        <motion.path
          d="M20 130 C19 100 21 70 20 10"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Leaf pair 1 (lower) — left leaf arcing inward */}
        <motion.path
          d="M20 110 C13 104 9 96 13 90 C17 96 20 104 20 110"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 1 (lower) — right leaf arcing inward */}
        <motion.path
          d="M20 110 C27 104 31 96 27 90 C23 96 20 104 20 110"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Leaf pair 2 (middle) — left leaf arcing inward */}
        <motion.path
          d="M20 82 C13 76 9 68 13 62 C17 68 20 76 20 82"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 2 (middle) — right leaf arcing inward */}
        <motion.path
          d="M20 82 C27 76 31 68 27 62 C23 68 20 76 20 82"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Leaf pair 3 (upper) — left leaf arcing inward */}
        <motion.path
          d="M20 52 C13 46 9 38 13 32 C17 38 20 46 20 52"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 3 (upper) — right leaf arcing inward */}
        <motion.path
          d="M20 52 C27 46 31 38 27 32 C23 38 20 46 20 52"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Terminal olive dots near the top */}
        <motion.circle cx="20" cy="14" r="2.5" fill="var(--gold)" variants={dotVariants} />
        <motion.circle cx="16" cy="20" r="2" fill="var(--gold)" variants={dotVariants} />
        <motion.circle cx="24" cy="20" r="2" fill="var(--gold)" variants={dotVariants} />
      </motion.svg>
    </div>
  );
}
