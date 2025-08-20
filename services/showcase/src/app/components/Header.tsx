import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logoContainer}>
        <Image
          src="/logo-2.svg"
          alt="My Odyssey Logo"
          width={48}
          height={48}
          className={styles.logoImage}
        />
        {/*<span className={styles.betaTag}>Demo</span>*/}
      </Link>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLink}>Home</Link>
        <Link href="/about" className={styles.navLink}>About</Link>
      </nav>
      <Link href="https://app.myodyssey.me/my-goals/" className={styles.cabinetButton}>
        My goals
      </Link>
    </header>
  );
};

export default Header; 