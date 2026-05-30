import styles from './GuestGreeting.module.css';
import useGuestName from '../hooks/useGuestName.js';

function GuestGreeting() {
  const { name } = useGuestName();

  return (
    <p className={styles.greeting}>For <span className={styles.name}>{name}</span></p>
  );
}

export default GuestGreeting;
