import React from 'react';

/**
 * Simple wallet button for header
 * Shows "Connect to Wallet" or shortened wallet address
 */
function WalletButton({ walletAddress, onClick }) {
  return (
    <button 
      className="header-wallet-btn"
      onClick={onClick}
      aria-label={walletAddress ? 'View wallet' : 'Connect wallet'}
    >
      {walletAddress ? (
        <>
          <span className="wallet-icon">✓</span>
          <span className="wallet-address-short">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        </>
      ) : (
        <>
          <span className="wallet-icon">🔗</span>
          <span>Connect to Wallet</span>
        </>
      )}
    </button>
  );
}

export default WalletButton;
