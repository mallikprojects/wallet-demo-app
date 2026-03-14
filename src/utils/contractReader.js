/**
 * Generic Contract Reader Utility
 */

import { ethers } from 'ethers';

export async function readContractParameter({
  contractAddress,
  abi,
  functionName,
  inputs = [],
  provider,
}) {
  const startTime = Date.now();

  try {
    if (!contractAddress) {
      throw new Error('Contract address is required');
    }

    if (!ethers.isAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    if (!abi || !Array.isArray(abi)) {
      throw new Error('Invalid ABI');
    }

    if (!functionName) {
      throw new Error('Function name is required');
    }

    if (!provider) {
      throw new Error('Provider is required');
    }

    const contract = new ethers.Contract(contractAddress, abi, provider);

    if (typeof contract[functionName] !== 'function') {
      throw new Error(`Function "${functionName}" not found in contract`);
    }

    // Log if we have a signer (for debugging msg.sender issues)
    if (provider.getAddress) {
      const signerAddress = await provider.getAddress();
      console.log(`📖 Contract call from address: ${signerAddress}`);
    }

    console.log(`Calling ${functionName} with inputs:`, inputs);
    const result = await contract[functionName](...inputs);
    console.log(`Result from ${functionName}:`, result);

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: true,
      result: result,
      rawResult: result.toString ? result.toString() : result,
      error: null,
      duration,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`Error reading contract parameter:`, error);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      success: false,
      result: null,
      rawResult: null,
      error: parseError(error),
      duration,
      timestamp: new Date().toISOString(),
    };
  }
}

function parseError(error) {
  let type = 'unknown';
  let message = error.message || 'Unknown error occurred';
  let technical = error.toString();
  let suggestion = 'Please try again or check your inputs';
  let retryable = true;

  if (message.includes('execution reverted')) {
    type = 'contract';
    suggestion = 'The contract rejected this call. Check if function requires special permissions or conditions.';
  }

  if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
    type = 'network';
    message = 'Network connection failed';
    suggestion = 'Check your internet connection and try again';
    retryable = true;
  }

  if (message.includes('invalid address')) {
    type = 'validation';
    message = 'Invalid Ethereum address provided';
    suggestion = 'Please provide a valid Ethereum address (0x...)';
    retryable = false;
  }

  if (message.includes('not found')) {
    type = 'validation';
    suggestion = 'This function may not exist in the deployed contract';
    retryable = false;
  }

  if (message.includes('could not decode') || message.includes('BAD_DATA')) {
    type = 'contract';
    message = 'Contract not found or not responding';
    suggestion = 'Verify the contract is deployed at this address on the correct network';
    retryable = true;
  }

  if (message.includes('argument') || message.includes('param')) {
    type = 'validation';
    suggestion = 'Check that you provided the correct number and type of inputs';
    retryable = false;
  }

  return {
    type,
    message,
    technical,
    suggestion,
    retryable,
  };
}
