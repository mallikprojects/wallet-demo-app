import { useState } from 'react';

/**
 * Custom hook for wallet connection management
 * Extracts wallet connection logic for reusability
 */
export function useWallet() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  /**
   * Connect to MetaMask wallet
   * @returns {Promise<string|null>} Connected wallet address or null on error
   */
  const connect = async () => {
    setIsConnecting(true);
    setError('');

    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      const errorMsg = 'MetaMask is not installed. Please install MetaMask extension.';
      setError(errorMsg);
      setIsConnecting(false);
      return null;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        setIsConnecting(false);
        return accounts[0];
      } else {
        throw new Error('No accounts found');
      }
    } catch (err) {
      console.error('Error connecting to MetaMask:', err);
      const errorMsg = err.message || 'Failed to connect to MetaMask';
      setError(errorMsg);
      setIsConnecting(false);
      return null;
    }
  };

  /**
   * Clear any error messages
   */
  const clearError = () => {
    setError('');
  };

  return {
    connect,        // Function to connect wallet
    isConnecting,   // Boolean: connection in progress
    error,          // String: error message if any
    clearError,     // Function to clear errors
  };
}
