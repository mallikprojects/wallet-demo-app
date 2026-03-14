/**
 * ABI Parser Utility
 */

import { ethers } from 'ethers';

export function parseABI(abi) {
  if (!Array.isArray(abi)) {
    console.error('Invalid ABI: expected array');
    return { viewFunctions: [], writeFunctions: [] };
  }

  const functions = abi.filter(item => item.type === 'function');
  
  const viewFunctions = functions.filter(fn => 
    fn.stateMutability === 'view' || fn.stateMutability === 'pure'
  );
  
  const writeFunctions = functions.filter(fn => 
    fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable'
  );

  return {
    viewFunctions: viewFunctions.map(enhanceFunctionInfo),
    writeFunctions: writeFunctions.map(enhanceFunctionInfo),
  };
}

function enhanceFunctionInfo(functionABI) {
  const { name, inputs = [], outputs = [], stateMutability } = functionABI;
  
  return {
    name,
    signature: buildSignature(name, inputs),
    inputs: inputs.map(input => ({
      name: input.name || 'param',
      type: input.type,
      internalType: input.internalType,
    })),
    outputs: outputs.map(output => ({
      name: output.name || 'result',
      type: output.type,
      internalType: output.internalType,
    })),
    stateMutability,
    isPayable: stateMutability === 'payable',
    hasInputs: inputs.length > 0,
    hasOutputs: outputs.length > 0,
    inputCount: inputs.length,
    outputCount: outputs.length,
  };
}

function buildSignature(name, inputs) {
  if (inputs.length === 0) {
    return `${name}()`;
  }
  
  const params = inputs.map(input => {
    const paramName = input.name || 'param';
    return `${input.type} ${paramName}`;
  }).join(', ');
  
  return `${name}(${params})`;
}

export function getReturnTypeDescription(outputs) {
  if (!outputs || outputs.length === 0) {
    return 'void';
  }
  
  if (outputs.length === 1) {
    return outputs[0].type;
  }
  
  return `(${outputs.map(o => o.type).join(', ')})`;
}

export function validateInput(value, type) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Value is required', formatted: null };
  }

  try {
    if (type === 'address') {
      if (!ethers.isAddress(value)) {
        return { valid: false, error: 'Invalid Ethereum address', formatted: null };
      }
      return { valid: true, error: null, formatted: ethers.getAddress(value) };
    }

    if (type.startsWith('uint')) {
      const num = BigInt(value);
      if (num < 0n) {
        return { valid: false, error: 'Value must be positive', formatted: null };
      }
      return { valid: true, error: null, formatted: value };
    }

    if (type.startsWith('int')) {
      BigInt(value);
      return { valid: true, error: null, formatted: value };
    }

    if (type === 'bool') {
      const lower = value.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        return { valid: false, error: 'Value must be true or false', formatted: null };
      }
      return { valid: true, error: null, formatted: lower === 'true' };
    }

    if (type.startsWith('bytes')) {
      if (!value.startsWith('0x')) {
        return { valid: false, error: 'Bytes must start with 0x', formatted: null };
      }
      return { valid: true, error: null, formatted: value };
    }

    if (type === 'string') {
      return { valid: true, error: null, formatted: value };
    }

    return { valid: true, error: null, formatted: value };

  } catch (error) {
    return { valid: false, error: `Invalid ${type} format`, formatted: null };
  }
}

export function getTypeDescription(type) {
  const descriptions = {
    'address': 'Ethereum address (0x...)',
    'uint256': 'Unsigned integer (positive number)',
    'int256': 'Signed integer (positive or negative)',
    'bool': 'Boolean (true or false)',
    'string': 'Text string',
    'bytes': 'Hexadecimal bytes (0x...)',
    'bytes32': 'Fixed-size bytes (0x...)',
  };

  return descriptions[type] || type;
}
