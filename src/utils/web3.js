import { ethers } from 'ethers';
import { getNetworkConfig } from './contract';
import config from '../config/config.json';

const DEFAULT_CHAIN = config.network.shortName;

export function isMetaMaskInstalled() {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
}

export function getProvider() {
  if (!isMetaMaskInstalled()) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner() {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
}

export async function requestAccounts() {
  if (!isMetaMaskInstalled()) throw new Error('MetaMask not installed');
  return await window.ethereum.request({ method: 'eth_requestAccounts' });
}

export async function getCurrentChainId() {
  if (!isMetaMaskInstalled()) return null;
  try {
    return await window.ethereum.request({ method: 'eth_chainId' });
  } catch (error) {
    return null;
  }
}

export async function getNetworkInfo() {
  const provider = getProvider();
  if (!provider) return null;
  try {
    const network = await provider.getNetwork();
    const chainConfig = getChainById(network.chainId);
    return {
      chainId: network.chainId.toString(),
      chainIdHex: '0x' + network.chainId.toString(16),
      name: chainConfig?.name || 'Unknown',
      isTestnet: chainConfig?.testnet || false,
    };
  } catch (error) {
    return null;
  }
}

export function formatAddress(address, startChars = 6, endChars = 4) {
  if (!address || address.length < startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Get chain by ID
 * @param {string|number} chainId - Chain ID
 * @returns {Object|null} Chain config or null
 */
export function getChainById(chainId) {
  const chainIdNum = typeof chainId === 'string' && chainId.startsWith('0x')
    ? parseInt(chainId, 16) : parseInt(chainId);
  const networkConfig = getNetworkConfig();
  return chainIdNum === networkConfig.chainIdDecimal ? networkConfig : null;
}

/**
 * Format chain for MetaMask
 * @returns {Object} Formatted chain config
 */
export function formatChainForMetaMask() {
  const networkConfig = getNetworkConfig();
  return {
    chainId: networkConfig.chainId,
    chainName: networkConfig.name,
    nativeCurrency: networkConfig.currency,
    rpcUrls: [networkConfig.rpcUrls.default],
    blockExplorerUrls: [networkConfig.blockExplorerUrls.default],
  };
}
