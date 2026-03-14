import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { parseABI, validateInput, getReturnTypeDescription, getTypeDescription } from '../utils/abiParser';
import { readContractParameter } from '../utils/contractReader';
import { formatResult, formatTimestamp, formatDuration, copyToClipboard } from '../utils/resultFormatter';
import { getContractConfig } from '../utils/contract';
import { getChainById } from '../utils/web3';

function ParameterReaderModal({ isOpen, onClose, walletAddress }) {
  const [viewFunctions, setViewFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [inputErrors, setInputErrors] = useState({});
  const [readStatus, setReadStatus] = useState('idle');
  const [readResult, setReadResult] = useState(null);
  const [readError, setReadError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFunctions();
    }
  }, [isOpen]);

  useEffect(() => {
    setInputValues({});
    setInputErrors({});
    setReadStatus('idle');
    setReadResult(null);
    setReadError(null);
  }, [selectedFunction]);

  const loadFunctions = () => {
    try {
      const { abi } = getContractConfig('Reward', 'amoy');
      if (!abi) {
        console.error('ABI not found');
        return;
      }

      const { viewFunctions } = parseABI(abi);
      console.log('View functions loaded:', viewFunctions.length, viewFunctions.map(f => f.name));
      setViewFunctions(viewFunctions);

      if (viewFunctions.length > 0 && !selectedFunction) {
        const noInputFunc = viewFunctions.find(fn => !fn.hasInputs) || viewFunctions[0];
        setSelectedFunction(noInputFunc);
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

  const handleReadParameter = async () => {
    if (!selectedFunction) return;

    if (!validateInputs()) {
      return;
    }

    setReadStatus('loading');
    setReadError(null);
    setReadResult(null);

    try {
      // Use MetaMask provider to preserve wallet context for msg.sender
      // This is important for functions like getMyBalance() that rely on msg.sender
      let provider;
      let providerOrSigner;
      
      if (window.ethereum && walletAddress) {
        // Use MetaMask provider with signer (preserves msg.sender context)
        provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        providerOrSigner = signer; // Use signer for correct msg.sender context
        console.log('📖 Using signer for read (msg.sender will be:', await signer.getAddress(), ')');
      } else {
        // Fallback to RPC provider for functions that don't need msg.sender
        const chainConfig = getChainById(80002);
        if (!chainConfig || !chainConfig.rpcUrls?.default) {
          throw new Error('Chain configuration not found');
        }
        provider = new ethers.JsonRpcProvider(chainConfig.rpcUrls.default);
        providerOrSigner = provider;
      }

      const { address: contractAddress, abi } = getContractConfig('Reward', 'amoy');

      const inputs = selectedFunction.inputs.map(input => {
        const value = inputValues[input.name] || walletAddress;
        const validation = validateInput(value, input.type);
        return validation.formatted;
      });

      const result = await readContractParameter({
        contractAddress,
        abi,
        functionName: selectedFunction.name,
        inputs,
        provider: providerOrSigner, // Pass signer if available
      });

      if (result.success) {
        const formattedResult = formatResult(result.result, selectedFunction.outputs);
        setReadResult({
          ...result,
          formatted: formattedResult,
        });
        setReadStatus('success');
      } else {
        setReadError(result.error);
        setReadStatus('error');
      }

    } catch (error) {
      console.error('Error reading parameter:', error);
      setReadError({
        type: 'unknown',
        message: error.message || 'Failed to read parameter',
        technical: error.toString(),
        suggestion: 'Please try again',
        retryable: true,
      });
      setReadStatus('error');
    }
  };

  const handleClear = () => {
    setInputValues({});
    setInputErrors({});
    setReadStatus('idle');
    setReadResult(null);
    setReadError(null);
  };

  const handleCopy = async (text, field) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const filteredFunctions = viewFunctions.filter(fn => 
    fn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fn.signature.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content parameter-reader-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Contract Parameter Reader</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="parameter-reader-body">
          <div className="function-list-panel">
            <div className="panel-header">
              <h3>View Functions</h3>
              <div className="function-count">{viewFunctions.length}</div>
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
                  <div className="function-name">{fn.name}</div>
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
                  <h3>{selectedFunction.name}()</h3>
                  <div className="function-signature">{selectedFunction.signature}</div>
                  <div className="function-returns">
                    Returns: {getReturnTypeDescription(selectedFunction.outputs)}
                  </div>
                </div>

                {selectedFunction.hasInputs && selectedFunction.inputs.some(i => i.type === 'address') && (
                  <div className="wallet-info-box">
                    <div className="wallet-info-label">Using your connected wallet:</div>
                    <div className="wallet-info-address">
                      {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Not connected'}
                    </div>
                  </div>
                )}

                {selectedFunction.hasInputs && selectedFunction.inputs.some(i => i.type !== 'address') && (
                  <div className="input-section">
                    <h4>Input Parameters</h4>
                    {selectedFunction.inputs.filter(i => i.type !== 'address').map((input, index) => (
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
                        />
                        {inputErrors[input.name] && (
                          <div className="input-error-text">{inputErrors[input.name]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className={`status-indicator status-${readStatus}`}>
                  {readStatus === 'idle' && '🔵 Ready to read'}
                  {readStatus === 'loading' && (
                    <>
                      <div className="spinner small"></div>
                      Reading from blockchain...
                    </>
                  )}
                  {readStatus === 'success' && '✅ Read successful'}
                  {readStatus === 'error' && '❌ Read failed'}
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-primary"
                    onClick={handleReadParameter}
                    disabled={readStatus === 'loading'}
                  >
                    {readStatus === 'loading' ? 'Reading...' : 'Read Value'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleClear}
                    disabled={readStatus === 'loading'}
                  >
                    Clear
                  </button>
                </div>

                {readStatus === 'success' && readResult && (
                  <div className="result-section success">
                    <h4>Result</h4>
                    {renderResult(readResult.formatted, handleCopy, copiedField)}
                    <div className="result-meta">
                      <div>Read at: {formatTimestamp(readResult.timestamp)}</div>
                      <div>Duration: {formatDuration(readResult.duration)}</div>
                    </div>
                  </div>
                )}

                {readStatus === 'error' && readError && (
                  <div className="result-section error">
                    <h4>Error</h4>
                    <div className="error-message">
                      <div className="error-type">{readError.type.toUpperCase()}</div>
                      <div className="error-text">{readError.message}</div>
                      {readError.suggestion && (
                        <div className="error-suggestion">💡 {readError.suggestion}</div>
                      )}
                    </div>
                    {readError.retryable && (
                      <button className="btn-retry" onClick={handleReadParameter}>
                        Try Again
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="no-selection">
                <p>Select a function from the list to read its value</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderResult(formatted, handleCopy, copiedField) {
  if (!formatted) {
    return <div className="result-value">No result</div>;
  }

  if (formatted.isMultiple) {
    return (
      <div className="result-multiple">
        {Object.entries(formatted.formatted).map(([key, value]) => (
          <div key={key} className="result-item">
            <div className="result-label">{key}:</div>
            <div className="result-value-group">
              <div className="result-value">{value.display}</div>
              {value.copyable && (
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(value.formatted, key)}
                  title="Copy to clipboard"
                >
                  {copiedField === key ? '✓' : '📋'}
                </button>
              )}
            </div>
            {value.displayCurrency && (
              <div className="result-alt">{value.displayWei}</div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="result-single">
      <div className="result-value-group">
        <div className="result-value main">{formatted.display}</div>
        {formatted.copyable && (
          <button
            className="copy-btn"
            onClick={() => handleCopy(formatted.formatted, 'main')}
            title="Copy to clipboard"
          >
            {copiedField === 'main' ? '✓ Copied' : '📋 Copy'}
          </button>
        )}
      </div>
      {formatted.displayCurrency && formatted.displayWei && (
        <div className="result-alt">{formatted.displayWei}</div>
      )}
      {formatted.displayFull && formatted.truncated && (
        <div className="result-full" title={formatted.displayFull}>
          {formatted.displayFull}
        </div>
      )}
    </div>
  );
}

export default ParameterReaderModal;
