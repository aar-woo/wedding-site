import { motion, useReducedMotion } from 'framer-motion';
import styles from './CornerBrackets.module.css';

const EASE = [0.22, 0.61, 0.36, 1];

function CornerBracket({ className, pathVariants }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <motion.path
        d="M 4 16 L 4 4 L 16 4"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="0 1"
        variants={pathVariants}
      />
    </svg>
  );
}

export default function CornerBrackets() {
  const reduceMotion = useReducedMotion();

  const bracketsContainerVariants = reduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

  const bracketPathVariants = reduceMotion
    ? { hidden: { pathLength: 1, opacity: 1 }, visible: { pathLength: 1, opacity: 1 } }
    : {
        hidden: { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: EASE } },
      };

  return (
    <motion.div className={styles.bracketsWrapper} variants={bracketsContainerVariants} aria-hidden="true">
      <CornerBracket className={styles.topLeft} pathVariants={bracketPathVariants} />
      <CornerBracket className={`${styles.topRight} ${styles.flipH}`} pathVariants={bracketPathVariants} />
      <CornerBracket className={`${styles.bottomLeft} ${styles.flipV}`} pathVariants={bracketPathVariants} />
      <CornerBracket className={`${styles.bottomRight} ${styles.flipBoth}`} pathVariants={bracketPathVariants} />
    </motion.div>
  );
}
