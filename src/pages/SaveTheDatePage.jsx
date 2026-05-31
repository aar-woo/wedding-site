import { motion } from 'framer-motion';
import styles from './SaveTheDatePage.module.css';
import GuestGreeting from '../components/GuestGreeting.jsx';
import CountdownTimer from '../components/CountdownTimer.jsx';
import BotanicalSvg from '../components/BotanicalSvg.jsx';
import CornerBrackets from '../components/CornerBrackets.jsx';

const EASE = [0.22, 0.61, 0.36, 1];
const DURATION = 0.9; // ≥0.8s per element (ANIM-03)
const STAGGER = 0.15;

// Page root — propagates hidden→visible to brackets, botanical, content block
const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
};

// Content block — delays its internal cascade until decorations are in.
// delayChildren bridges the two containers so brackets+botanical finish before text begins.
// Tune at visual checkpoint if cascade starts too early or too late.
const contentContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER, delayChildren: 2.0 } },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};

const coupleNamesVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION, ease: EASE } },
};

const dividerVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: DURATION, ease: EASE } },
};

function SaveTheDatePage() {
  return (
    <div className={styles.page}>
      <motion.div
        className={styles.heroFrame}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Step 1: background hero — CSS Ken Burns, NOT in the stagger */}
        <div className={styles.heroContainer}>
          <img
            className={styles.heroImage}
            src="/images/save-the-date-hero.webp"
            alt="Rina and Aaron's wedding in Oahu, Hawaii"
          />
        </div>
        <div className={styles.scrim} />

        {/* Step 2: corner brackets (stagger index 0) */}
        <CornerBrackets />

        {/* Step 3: botanical pair (stagger index 1) */}
        <div className={styles.botanicalPair}>
          <BotanicalSvg />
          <BotanicalSvg flipped />
        </div>

        {/* Steps 4–10: content block with its own delayed internal stagger */}
        <motion.div className={styles.contentBlock} variants={contentContainerVariants}>
          <motion.div variants={fadeUpVariants}>{/* step 4 */}
            <GuestGreeting />
          </motion.div>
          <motion.p className={styles.label} variants={fadeUpVariants}>Save the Date</motion.p>{/* step 5 */}
          <motion.h1 className={styles.coupleNames} variants={coupleNamesVariants}>Rina &amp; Aaron</motion.h1>{/* step 6 */}
          <motion.div
            className={styles.divider}
            variants={dividerVariants}
            style={{ transformOrigin: 'center' }}
          />{/* step 7 — scaleX from center */}
          <motion.p className={styles.date} variants={fadeUpVariants}>May 30, 2027</motion.p>{/* step 8 */}
          <motion.p className={styles.location} variants={fadeUpVariants}>Oahu, Hawaii</motion.p>{/* step 9 */}
          <motion.div variants={fadeUpVariants}><CountdownTimer /></motion.div>{/* step 10a */}
          <motion.p className={styles.footer} variants={fadeUpVariants}>Formal invitation to follow</motion.p>{/* step 10b */}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SaveTheDatePage;
