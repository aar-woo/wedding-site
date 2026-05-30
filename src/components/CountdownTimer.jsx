import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CountdownTimer.module.css';

const TARGET = new Date(2027, 4, 30, 0, 0, 0);

function getTimeLeft() {
  const diff = TARGET.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
  };
}

const UNITS = [
  { key: 'days', label: 'DAYS' },
  { key: 'hours', label: 'HRS' },
  { key: 'minutes', label: 'MIN' },
  { key: 'seconds', label: 'SEC' },
];

export default function CountdownTimer() {
  const [t, setT] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.countdown}>
      {UNITS.map(({ key, label }) => {
        const value = t[key];
        return (
          <div key={label} className={styles.unit}>
            <div className={styles.numberCell}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={value}
                  className={styles.number}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  {String(value).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className={styles.label}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
