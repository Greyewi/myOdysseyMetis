"use client";

import React, { useEffect, useState } from 'react';
import styles from './SocialShare.module.css';

interface SocialShareProps {
  url?: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

export const SocialShare: React.FC<SocialShareProps> = ({ 
  url: propUrl, 
  title, 
  description = '', 
  imageUrl = '' 
}) => {
  const [currentUrl, setCurrentUrl] = useState(propUrl || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, [propUrl]);

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImageUrl = encodeURIComponent(imageUrl);

  const shareText = `${title} - Check out my goal! 🚀`;
  const encodedShareText = encodeURIComponent(shareText);

  const facebookShareText = `🎯 ${title}\n\n${description || 'Check out my goal on MyOdyssey!'}\n\n🚀 Join me on this journey!`;
  const encodedFacebookShareText = encodeURIComponent(facebookShareText);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedFacebookShareText}`,
    twitter: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedShareText}&hashtags=myodyssey,crypto,goals`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImageUrl}&description=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedShareText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedShareText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };

  const handleShare = (platform: string, link: string) => {
    if (platform === 'email') {
      window.location.href = link;
    } else {
      window.open(link, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
    }
  };


  // Don't render if we don't have a URL yet
  if (!currentUrl) {
    return null;
  }

  return (
    <div className={styles.socialShare}>
      <h3 className={styles.title}>Share this goal</h3>
      <div className={styles.buttons}>
        <button
          onClick={() => handleShare('facebook', shareLinks.facebook)}
          className={`${styles.shareButton} ${styles.facebook}`}
          aria-label="Share on Facebook"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </button>

        <button
          onClick={() => handleShare('twitter', shareLinks.twitter)}
          className={`${styles.shareButton} ${styles.twitter}`}
          aria-label="Share on X"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>

        <button
          onClick={() => handleShare('reddit', shareLinks.reddit)}
          className={`${styles.shareButton} ${styles.reddit}`}
          aria-label="Share on Reddit"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.187 0-.368.037-.536.107a.884.884 0 0 0-.38.302.880.880 0 0 0-.15.484c0 .494.402.896.896.896.494 0 .896-.402.896-.896a.896.896 0 0 0-.896-.896zm-5.5 3.5a.375.375 0 0 0-.373.564 4.505 4.505 0 0 0 3.764 1.98 4.505 4.505 0 0 0 3.764-1.98.377.377 0 0 0 0-.563.375.375 0 0 0-.564 0 3.754 3.754 0 0 1-3.2 1.8 3.754 3.754 0 0 1-3.2-1.8.375.375 0 0 0-.191-.001z"/>
          </svg>
          Reddit
        </button>

        <button
          onClick={() => handleShare('pinterest', shareLinks.pinterest)}
          className={`${styles.shareButton} ${styles.pinterest}`}
          aria-label="Share on Pinterest"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.098.119.112.223.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.747 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.624 0 11.99-5.367 11.99-11.989C24.007 5.367 18.641.001 12.017.001z"/>
          </svg>
          Pinterest
        </button>

        <button
          onClick={() => handleShare('linkedin', shareLinks.linkedin)}
          className={`${styles.shareButton} ${styles.linkedin}`}
          aria-label="Share on LinkedIn"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </button>

        <button
          onClick={() => handleShare('whatsapp', shareLinks.whatsapp)}
          className={`${styles.shareButton} ${styles.whatsapp}`}
          aria-label="Share on WhatsApp"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          WhatsApp
        </button>

        <button
          onClick={() => handleShare('telegram', shareLinks.telegram)}
          className={`${styles.shareButton} ${styles.telegram}`}
          aria-label="Share on Telegram"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          Telegram
        </button>

        <button
          onClick={() => handleShare('email', shareLinks.email)}
          className={`${styles.shareButton} ${styles.email}`}
          aria-label="Share via Email"
        >
          <svg viewBox="0 0 24 24" className={styles.icon}>
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
          Email
        </button>
      </div>
    </div>
  );
}; 