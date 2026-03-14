/**
 * Contract Utility Functions
 * Provides helpers for contract configuration
 */

import ContractABI from '../config/abi.json';
import config from '../config/config.json';

/**
 * Get contract address
 * @returns {string} Contract address
 */
export function getContractAddress() {
  return config.contract.address;
}

/**
 * Get contract ABI
 * @returns {Array} Contract ABI
 */
export function getContractABI() {
  return ContractABI;
}

/**
 * Get complete contract configuration
 * @returns {Object} Contract config with address and ABI
 */
export function getContractConfig() {
  return {
    address: getContractAddress(),
    abi: getContractABI(),
  };
}

/**
 * Get deployment information
 * @returns {Object} Deployment details
 */
export function getDeploymentInfo() {
  return {
    network: config.network.shortName,
    deployer: config.deployment.deployer,
    deployedAt: config.deployment.deployedAt,
    blockNumber: config.deployment.blockNumber,
    chainId: config.network.chainIdDecimal,
    rewardPrice: `${config.contract.rewardPrice} ${config.network.currency.symbol}`,
  };
}

/**
 * Get network configuration
 * @returns {Object} Network config
 */
export function getNetworkConfig() {
  return {
    chainId: config.network.chainId,
    chainIdDecimal: config.network.chainIdDecimal,
    name: config.network.name,
    currency: config.network.currency,
    rpcUrls: {
      default: config.network.rpcUrl,
      public: config.network.rpcUrl,
    },
    blockExplorerUrls: {
      default: config.network.blockExplorer,
    },
    testnet: config.network.testnet,
    faucetUrl: config.network.faucetUrl,
  };
}
