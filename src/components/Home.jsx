import React from "react";

/**
 * Home Page Component
 * Main content area with sidebar cards and getting started section
 */
function Home({ 
  walletAddress, 
  onOpenWalletModal,
  onOpenConfigModal,
  onOpenReaderModal,
  onOpenWriterModal 
}) {
  return (
    <main className="app-main">
      <div className="sidebar">
        {/* Connect Wallet Card */}
        <div className="setup-card">
          <h3>Connect Wallet</h3>
          {walletAddress ? (
            <div className="card-content">
              <div className="status-badge connected">✓ Connected</div>
              <div className="wallet-address-box">
                <label>WALLET ADDRESS</label>
                <p className="address-text">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
              </div>
              <button className="card-action-btn reconnect" onClick={onOpenWalletModal}>
                Reconnect
              </button>
            </div>
          ) : (
            <div className="card-content">
              <div className="status-badge disconnected">Not Connected</div>
              <p className="card-description">Connect your wallet to get started</p>
              <button className="card-action-btn" onClick={onOpenWalletModal}>
                Connect to Wallet
              </button>
            </div>
          )}
        </div>

        {/* Chain & Contract Setup Card */}
        <div className={`setup-card ${!walletAddress ? 'disabled' : ''}`}>
          <h3>Chain & Contract Setup</h3>
          <div className="card-content">
            {walletAddress ? (
              <>
                <p className="card-description">Configure blockchain and contract settings</p>
                <button className="card-action-btn" onClick={onOpenConfigModal}>
                  Open Setup
                </button>
              </>
            ) : (
              <p className="card-description disabled-text">
                Connect your wallet first to configure chain and contract settings
              </p>
            )}
          </div>
        </div>

        {/* Read Parameters Card */}
        <div className={`setup-card ${!walletAddress ? 'disabled' : ''}`}>
          <h3>Read Parameters</h3>
          <div className="card-content">
            {walletAddress ? (
              <>
                <p className="card-description">Read data from the smart contract</p>
                <button className="card-action-btn" onClick={onOpenReaderModal}>
                  Open Reader
                </button>
              </>
            ) : (
              <p className="card-description disabled-text">
                Connect your wallet first to read blockchain data
              </p>
            )}
          </div>
        </div>

        {/* Write Parameters Card */}
        <div className={`setup-card ${!walletAddress ? 'disabled' : ''}`}>
          <h3>Write Parameters</h3>
          <div className="card-content">
            {walletAddress ? (
              <>
                <p className="card-description">Execute transactions on the blockchain</p>
                <button className="card-action-btn" onClick={onOpenWriterModal}>
                  Open Writer
                </button>
              </>
            ) : (
              <p className="card-description disabled-text">
                Connect your wallet first to write to the blockchain
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="content">
        <h2>Getting Started</h2>
        {walletAddress ? (
          <div className="wallet-info">
            <div className="connected-status">
              <div className="status-indicator active"></div>
              <h3>Status: <span className="status-active">Connected</span></h3>
            </div>
            <div className="info-row">
              <label>Wallet Address:</label>
              <div className="address-display">{walletAddress}</div>
            </div>
            <div className="whats-next">
              <h4>Available Actions</h4>
              <ul className="action-list">
                <li>
                  <span className="action-icon">📋</span>
                  <div>
                    <strong>Chain & Contract Setup:</strong>
                    <span className="action-desc">View network and contract configuration</span>
                  </div>
                </li>
                <li>
                  <span className="action-icon">📖</span>
                  <div>
                    <strong>Read Parameters:</strong>
                    <span className="action-desc">Query contract state (balances, prices, etc.)</span>
                  </div>
                </li>
                <li>
                  <span className="action-icon">✍️</span>
                  <div>
                    <strong>Write Parameters:</strong>
                    <span className="action-desc">Execute transactions (buy rewards, transfer tokens)</span>
                  </div>
                </li>
              </ul>
              <div className="tip-box">
                <div className="tip-header">💡 Try this:</div>
                <ol className="tip-list">
                  <li>Open <strong>Read Parameters</strong> to check your reward balance</li>
                  <li>Use <strong>Write Parameters</strong> to buy rewards (costs POL)</li>
                  <li>Check your new balance in Read Parameters!</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="wallet-info disconnected">
            <h3 className="welcome-title">Welcome! 👋</h3>
            <p className="welcome-text">
              This app lets you interact with a smart contract on Polygon Amoy testnet.
            </p>
            <div className="quick-start-box">
              <h4>Quick Start:</h4>
              <ol className="start-steps">
                <li>Click <strong>"Connect to Wallet"</strong> in the sidebar</li>
                <li>Approve the connection in MetaMask</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Home;
