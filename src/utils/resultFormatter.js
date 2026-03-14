/**
 * Result Formatter Utility
 */

import { ethers } from 'ethers';

export function formatResult(result, outputs) {
  if (!outputs || outputs.length === 0) {
    return {
      display: 'No return value',
      raw: null,
      formatted: null,
    };
  }

  if (outputs.length === 1) {
    return formatSingleOutput(result, outputs[0]);
  }

  return formatMultipleOutputs(result, outputs);
}

function formatSingleOutput(value, outputDef) {
  const { type } = outputDef;

  try {
    switch (type) {
      case 'address':
        return formatAddress(value);
      
      case 'uint256':
      case 'uint128':
      case 'uint64':
      case 'uint32':
      case 'uint16':
      case 'uint8':
        return formatUint(value, type);
      
      case 'int256':
      case 'int128':
      case 'int64':
      case 'int32':
      case 'int16':
      case 'int8':
        return formatInt(value, type);
      
      case 'bool':
        return formatBool(value);
      
      case 'string':
        return formatString(value);
      
      case 'bytes':
      case 'bytes32':
      case 'bytes4':
        return formatBytes(value);
      
      default:
        return formatDefault(value, type);
    }
  } catch (error) {
    console.error('Error formatting output:', error);
    return {
      display: String(value),
      raw: value,
      formatted: value,
      type,
    };
  }
}

function formatMultipleOutputs(result, outputs) {
  const formatted = {};
  
  outputs.forEach((output, index) => {
    const value = Array.isArray(result) ? result[index] : result[output.name || index];
    const key = output.name || `output${index}`;
    formatted[key] = formatSingleOutput(value, output);
  });

  return {
    display: 'Multiple values (see details)',
    raw: result,
    formatted,
    isMultiple: true,
  };
}

function formatAddress(value) {
  const checksummed = ethers.getAddress(value);
  return {
    display: `${checksummed.slice(0, 6)}...${checksummed.slice(-4)}`,
    displayFull: checksummed,
    raw: value,
    formatted: checksummed,
    type: 'address',
    copyable: true,
  };
}

function formatUint(value, type) {
  const bigIntValue = BigInt(value.toString());
  const stringValue = bigIntValue.toString();
  
  let currencyDisplay = null;
  if (type === 'uint256' && bigIntValue > 1000000n) {
    try {
      const etherValue = ethers.formatEther(bigIntValue);
      if (parseFloat(etherValue) < 1000000) {
        currencyDisplay = `${etherValue} POL`;
      }
    } catch (e) {
      // Not a valid currency amount
    }
  }

  return {
    display: currencyDisplay || addCommas(stringValue),
    displayCurrency: currencyDisplay,
    displayWei: stringValue + ' wei',
    raw: value,
    formatted: stringValue,
    type,
    copyable: true,
  };
}

function formatInt(value, type) {
  const bigIntValue = BigInt(value.toString());
  const stringValue = bigIntValue.toString();
  
  return {
    display: addCommas(stringValue),
    raw: value,
    formatted: stringValue,
    type,
    copyable: true,
  };
}

function formatBool(value) {
  const boolValue = Boolean(value);
  return {
    display: boolValue ? '✓ True' : '✗ False',
    displaySymbol: boolValue ? '✓' : '✗',
    raw: value,
    formatted: boolValue,
    type: 'bool',
    copyable: false,
  };
}

function formatString(value) {
  const stringValue = String(value);
  const truncated = stringValue.length > 100 
    ? stringValue.slice(0, 97) + '...'
    : stringValue;
  
  return {
    display: truncated || '(empty string)',
    displayFull: stringValue,
    raw: value,
    formatted: stringValue,
    type: 'string',
    copyable: true,
    truncated: stringValue.length > 100,
  };
}

function formatBytes(value) {
  const hexValue = value.startsWith('0x') ? value : '0x' + value;
  const truncated = hexValue.length > 20 
    ? hexValue.slice(0, 10) + '...' + hexValue.slice(-6)
    : hexValue;
  
  return {
    display: truncated,
    displayFull: hexValue,
    raw: value,
    formatted: hexValue,
    type: 'bytes',
    copyable: true,
    truncated: hexValue.length > 20,
  };
}

function formatDefault(value, type) {
  const stringValue = value?.toString() || String(value);
  
  return {
    display: stringValue,
    raw: value,
    formatted: stringValue,
    type,
    copyable: true,
  };
}

function addCommas(numString) {
  const parts = numString.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
