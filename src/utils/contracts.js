import { ethers } from 'ethers';
import FactoryABI from '../abis/PredictionMarketFactory.json';
import MarketABI from '../abis/PredictionMarket.json';
import OutcomeTokenABI from '../abis/OutcomeToken.json';
import USDCABI from '../abis/USDC.json';
import { FACTORY_ADDRESS, USDC_ADDRESS } from '../config/constants';
import { getLogoFromQuestion, getCategoryFromQuestion } from '../config/constants';

/* ───── Contract Instances ───── */
export const getFactoryContract = (signerOrProvider) =>
  new ethers.Contract(FACTORY_ADDRESS, FactoryABI.abi, signerOrProvider);

export const getMarketContract = (address, signerOrProvider) =>
  new ethers.Contract(address, MarketABI.abi, signerOrProvider);

export const getTokenContract = (address, signerOrProvider) =>
  new ethers.Contract(address, OutcomeTokenABI.abi, signerOrProvider);

export const getUSDCContract = (signerOrProvider) =>
  new ethers.Contract(USDC_ADDRESS, USDCABI.abi, signerOrProvider);

/* ───── Fetch All Markets ───── */
export async function getAllMarkets(provider) {
  try {
    const factory = getFactoryContract(provider);
    const addresses = await factory.getAllMarkets();

    const markets = [];

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
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

      const yesReserveNum = parseFloat(ethers.utils.formatUnits(yesReserve, 18));
      const noReserveNum = parseFloat(ethers.utils.formatUnits(noReserve, 18));
      const total = yesReserveNum + noReserveNum;

      const yesPrice = total > 0 ? yesReserveNum / total : 0.5;
      const noPrice = total > 0 ? noReserveNum / total : 0.5;

      markets.push({
        address,
        question,
        description: `Market resolves based on ${question}`,
        logo: getLogoFromQuestion(question),
        category: getCategoryFromQuestion(question),
        endTime: endTime.toNumber() * 1000,
        yesPrice,
        noPrice,
        liquidity: (yesReserveNum + noReserveNum) / 2,
        volume: parseFloat(ethers.utils.formatUnits(totalCollateral, 6)),
        resolved,
        cancelled,
        outcome,
        yesToken,
        noToken,
        status: cancelled ? "cancelled" : resolved ? "resolved" : "active",
        yesBalance: 0,
        noBalance: 0,
        lpShares: 0
      });
    }

    return markets;
  } catch (error) {
    console.error("Error fetching markets:", error);
    return [];
  }
}

/* ───── Get User Positions ───── */
export async function getUserPositions(provider, signer) {
  try {
    const userAddress = await signer.getAddress();
    const allMarkets = await getAllMarkets(provider);
    const positions = [];

    for (const market of allMarkets) {
      const marketContract = getMarketContract(market.address, provider);
      const [yesBalance, noBalance] = await marketContract.getUserBalances(userAddress);
      const [lpShares, lpYes, lpNo] = await marketContract.getLPInfo(userAddress);

      const hasPosition = yesBalance.gt(0) || noBalance.gt(0) || lpShares.gt(0);

      if (hasPosition) {
        positions.push({
          ...market,
          yesBalance: parseFloat(ethers.utils.formatUnits(yesBalance, 18)),
          noBalance: parseFloat(ethers.utils.formatUnits(noBalance, 18)),
          lpShares: parseFloat(ethers.utils.formatUnits(lpShares, 0)),
          lpYes: parseFloat(ethers.utils.formatUnits(lpYes, 18)),
          lpNo: parseFloat(ethers.utils.formatUnits(lpNo, 18))
        });
      }
    }

    return positions;
  } catch (error) {
    console.error('Error fetching user positions:', error);
    return [];
  }
}

/* ───── Mint Tokens ───── */
export async function mintTokens(marketAddress, usdcAmount, addToLiquidity, signer) {
  try {
    const usdc = getUSDCContract(signer);
    const market = getMarketContract(marketAddress, signer);
    const amount = ethers.utils.parseUnits(usdcAmount, 6);

    // Approve USDC if needed
    const allowance = await usdc.allowance(await signer.getAddress(), marketAddress);
    if (allowance.lt(amount)) {
      const approveTx = await usdc.approve(marketAddress, ethers.constants.MaxUint256);
      await approveTx.wait();
    }

    // Mint YES/NO tokens
    const mintTx = await market.mint(amount, addToLiquidity);
    return await mintTx.wait();
  } catch (error) {
    console.error('Mint error:', error);
    throw error;
  }
}

/* ───── Swap Tokens ───── */
export async function swapTokens(marketAddress, yesForNo, inputAmount, minOutput, signer) {
  try {
    const market = getMarketContract(marketAddress, signer);
    const marketInfo = await market.getMarketInfo();
    const tokenAddress = yesForNo ? marketInfo[9] : marketInfo[10];
    const token = getTokenContract(tokenAddress, signer);
    const amount = ethers.utils.parseUnits(inputAmount, 18);

    // Approve token if needed
    const allowance = await token.allowance(await signer.getAddress(), marketAddress);
    if (allowance.lt(amount)) {
      const approveTx = await token.approve(marketAddress, ethers.constants.MaxUint256);
      await approveTx.wait();
    }

    const minOut = ethers.utils.parseUnits(minOutput, 18);
    const swapTx = await market.swap(yesForNo, amount, minOut);
    return await swapTx.wait();
  } catch (error) {
    console.error('Swap error:', error);
    throw error;
  }
}

/* ───── Add Liquidity ───── */
export async function addLiquidity(marketAddress, yesAmount, noAmount, signer) {
  try {
    const market = getMarketContract(marketAddress, signer);
    const marketInfo = await market.getMarketInfo();
    const yesToken = getTokenContract(marketInfo[9], signer);
    const noToken = getTokenContract(marketInfo[10], signer);

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

    const tx = await market.addLiquidity(yesAmountParsed, noAmountParsed);
    return await tx.wait();
  } catch (error) {
    console.error('Add liquidity error:', error);
    throw error;
  }
}

/* ───── Remove Liquidity ───── */
export async function removeLiquidity(marketAddress, signer) {
  try {
    const market = getMarketContract(marketAddress, signer);
    const userAddress = await signer.getAddress();
    const [lpShares] = await market.getLPInfo(userAddress);

    const tx = await market.removeLiquidity(lpShares);
    return await tx.wait();
  } catch (error) {
    console.error('Remove liquidity error:', error);
    throw error;
  }
}

/* ───── Claim Winnings ───── */
export async function claimWinnings(marketAddress, signer) {
  try {
    const market = getMarketContract(marketAddress, signer);
    const tx = await market.claim();
    return await tx.wait();
  } catch (error) {
    console.error('Claim error:', error);
    throw error;
  }
}

/* ───── Get Swap Quote ───── */
export async function getSwapQuote(marketAddress, yesForNo, inputAmount, provider) {
  try {
    const market = getMarketContract(marketAddress, provider);
    const amountIn = ethers.utils.parseUnits(inputAmount, 18);
    const amountOut = await market.getAmountOut(yesForNo, amountIn);
    return ethers.utils.formatUnits(amountOut, 18);
  } catch (error) {
    console.error('Quote error:', error);
    return '0';
  }
}