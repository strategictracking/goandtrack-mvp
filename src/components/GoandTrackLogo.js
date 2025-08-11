// src/components/GoandTrackLogo.js
// Reusable logo component for consistent branding

import React from 'react';

const GoandTrackLogo = ({ size = 'medium', showTagline = false }) => {
  const brandRed = '#DC2626';
  const brandDark = '#111827';
  
  // Size configurations
  const sizes = {
    small: {
      fontSize: '16px',
      padding: '8px 12px',
      globeSize: '20px',
      borderWidth: '2px'
    },
    medium: {
      fontSize: '24px',
      padding: '12px 16px',
      globeSize: '32px',
      borderWidth: '3px'
    },
    large: {
      fontSize: '32px',
      padding: '16px 24px',
      globeSize: '44px',
      borderWidth: '4px'
    }
  };
  
  const currentSize = sizes[size] || sizes.medium;
  
  const styles = {
    logoWrapper: {
      display: 'inline-flex',
      alignItems: 'center',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    logoLeft: {
      backgroundColor: brandRed,
      color: 'white',
      padding: currentSize.padding,
      display: 'flex',
      alignItems: 'center',
      gap: size === 'small' ? '6px' : '10px',
      fontSize: currentSize.fontSize,
      fontWeight: '700',
      lineHeight: size === 'small' ? '1.2' : '1'
    },
    logoGlobe: {
      width: currentSize.globeSize,
      height: currentSize.globeSize,
      border: `${currentSize.borderWidth} solid white`,
      borderRadius: '50%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `calc(${currentSize.fontSize} * 0.75)`
    },
    logoRight: {
      backgroundColor: 'white',
      color: brandDark,
      padding: currentSize.padding,
      paddingLeft: `calc(${currentSize.padding.split(' ')[1]} + 4px)`,
      fontSize: currentSize.fontSize,
      fontWeight: '700',
      borderTop: `${currentSize.borderWidth} solid ${brandRed}`,
      borderRight: `${currentSize.borderWidth} solid ${brandRed}`,
      borderBottom: `${currentSize.borderWidth} solid ${brandRed}`
    },
    tagline: {
      color: '#6b7280',
      fontSize: size === 'small' ? '10px' : '14px',
      marginTop: '8px',
      letterSpacing: '0.5px',
      textAlign: 'center'
    },
    container: {
      display: 'inline-block',
      textAlign: 'center'
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.logoWrapper}>
        <div style={styles.logoLeft}>
          <div style={styles.logoGlobe}>🌐</div>
          <span style={{ whiteSpace: size === 'small' ? 'nowrap' : 'pre-line' }}>
            {size === 'small' ? 'go and' : 'go\nand'}
          </span>
        </div>
        <div style={styles.logoRight}>
          track™
        </div>
      </div>
      {showTagline && (
        <div style={styles.tagline}>AI-Powered Logistics Intelligence</div>
      )}
    </div>
  );
};

export default GoandTrackLogo;