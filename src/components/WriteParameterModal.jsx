import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { parseABI, validateInput, getReturnTypeDescription, getTypeDescription } from '../utils/abiParser';
import { formatTimestamp, copyToClipboard } from '../utils/resultFormatter';
import { getContractConfig } from '../utils/contract';
import { getChainById } from '../utils/web3';
import config from '../config/config.json';

function WriteParameterModal({ isOpen, onClose, walletAddress, onTransactionSuccess }) {
  const [writeFunctions, setWriteFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [inputErrors, setInputErrors] = useState({});
  const [txStatus, setTxStatus] = useState('idle'); // idle | signing | pending | success | error
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const [txReceipt, setTxReceipt] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFunctions();
    }
  }, [isOpen]);

  useEffect(() => {
    setInputValues({});
    setInputErrors({});
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
    setTxReceipt(null);
    setEstimatedCost(null);
  }, [selectedFunction]);

  const loadFunctions = () => {
    try {
      const { abi } = getContractConfig('Reward', 'amoy');
      if (!abi) {
        console.error('ABI not found');
        return;
      }

      const { writeFunctions } = parseABI(abi);
      console.log('Write functions loaded:', writeFunctions.length, writeFunctions.map(f => f.name));
      
      // Minimal contract only has buyReward function
      const userFunctions = writeFunctions.filter(fn => 
        fn.name === 'buyReward'
      );
      
      setWriteFunctions(userFunctions);

      if (userFunctions.length > 0 && !selectedFunction) {
        setSelectedFunction(userFunctions[0]);
      }
    } catch (error) {
      console.error('Error loading functions:', error);
    }
  };

  const handleFunctionSelect = (fn) => {
    setSelectedFunction(fn);
  };

  const handleInputChange = (inputName, value) => {
    setInputValues(prev => ({
      ...prev,
      [inputName]: value,
    }));

    if (inputErrors[inputName]) {
      setInputErrors(prev => ({
        ...prev,
        [inputName]: null,
      }));
    }

    // Auto-calculate cost for buyReward
    if (selectedFunction?.name === 'buyReward' && inputName === 'amount') {
      calculateCost(value);
    }
  };

  const calculateCost = async (amount) => {
    if (!amount || isNaN(amount)) {
      setEstimatedCost(null);
      return;
    }

    try {
      // Calculate locally: REWARD_PRICE is fixed at 0.01 POL
      const REWARD_PRICE = ethers.parseEther('0.01');
      const cost = BigInt(amount) * REWARD_PRICE;
      setEstimatedCost(ethers.formatEther(cost));
    } catch (error) {
      console.error('Error calculating cost:', error);
      setEstimatedCost(null);
    }
  };

  const validateInputs = () => {
    if (!selectedFunction || !selectedFunction.hasInputs) {
      return true;
    }

    const errors = {};
    let hasErrors = false;

    selectedFunction.inputs.forEach(input => {
      const value = inputValues[input.name];
      const validation = validateInput(value || '', input.type);
      
      if (!validation.valid) {
        errors[input.name] = validation.error;
        hasErrors = true;
      }
    });

    setInputErrors(errors);
    return !hasErrors;
  };

  const handleExecuteTransaction = async () => {
    if (!selectedFunction) return;
    if (!validateInputs()) return;

    setTxStatus('signing');
    setTxError(null);
    setTxHash(null);
    setTxReceipt(null);

    try {
      // Check MetaMask is available
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Check if user is on correct network
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const expectedChainId = '0x13882'; // 80002 in hex (Polygon Amoy)
      
      if (currentChainId !== expectedChainId) {
        throw new Error('Please switch to Polygon Amoy testnet in MetaMask (Chain ID: 80002)');
      }

      // Get signer from MetaMask
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const { address: contractAddress, abi } = getContractConfig('Reward', 'amoy');
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Prepare inputs
      const inputs = selectedFunction.inputs.map(input => {
        const value = inputValues[input.name];
        const validation = validateInput(value, input.type);
        return validation.formatted;
      });

      // Prepare transaction options
      const txOptions = {
        // Gas settings from config (Polygon Amoy requires minimum 25 gwei priority fee)
        maxPriorityFeePerGas: ethers.parseUnits(config.network.gas.maxPriorityFeePerGwei, 'gwei'),
        maxFeePerGas: ethers.parseUnits(config.network.gas.maxFeePerGwei, 'gwei'),
      };
      
      // Add value if function is payable (buyReward)
      if (selectedFunction.isPayable && selectedFunction.name === 'buyReward') {
        const amount = inputs[0];
        
        // Calculate cost locally: REWARD_PRICE is fixed at 0.01 POL
        const REWARD_PRICE = ethers.parseEther('0.01');
        const cost = BigInt(amount) * REWARD_PRICE;
        
        txOptions.value = cost;
        console.log('Buying', amount.toString(), 'rewards for', ethers.formatEther(cost), 'POL');
      }

      console.log('Executing transaction:', selectedFunction.name, inputs, txOptions);
      console.log('🔍 DEBUG: Function isPayable?', selectedFunction.isPayable);
      console.log('🔍 DEBUG: txOptions before call:', txOptions);
      console.log('🔍 DEBUG: Contract address:', contractAddress);
      console.log('🔍 DEBUG: Function name:', selectedFunction.name);
      console.log('🔍 DEBUG: Inputs:', inputs);

      // ===== COMPREHENSIVE PRE-FLIGHT CHECKS =====
      console.log('🛫 === PRE-FLIGHT CHECKS ===');
      
      // Check 1: Verify we're on correct network
      const network = await provider.getNetwork();
      console.log('📡 Current network chainId:', network.chainId.toString());
      console.log('📡 Expected chainId: 80002');
      
      if (network.chainId.toString() !== '80002') {
        throw new Error(`Wrong network: ${network.chainId}. Please switch to Polygon Amoy (80002)`);
      }
      
      // Check 2: Verify contract exists
      const code = await provider.getCode(contractAddress);
      console.log('📜 Contract code exists:', code !== '0x');
      if (code === '0x') {
        throw new Error('Contract not found at this address!');
      }
      
      // Check 3: Check user balance
      const balance = await provider.getBalance(walletAddress);
      console.log('💰 Your POL balance:', ethers.formatEther(balance), 'POL');
      
      if (balance === 0n) {
        throw new Error('You have 0 POL. Get test tokens from https://faucet.polygon.technology/');
      }
      
      // Check 4: Verify we have enough for transaction
      if (selectedFunction.isPayable && txOptions.value) {
        const totalNeeded = txOptions.value + ethers.parseEther('0.001'); // value + estimated gas
        if (balance < totalNeeded) {
          throw new Error(`Insufficient funds. Need ${ethers.formatEther(totalNeeded)} POL but have ${ethers.formatEther(balance)} POL`);
        }
        console.log('✅ Sufficient balance for transaction');
      }
      
      console.log('✅ === ALL CHECKS PASSED ===');

      // Send transaction
      let tx;
      if (selectedFunction.isPayable && txOptions.value) {
        // For payable functions, ensure value is properly passed
        console.log("📤 Sending payable transaction with value:", txOptions.value.toString());
        console.log("⛽ Gas settings - Priority:", ethers.formatUnits(txOptions.maxPriorityFeePerGas, 'gwei'), "gwei, Max:", ethers.formatUnits(txOptions.maxFeePerGas, 'gwei'), "gwei");
        tx = await contract[selectedFunction.name](...inputs, txOptions);
      } else {
        // Non-payable function
        tx = await contract[selectedFunction.name](...inputs, txOptions);
      }
      setTxHash(tx.hash);
      setTxStatus('pending');

      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      setTxReceipt(receipt);
      setTxStatus('success');

      console.log('Transaction confirmed:', receipt);

      // Notify parent to refresh read data
      if (onTransactionSuccess) {
        setTimeout(() => onTransactionSuccess(), 1000);
      }

    } catch (error) {
      console.error('Transaction error:', error);
      
      let errorMsg = error.message || 'Transaction failed';
      let errorType = 'unknown';

      if (error.code === 'ACTION_REJECTED' || errorMsg.includes('user rejected')) {
        errorMsg = 'You rejected the transaction';
        errorType = 'rejected';
      } else if (errorMsg.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds to complete transaction';
        errorType = 'insufficient_funds';
      } else if (errorMsg.includes('execution reverted')) {
        errorMsg = 'Transaction reverted by contract';
        errorType = 'revert';
      } else if (errorMsg.includes('switch to Polygon Amoy')) {
        errorType = 'wrong_network';
      } else if (errorMsg.includes('MetaMask not installed')) {
        errorType = 'no_metamask';
      }

      setTxError({
        type: errorType,
        message: errorMsg,
        technical: error.toString(),
      });
      setTxStatus('error');
    }
  };

  const handleReset = () => {
    setInputValues({});
    setInputErrors({});
    setTxStatus('idle');
    setTxHash(null);
    setTxError(null);
    setTxReceipt(null);
    setEstimatedCost(null);
  };

  const filteredFunctions = writeFunctions.filter(fn => 
    fn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fn.signature.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content parameter-writer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Write to Contract</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="parameter-reader-body">
          <div className="function-list-panel">
            <div className="panel-header">
              <h3>Write Functions</h3>
              <div className="function-count">{writeFunctions.length}</div>
            </div>

            <div className="function-search">
              <input
                type="text"
                placeholder="Search functions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="function-list">
              {filteredFunctions.map((fn, index) => (
                <div
                  key={index}
                  className={`function-item ${selectedFunction?.name === fn.name ? 'active' : ''}`}
                  onClick={() => handleFunctionSelect(fn)}
                >
                  <div className="function-name">
                    {fn.name}
                    {fn.isPayable && <span className="payable-badge">💳</span>}
                  </div>
                  <div className="function-params">
                    {fn.hasInputs ? `${fn.inputCount} param${fn.inputCount > 1 ? 's' : ''}` : 'no params'}
                  </div>
                </div>
              ))}

              {filteredFunctions.length === 0 && (
                <div className="no-functions">No functions found</div>
              )}
            </div>
          </div>

          <div className="reader-interface-panel">
            {selectedFunction ? (
              <>
                <div className="function-details">
                  <h3>
                    {selectedFunction.name}()
                    {selectedFunction.isPayable && <span className="payable-tag">Requires Payment</span>}
                  </h3>
                  <div className="function-signature">{selectedFunction.signature}</div>
                  {selectedFunction.hasOutputs && (
                    <div className="function-returns">
                      Returns: {getReturnTypeDescription(selectedFunction.outputs)}
                    </div>
                  )}
                </div>

                <div className="wallet-info-box">
                  <div className="wallet-info-label">Transaction from:</div>
                  <div className="wallet-info-address">
                    {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Not connected'}
                  </div>
                </div>

                {selectedFunction.hasInputs && (
                  <div className="input-section">
                    <h4>Input Parameters</h4>
                    {selectedFunction.inputs.map((input, index) => (
                      <div key={index} className="input-group">
                        <label>
                          {input.name} <span className="input-type">({input.type})</span>
                        </label>
                        <input
                          type="text"
                          value={inputValues[input.name] || ''}
                          onChange={(e) => handleInputChange(input.name, e.target.value)}
                          placeholder={getTypeDescription(input.type)}
                          className={inputErrors[input.name] ? 'input-error' : ''}
                          disabled={txStatus === 'signing' || txStatus === 'pending'}
                        />
                        {inputErrors[input.name] && (
                          <div className="input-error-text">{inputErrors[input.name]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {estimatedCost && (
                  <div className="cost-estimate-box">
                    <div className="cost-label">Estimated Cost:</div>
                    <div className="cost-value">{estimatedCost} POL</div>
                    <div className="cost-note">+ gas fees</div>
                  </div>
                )}

                <div className={`status-indicator status-${txStatus}`}>
                  {txStatus === 'idle' && '⚡ Ready to execute'}
                  {txStatus === 'signing' && (
                    <>
                      <div className="spinner small"></div>
                      Waiting for signature...
                    </>
                  )}
                  {txStatus === 'pending' && (
                    <>
                      <div className="spinner small"></div>
                      Transaction pending...
                    </>
                  )}
                  {txStatus === 'success' && '✅ Transaction successful'}
                  {txStatus === 'error' && '❌ Transaction failed'}
                </div>

                {txHash && (
                  <div className="tx-hash-box">
                    <div className="tx-hash-label">Transaction Hash:</div>
                    <div className="tx-hash-value">
                      {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      <button
                        className="copy-btn-small"
                        onClick={() => copyToClipboard(txHash)}
                        title="Copy transaction hash"
                      >
                        📋
                      </button>
                    </div>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                    >
                      View on Explorer ↗
                    </a>
                  </div>
                )}

                <div className="action-buttons">
                  <button
                    className="btn-primary"
                    onClick={handleExecuteTransaction}
                    disabled={txStatus === 'signing' || txStatus === 'pending'}
                  >
                    {txStatus === 'signing' && 'Signing...'}
                    {txStatus === 'pending' && 'Processing...'}
                    {(txStatus === 'idle' || txStatus === 'success' || txStatus === 'error') && 'Execute Transaction'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleReset}
                    disabled={txStatus === 'signing' || txStatus === 'pending'}
                  >
                    Reset
                  </button>
                </div>

                {txStatus === 'success' && txReceipt && (
                  <div className="result-section success">
                    <h4>Transaction Confirmed</h4>
                    <div className="tx-details">
                      <div className="tx-detail-item">
                        <span className="tx-detail-label">Block Number:</span>
                        <span className="tx-detail-value">{txReceipt.blockNumber}</span>
                      </div>
                      <div className="tx-detail-item">
                        <span className="tx-detail-label">Gas Used:</span>
                        <span className="tx-detail-value">{txReceipt.gasUsed.toString()}</span>
                      </div>
                      <div className="tx-detail-item">
                        <span className="tx-detail-label">Status:</span>
                        <span className="tx-detail-value success-status">Success ✓</span>
                      </div>
                    </div>
                    <div className="success-message">
                      🎉 Your transaction has been confirmed on the blockchain!
                    </div>
                  </div>
                )}

                {txStatus === 'error' && txError && (
                  <div className="result-section error">
                    <h4>Transaction Failed</h4>
                    <div className="error-message">
                      <div className="error-type">{txError.type.toUpperCase()}</div>
                      <div className="error-text">{txError.message}</div>
                      {txError.type === 'wrong_network' && (
                        <div style={{marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.8)', borderRadius: '6px'}}>
                          <strong>How to switch:</strong>
                          <ol style={{margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px'}}>
                            <li>Open MetaMask</li>
                            <li>Click the network dropdown at the top</li>
                            <li>Select "Polygon Amoy Testnet"</li>
                            <li>Try the transaction again</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-selection">
                <p>Select a function from the list to execute a transaction</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WriteParameterModal;
