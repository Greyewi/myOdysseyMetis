import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} CryptoGoals. All rights reserved.
          </div>
          <div className={styles.links}>
            <Link href="/" className={styles.link}>
              Home
            </Link>
            <Link href="/about" className={styles.link}>
              About
            </Link>
            <Link href="https://app.myodyssey.me/my-goals" className={styles.link}>
              My goals
            </Link>
          </div>
          <div className={styles.social}>
            <a
              href="https://www.instagram.com/myodyssey.me"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              📷
            </a>
            <a
              href="https://t.me/cryptogoals"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              📱
            </a>
            <a
              href="https://www.linkedin.com/company/my-odyssey/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
            >
              💼
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 