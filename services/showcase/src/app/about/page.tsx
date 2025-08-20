'use client';

import React from 'react';
import styles from './page.module.css';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>About My Odyssey</h1>
      
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.textContent}>
            <p className={styles.description}>
              My Odyssey is a Web3 motivation platform that helps you commit to personal goals — with real stakes. 
              You set a goal, lock in crypto, and prove your progress. Everything is transparent, public, and powered by smart contracts.
            </p>

            <div className={styles.aiSection}>
              <h2 className={styles.sectionTitle}>AI-Powered Guidance</h2>
              <p className={styles.sectionText}>
                To guide you, My Odyssey includes an AI agent that checks how realistic your goal is. 
                It uses open data and real-world cases to give a simple verdict: is your goal achievable, 
                and what steps will help? The AI then creates a draft plan — a list of subgoals you can 
                adjust to fit your life.
              </p>
            </div>

            <div className={styles.commitmentSection}>
              <h2 className={styles.sectionTitle}>Real Commitment</h2>
              <p className={styles.sectionText}>
                No vague promises. No empty resolutions. Just real goals, real proof, and real outcomes.
              </p>
            </div>
          </div>

          <div className={styles.imageWrapper}>
            <Image
              src="/about.jpg"
              alt="My Odyssey Platform"
              width={600}
              height={800}
              priority
              className={styles.image}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 