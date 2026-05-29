import styles from "./SaveTheDatePage.module.css";

function SaveTheDatePage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroContainer}>
        <img
          className={styles.heroImage}
          src="/images/save-the-date-hero.png"
          alt="Rina and Aaron's wedding in Oahu, Hawaii"
        />
      </div>
      <div className={styles.scrim} />
      <div className={styles.contentBlock}>
        <p className={styles.label}>Save the Date</p>
        <h1 className={styles.coupleNames}>Rina &amp; Aaron</h1>
        <div className={styles.divider} />
        <p className={styles.date}>May 30, 2027</p>
        <p className={styles.location}>Oahu, Hawaii</p>
        <p className={styles.footer}>Formal invitation to follow</p>
      </div>
    </div>
  );
}

export default SaveTheDatePage;
