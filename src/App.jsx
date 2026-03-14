import React, { useState } from "react";
import Home from "./components/Home";
import WalletModal from "./components/WalletModal";
import ConfigModal from "./components/ConfigModal";
import ParameterReaderModal from "./components/ParameterReaderModal";
import WriteParameterModal from "./components/WriteParameterModal";

/**
 * Main App Component - Orchestrator
 * Manages global state and renders layout
 */
function App() {
  // Wallet state
  const [walletAddress, setWalletAddress] = useState(null);
  
  // Modal states
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);
  const [isWriterModalOpen, setIsWriterModalOpen] = useState(false);

  // Wallet handlers
  const handleOpenWalletModal = () => setIsWalletModalOpen(true);
  const handleCloseWalletModal = () => setIsWalletModalOpen(false);
  const handleConnectWallet = (address) => {
    setWalletAddress(address);
    setIsWalletModalOpen(false);
  };

  // Modal handlers
  const handleOpenConfigModal = () => setIsConfigModalOpen(true);
  const handleCloseConfigModal = () => setIsConfigModalOpen(false);
  
  const handleOpenReaderModal = () => setIsReaderModalOpen(true);
  const handleCloseReaderModal = () => setIsReaderModalOpen(false);
  
  const handleOpenWriterModal = () => setIsWriterModalOpen(true);
  const handleCloseWriterModal = () => setIsWriterModalOpen(false);

  // Transaction success handler
  const handleTransactionSuccess = () => {
    console.log('Transaction successful! Refreshing data...');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>Demo App</h1>
      </header>

      {/* Main Content */}
      <Home 
        walletAddress={walletAddress}
        onOpenWalletModal={handleOpenWalletModal}
        onOpenConfigModal={handleOpenConfigModal}
        onOpenReaderModal={handleOpenReaderModal}
        onOpenWriterModal={handleOpenWriterModal}
      />

      {/* Modals */}
      <WalletModal 
        isOpen={isWalletModalOpen}
        onClose={handleCloseWalletModal}
        onConnect={handleConnectWallet}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={handleCloseConfigModal}
      />

      <ParameterReaderModal
        isOpen={isReaderModalOpen}
        onClose={handleCloseReaderModal}
        walletAddress={walletAddress}
      />

      <WriteParameterModal
        isOpen={isWriterModalOpen}
        onClose={handleCloseWriterModal}
        walletAddress={walletAddress}
        onTransactionSuccess={handleTransactionSuccess}
      />
    </div>
  );
}

export default App;
