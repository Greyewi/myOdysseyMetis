'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from '../goals/[id]/page.module.css';

interface UserAvatarProps {
  avatarUrl?: string;
  username?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ avatarUrl, username }) => {
  const [showDefault, setShowDefault] = useState(!avatarUrl);

  const handleImageError = () => {
    setShowDefault(true);
  };

  return (
    <div className={styles.avatar}>
      {!showDefault && avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={username || 'User'}
          width={64}
          height={64}
          onError={handleImageError}
          unoptimized={true}
        />
      ) : (
        <div className={styles.defaultAvatar} />
      )}
    </div>
  );
}; 