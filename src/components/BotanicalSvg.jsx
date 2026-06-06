import { motion, useReducedMotion } from "framer-motion";
import styles from "./BotanicalSvg.module.css";

const EASE = [0.22, 0.61, 0.36, 1];

export default function BotanicalSvg({ flipped = false, opacity = 1 }) {
  const reduceMotion = useReducedMotion();

  const svgVariants = reduceMotion
    ? { hidden: {}, visible: {} }
    : { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

  const branchVariants = reduceMotion
    ? { hidden: { pathLength: 1, opacity: 1 }, visible: { pathLength: 1, opacity: 1 } }
    : {
        hidden: { pathLength: 0, opacity: 0 },
        // Keyframe loop: draw in → hold drawn → fade + snap back to start a new cycle.
        // pathLength can't tween 1→0 invisibly via repeatType, so we use a keyframe
        // array with an opacity fade on the reset tail to make each re-draw clean
        // (gold strokes fade out rather than appearing to "erase").
        visible: {
          pathLength: [0, 1, 1, 0],
          opacity: [0, 1, 1, 0],
          transition: {
            duration: 7,
            times: [0, 0.14, 0.85, 1],
            ease: EASE,
            repeat: Infinity,
          },
        },
      };

  const dotVariants = reduceMotion
    ? { hidden: { scale: 1, opacity: 1 }, visible: { scale: 1, opacity: 1 } }
    : {
        hidden: { scale: 0, opacity: 0 },
        // Same keyframe-loop treatment as branches; dots pop faster (times[1]=0.06 vs 0.14)
        // to match the original 0.4s vs 1.0s feel within the 7s cycle.
        visible: {
          scale: [0, 1, 1, 0],
          opacity: [0, 1, 1, 0],
          transition: {
            duration: 7,
            times: [0, 0.06, 0.85, 1],
            ease: EASE,
            repeat: Infinity,
          },
        },
      };

  return (
    <div
      className={`${styles.wrapper} ${flipped ? styles.flipped : ""}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 40 140"
        className={styles.svg}
        variants={svgVariants}
      >
        {/* Main stem — gentle S-curve from bottom to top */}
        <motion.path
          d="M20 130 C19 100 21 70 20 10"
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Leaf pair 1 (lower) — left leaf arcing inward */}
        <motion.path
          d="M20 110 C13 104 9 96 13 90 C17 96 20 104 20 110"
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 1 (lower) — right leaf arcing inward */}
        <motion.path
          d="M20 110 C27 104 31 96 27 90 C23 96 20 104 20 110"
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Leaf pair 2 (middle) — left leaf arcing inward */}
        <motion.path
          d="M20 82 C13 76 9 68 13 62 C17 68 20 76 20 82"
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 2 (middle) — right leaf arcing inward */}
        <motion.path
          d="M20 82 C27 76 31 68 27 62 C23 68 20 76 20 82"
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Leaf pair 3 (upper) — left leaf arcing inward */}
        <motion.path
          d="M20 52 C13 46 9 38 13 32 C17 38 20 46 20 52"
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />
        {/* Leaf pair 3 (upper) — right leaf arcing inward */}
        <motion.path
          d="M20 52 C27 46 31 38 27 32 C23 38 20 46 20 52"
          fill="none"
          stroke="var(--gold-light)"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="0 1"
          variants={branchVariants}
        />

        {/* Terminal olive dots near the top */}
        <motion.circle
          cx="20"
          cy="14"
          r="2.5"
          fill="var(--gold-light)"
          variants={dotVariants}
        />
        <motion.circle
          cx="16"
          cy="20"
          r="2"
          fill="var(--gold-light)"
          variants={dotVariants}
        />
        <motion.circle
          cx="24"
          cy="20"
          r="2"
          fill="var(--gold-light)"
          variants={dotVariants}
        />
      </motion.svg>
    </div>
  );
}
