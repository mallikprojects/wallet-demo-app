import React from "react";
import { useWallet } from "../hooks/useWallet";

function WalletModal({ isOpen, onClose, onConnect }) {
  const { connect, isConnecting, error } = useWallet();

  const handleMetaMaskConnect = async () => {
    const address = await connect();
    if (address) {
      onConnect(address);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connect to Wallet</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Connect your wallet to interact with the blockchain
          </p>
          
          <button
            className="wallet-option-btn"
            onClick={handleMetaMaskConnect}
            disabled={isConnecting}
          >
            <span className="wallet-icon">🦊</span>
            <span className="wallet-name">
              {isConnecting ? "Connecting..." : "Connect with MetaMask"}
            </span>
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletModal;
