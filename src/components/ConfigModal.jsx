import React, { useState, useEffect } from 'react';
import config from '../config/config.json';
import { getContractABI } from '../utils/contract';
import { getNetworkInfo } from '../utils/web3';

function ConfigModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('chain');
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [chainInfo, setChainInfo] = useState({
    name: config.network.name,
    chainId: config.network.chainIdDecimal,
    rpcUrl: config.network.rpcUrl,
    explorer: config.network.blockExplorer,
    currency: config.network.currency.symbol,
  });

  const [contractABI, setContractABI] = useState(JSON.stringify(getContractABI(), null, 2));

  // Load current network info
  useEffect(() => {
    if (isOpen) {
      loadNetworkInfo();
    }
  }, [isOpen]);

  const loadNetworkInfo = async () => {
    try {
      const networkInfo = await getNetworkInfo();
      setCurrentNetwork(networkInfo);
    } catch (error) {
      console.error('Error loading network info:', error);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      console.log('Saved:', { chainInfo, contractABI });
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chain & Contract Setup</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Current Network Status */}
        {currentNetwork && (
          <div className="network-status">
            <div className="status-badge">
              <span className="status-indicator active"></span>
              <strong>Connected Network:</strong> {currentNetwork.name} (Chain ID: {currentNetwork.chainId})
            </div>
          </div>
        )}

        <div className="config-tabs">
          <button
            className={`tab-button ${activeTab === 'chain' ? 'active' : ''}`}
            onClick={() => setActiveTab('chain')}
          >
            🌐 Chain Info
          </button>
          <button
            className={`tab-button ${activeTab === 'abi' ? 'active' : ''}`}
            onClick={() => setActiveTab('abi')}
          >
            📄 Contract ABI
          </button>
        </div>

        <div className="config-content">
          {activeTab === 'chain' && (
            <div className="config-section">
              <div className="form-group">
                <label>Network Name</label>
                <input
                  type="text"
                  value={chainInfo.name}
                  onChange={(e) => setChainInfo({ ...chainInfo, name: e.target.value })}
                  className="form-input"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Chain ID</label>
                <input
                  type="text"
                  value={chainInfo.chainId}
                  onChange={(e) => setChainInfo({ ...chainInfo, chainId: e.target.value })}
                  className="form-input"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>RPC URL</label>
                <input
                  type="text"
                  value={chainInfo.rpcUrl}
                  onChange={(e) => setChainInfo({ ...chainInfo, rpcUrl: e.target.value })}
                  className="form-input"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Block Explorer</label>
                <input
                  type="text"
                  value={chainInfo.explorer}
                  onChange={(e) => setChainInfo({ ...chainInfo, explorer: e.target.value })}
                  className="form-input"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Currency Symbol</label>
                <input
                  type="text"
                  value={chainInfo.currency}
                  onChange={(e) => setChainInfo({ ...chainInfo, currency: e.target.value })}
                  className="form-input"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleEdit}>
                  {isEditing ? 'Save Changes' : 'Edit Chain Info'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'abi' && (
            <div className="config-section">
              <div className="form-group">
                <label>Contract ABI</label>
                <textarea
                  value={contractABI}
                  onChange={(e) => setContractABI(e.target.value)}
                  className="form-textarea"
                  rows={15}
                  disabled={!isEditing}
                  spellCheck={false}
                />
                <p className="form-hint">
                  Contract Application Binary Interface (ABI) in JSON format
                </p>
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleEdit}>
                  {isEditing ? 'Save Changes' : 'Edit Contract ABI'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfigModal;
