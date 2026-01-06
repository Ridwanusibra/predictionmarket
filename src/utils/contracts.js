// contracts.js - Real Web3 integration for your Solidity contracts

import { ethers } from 'ethers';
import FactoryABI from './abis/PredictionMarketFactory.json';
import MarketABI from './abis/PredictionMarket.json';
import OutcomeTokenABI from './abis/OutcomeToken.json';
import USDCABI from './abis/ERC20.json'; // Standard ERC20 ABI

// ============= CONTRACT ADDRESSES =============
export const FACTORY_ADDRESS = '0xf4246b4eC3CC7eF8c9F5BB615E0E545973013A15';
export const USDC_ADDRESS = '0x3600000000000000000000000000000000000000'; // Arc Network USDC

// ============= CONTRACT INSTANCES =============
export const getFactoryContract = (signerOrProvider) =>
  new ethers.Contract(FACTORY_ADDRESS, FactoryABI.abi, signerOrProvider);

export const getMarketContract = (address, signerOrProvider) =>
  new ethers.Contract(address, MarketABI.abi, signerOrProvider);

export const getTokenContract = (address, signerOrProvider) =>
  new ethers.Contract(address, OutcomeTokenABI.abi, signerOrProvider);

export const getUSDCContract = (signerOrProvider) =>
  new ethers.Contract(USDC_ADDRESS, USDCABI.abi, signerOrProvider);

// ============= HELPER FUNCTIONS =============

/**
 * Get all markets from factory
 */
export async function getAllMarkets(provider) {
  const factory = getFactoryContract(provider);
  const count = await factory.getMarketCount();
  const markets = [];

  for (let i = 0; i < count; i++) {
    const address = await factory.markets(i);
    const marketContract = getMarketContract(address, provider);
    
    const [
      question,
      endTime,
      resolutionWindow,
      minBond,
      resolved,
      cancelled,
      outcome,
      totalCollateral,
      totalBonds,
      yesToken,
      noToken
    ] = await marketContract.getMarketInfo();

    const [yesReserve, noReserve, totalShares] = await marketContract.getPoolReserves();

    // Calculate prices
    const total = parseFloat(ethers.utils.formatUnits(yesReserve, 18)) + 
                  parseFloat(ethers.utils.formatUnits(noReserve, 18));
    const yesPrice = total > 0 ? parseFloat(ethers.utils.formatUnits(yesReserve, 18)) / total : 0.5;
    const noPrice = total > 0 ? parseFloat(ethers.utils.formatUnits(noReserve, 18)) / total : 0.5;

    markets.push({
      address,
      question,
      endTime: endTime.toNumber(),
      yesPrice,
      noPrice,
      liquidity: parseFloat(ethers.utils.formatUnits(yesReserve.add(noReserve), 18)) / 2,
      volume: parseFloat(ethers.utils.formatUnits(totalCollateral, 6)),
      resolved,
      cancelled,
      outcome,
      yesToken,
      noToken
    });
  }

  return markets;
}

/**
 * Get user's markets (created by them)
 */
export async function getUserMarkets(provider, signer) {
  const factory = getFactoryContract(provider);
  const userAddress = await signer.getAddress();
  
  // Filter markets where user is owner
  const allMarkets = await getAllMarkets(provider);
  const userMarkets = [];

  for (const market of allMarkets) {
    const marketContract = getMarketContract(market.address, provider);
    const owner = await marketContract.owner();
    
    if (owner.toLowerCase() === userAddress.toLowerCase()) {
      // Get user's balances
      const [yesBalance, noBalance] = await marketContract.getUserBalances(userAddress);
      const [lpShares, lpYes, lpNo] = await marketContract.getLPInfo(userAddress);

      userMarkets.push({
        ...market,
        yesBalance: parseFloat(ethers.utils.formatUnits(yesBalance, 18)),
        noBalance: parseFloat(ethers.utils.formatUnits(noBalance, 18)),
        lpShares: parseFloat(ethers.utils.formatUnits(lpShares, 0)),
        lpYes: parseFloat(ethers.utils.formatUnits(lpYes, 18)),
        lpNo: parseFloat(ethers.utils.formatUnits(lpNo, 18))
      });
    }
  }

  return userMarkets;
}

/**
 * Get user's positions in all markets
 */
export async function getUserPositions(provider, signer) {
  try {
    const userAddress = await signer.getAddress();
    console.log('Fetching positions for:', userAddress);
    
    const allMarkets = await getAllMarkets(provider);
    console.log('Total markets:', allMarkets.length);
    
    const positions = [];

    for (const market of allMarkets) {
      try {
        const marketContract = getMarketContract(market.address, provider);
        
        // Get balances
        const [yesBalance, noBalance] = await marketContract.getUserBalances(userAddress);
        
        // Get LP info
        const [lpShares, lpYes, lpNo] = await marketContract.getLPInfo(userAddress);

        // Check if user has any position
        const hasPosition = yesBalance.gt(0) || noBalance.gt(0) || lpShares.gt(0);

        if (hasPosition) {
          console.log('Position found in market:', market.address);
          positions.push({
            ...market,
            yesBalance: parseFloat(ethers.utils.formatUnits(yesBalance, 18)),
            noBalance: parseFloat(ethers.utils.formatUnits(noBalance, 18)),
            lpShares: parseFloat(ethers.utils.formatUnits(lpShares, 0)),
            lpYes: parseFloat(ethers.utils.formatUnits(lpYes, 18)),
            lpNo: parseFloat(ethers.utils.formatUnits(lpNo, 18))
          });
        }
      } catch (err) {
        console.error('Error fetching position for market:', market.address, err);
      }
    }

    console.log('Total positions found:', positions.length);
    return positions;
  } catch (error) {
    console.error('Error in getUserPositions:', error);
    return [];
  }
}

// ============= TRANSACTION FUNCTIONS =============

/**
 * Mint YES/NO tokens
 * @param {string} marketAddress - Market contract address
 * @param {string} usdcAmount - Amount of USDC to deposit (in USDC decimals = 6)
 * @param {boolean} addToLiquidity - Whether to add minted tokens to liquidity
 * @param {ethers.Signer} signer - User's signer
 */
export async function mintTokens(marketAddress, usdcAmount, addToLiquidity, signer) {
  const usdc = getUSDCContract(signer);
  const market = getMarketContract(marketAddress, signer);

  // Step 1: Approve USDC
  const allowance = await usdc.allowance(await signer.getAddress(), marketAddress);
  const amount = ethers.utils.parseUnits(usdcAmount, 6);

  if (allowance.lt(amount)) {
    const approveTx = await usdc.approve(marketAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
  }

  // Step 2: Mint tokens
  const mintTx = await market.mint(amount, addToLiquidity);
  const receipt = await mintTx.wait();

  return receipt;
}

/**
 * Swap YES for NO or NO for YES
 */
export async function swapTokens(marketAddress, yesForNo, inputAmount, minOutput, signer) {
  const market = getMarketContract(marketAddress, signer);
  const marketInfo = await market.getMarketInfo();
  
  const tokenAddress = yesForNo ? marketInfo[9] : marketInfo[10]; // yesToken : noToken
  const token = getTokenContract(tokenAddress, signer);

  // Approve input token
  const allowance = await token.allowance(await signer.getAddress(), marketAddress);
  const amount = ethers.utils.parseUnits(inputAmount, 18);

  if (allowance.lt(amount)) {
    const approveTx = await token.approve(marketAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
  }

  // Execute swap
  const minOut = ethers.utils.parseUnits(minOutput, 18);
  const swapTx = await market.swap(yesForNo, amount, minOut);
  const receipt = await swapTx.wait();

  return receipt;
}

/**
 * Add liquidity to market
 */
export async function addLiquidity(marketAddress, yesAmount, noAmount, signer) {
  const market = getMarketContract(marketAddress, signer);
  const marketInfo = await market.getMarketInfo();
  
  const yesToken = getTokenContract(marketInfo[9], signer);
  const noToken = getTokenContract(marketInfo[10], signer);

  // Approve both tokens
  const yesAmountParsed = ethers.utils.parseUnits(yesAmount, 18);
  const noAmountParsed = ethers.utils.parseUnits(noAmount, 18);

  const yesAllowance = await yesToken.allowance(await signer.getAddress(), marketAddress);
  const noAllowance = await noToken.allowance(await signer.getAddress(), marketAddress);

  if (yesAllowance.lt(yesAmountParsed)) {
    const approveTx = await yesToken.approve(marketAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
  }

  if (noAllowance.lt(noAmountParsed)) {
    const approveTx = await noToken.approve(marketAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
  }

  // Add liquidity
  const tx = await market.addLiquidity(yesAmountParsed, noAmountParsed);
  const receipt = await tx.wait();

  return receipt;
}

/**
 * Remove all liquidity from market
 */
export async function removeLiquidity(marketAddress, signer) {
  const market = getMarketContract(marketAddress, signer);
  const userAddress = await signer.getAddress();
  const [lpShares] = await market.getLPInfo(userAddress);

  const tx = await market.removeLiquidity(lpShares);
  const receipt = await tx.wait();

  return receipt;
}

/**
 * Claim winnings from resolved market
 */
export async function claimWinnings(marketAddress, signer) {
  const market = getMarketContract(marketAddress, signer);
  const tx = await market.claim();
  const receipt = await tx.wait();

  return receipt;
}

/**
 * Propose market outcome
 */
export async function proposeOutcome(marketAddress, outcome, signer) {
  const market = getMarketContract(marketAddress, signer);
  const usdc = getUSDCContract(signer);
  
  const nextBond = await market.getNextBondAmount();
  
  // Approve USDC for bond
  const allowance = await usdc.allowance(await signer.getAddress(), marketAddress);
  if (allowance.lt(nextBond)) {
    const approveTx = await usdc.approve(marketAddress, ethers.constants.MaxUint256);
    await approveTx.wait();
  }

  // Propose outcome
  const tx = await market.proposeOutcome(outcome);
  const receipt = await tx.wait();

  return receipt;
}

/**
 * Finalize market resolution
 */
export async function finalizeResolution(marketAddress, signer) {
  const market = getMarketContract(marketAddress, signer);
  const tx = await market.finalizeResolution();
  const receipt = await tx.wait();

  return receipt;
}

/**
 * Create new market
 */
export async function createMarket(question, endTime, resolutionWindow, minBond, signer) {
  try {
    console.log('Creating market with params:', { question, endTime, resolutionWindow, minBond });
    
    const factory = getFactoryContract(signer);
    const usdc = getUSDCContract(signer);
    
    const creationFee = await factory.creationFee();
    console.log('Creation fee:', ethers.utils.formatUnits(creationFee, 6), 'USDC');
    
    // Approve creation fee if needed
    if (creationFee.gt(0)) {
      const userAddress = await signer.getAddress();
      const allowance = await usdc.allowance(userAddress, FACTORY_ADDRESS);
      
      if (allowance.lt(creationFee)) {
        console.log('Approving USDC for creation fee...');
        const approveTx = await usdc.approve(FACTORY_ADDRESS, ethers.constants.MaxUint256);
        await approveTx.wait();
        console.log('USDC approved ✅');
      }
    }
    
    // Convert minBond to USDC decimals (6 decimals)
    const minBondParsed = ethers.utils.parseUnits(minBond.toString(), 6);
    
    console.log('Calling factory.createMarket...');
    const tx = await factory.createMarket(
      question,
      endTime,
      resolutionWindow,
      minBondParsed
    );
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed!');
    
    // Extract market address from event
    const event = receipt.events?.find(e => e.event === 'MarketCreated');
    if (!event) {
      throw new Error('MarketCreated event not found in transaction receipt');
    }
    
    const marketAddress = event.args.market;
    console.log('New market created at:', marketAddress);
    
    return { receipt, marketAddress };
    
  } catch (error) {
    console.error('Error in createMarket:', error);
    
    // Better error messages
    if (error.code === 4001) {
      throw new Error('Transaction rejected by user');
    }
    if (error.message?.includes('insufficient funds')) {
      throw new Error('Insufficient funds for gas + creation fee');
    }
    if (error.message?.includes('InvalidEndTime')) {
      throw new Error('End time must be at least 1 hour in the future');
    }
    if (error.message?.includes('InvalidResolutionWindow')) {
      throw new Error('Resolution window must be less than 30 days');
    }
    
    throw error;
  }
}

// ============= UTILITY FUNCTIONS =============

/**
 * Calculate expected output for a swap
 */
export async function getSwapQuote(marketAddress, yesForNo, inputAmount, provider) {
  const market = getMarketContract(marketAddress, provider);
  const amountIn = ethers.utils.parseUnits(inputAmount, 18);
  
  const amountOut = await market.getAmountOut(yesForNo, amountIn);
  return ethers.utils.formatUnits(amountOut, 18);
}

/**
 * Check if user can claim from market
 */
export async function canClaim(marketAddress, userAddress, provider) {
  const market = getMarketContract(marketAddress, provider);
  const marketInfo = await market.getMarketInfo();
  
  if (!marketInfo[4]) return false; // Not resolved
  
  const winningTokenAddress = marketInfo[6] ? marketInfo[9] : marketInfo[10];
  const winningToken = getTokenContract(winningTokenAddress, provider);
  const balance = await winningToken.balanceOf(userAddress);
  
  return balance.gt(0);
}

export default {
  getAllMarkets,
  getUserMarkets,
  getUserPositions,
  mintTokens,
  swapTokens,
  addLiquidity,
  removeLiquidity,
  claimWinnings,
  proposeOutcome,
  finalizeResolution,
  createMarket,
  getSwapQuote,
  canClaim
};