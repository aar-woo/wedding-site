import { motion } from "framer-motion";
import styles from "./SaveTheDatePage.module.css";
import GuestGreeting from "../components/GuestGreeting.jsx";
import CountdownTimer from "../components/CountdownTimer.jsx";
import BotanicalSvg from "../components/BotanicalSvg.jsx";
import CornerBrackets from "../components/CornerBrackets.jsx";

const EASE = [0.22, 0.61, 0.36, 1];
const DURATION = 0.9; // ≥0.8s per element (ANIM-03)
const STAGGER = 0.15;

// Three-act entrance. Page root flips hidden→visible to all groups at once
// (staggerChildren: 0), then each GROUP waits its own `delayChildren` before
// cascading its own children — this is what sequences the acts. Tune the three
// delays below to re-time the acts; tune STAGGER/DURATION for within-act feel.
const ACT_1_TOP = 0.3; // 1) top header group (Save the Date → divider → names)
const ACT_2_DECOR = 1.6; // 2) corner brackets + botanicals
const ACT_3_CONTENT = 3.2; // 3) the rest (greeting, date, location, countdown, footer)

const pageVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0 } },
};

// Container factory — cascades its children `STAGGER` apart, starting after `delay`.
const groupVariants = (delay) => ({
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER, delayChildren: delay } },
});

const topGroupVariants = groupVariants(ACT_1_TOP);
const decorationsVariants = groupVariants(ACT_2_DECOR);
const contentContainerVariants = groupVariants(ACT_3_CONTENT);
// Passthrough so the botanical pair counts as one stagger child of the
// decorations group, then propagates "visible" down to the two BotanicalSvgs.
const passthroughVariants = { hidden: {}, visible: {} };

const fadeUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};

const coupleNamesVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION, ease: EASE },
  },
};

const dividerVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: DURATION, ease: EASE },
  },
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

        {/* Act 2: decorations group — corner brackets + botanicals draw in together */}
        <motion.div className={styles.decorations} variants={decorationsVariants}>
          <CornerBrackets />
          <motion.div className={styles.botanicalPair} variants={passthroughVariants}>
            <BotanicalSvg />
            <BotanicalSvg flipped />
          </motion.div>
        </motion.div>

        {/* Act 1: top header group — top to bottom: Save the Date → divider → couple names */}
        <motion.div
          className={styles.topGroup}
          variants={topGroupVariants}
        >
          <motion.p className={styles.label} variants={fadeUpVariants}>
            <span className={styles.wordEngravers}>Save</span>{" "}
            <span className={styles.wordScript}>The</span>{" "}
            <span className={styles.wordEngravers}>Date</span>
          </motion.p>
          <motion.div
            className={styles.divider}
            variants={dividerVariants}
            style={{ transformOrigin: "center" }}
          />
          {/* scaleX from center */}
          <motion.h1
            className={styles.coupleNames}
            variants={coupleNamesVariants}
          >
            Rina &amp; Aaron
          </motion.h1>
        </motion.div>

        {/* Content block with its own delayed internal stagger */}
        <motion.div
          className={styles.contentBlock}
          variants={contentContainerVariants}
        >
          <motion.div variants={fadeUpVariants}>
            {/* greeting */}
            <GuestGreeting />
          </motion.div>
          <motion.p className={styles.date} variants={fadeUpVariants}>
            May 30, 2027
          </motion.p>
          {/* step 8 */}
          <motion.p className={styles.location} variants={fadeUpVariants}>
            Oahu, Hawaii
          </motion.p>
          {/* step 9 */}
          <motion.div variants={fadeUpVariants}>
            <CountdownTimer />
          </motion.div>
          {/* step 10a */}
          <motion.p className={styles.footer} variants={fadeUpVariants}>
            Formal invitation to follow
          </motion.p>
          {/* step 10b */}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SaveTheDatePage;
