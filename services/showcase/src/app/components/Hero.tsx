import Link from 'next/link';
import Image from 'next/image';
import styles from './Hero.module.css';

const Hero = () => {
  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.text}>
            <h1 className={styles.title}>
              Own Your Journey
            </h1>
            <p className={styles.description}>
              AI-powered Goal Escrow. Prove your ambition on-chain.<br/>
              Create a goal, commit real value, and be rewarded when you succeed.
            </p>
            <div className={styles.buttonContainer}>
              <Link 
                href="https://app.myodyssey.me"
                className={styles.primaryButton}
              >
                New Goal
              </Link>
              <Link 
                href="/about"
                className={styles.secondaryButton}
              >
                About
              </Link>
            </div>
          </div>
          <div className={styles.image}>
            <Image
              src="/hero-map.png"
              alt="CryptoGoals Logo"
              width={350}
              height={350}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 