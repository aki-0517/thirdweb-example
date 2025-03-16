'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { BigNumber } from "@ethersproject/bignumber";

// AAVE Lending Pool のアドレス（ネットワークに合わせて変更してください）
const AAVE_LENDING_POOL_ADDRESS = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

// ERC20 の最低限のABI
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

// AAVE Lending Pool の最低限のABI（supply, borrow, getUserAccountData）
const AAVE_LENDING_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) public",
  "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) public",
  "function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)"
];

interface AaveOperationsFormProps {
  web3Provider: any; // WalletConnect/Web3Modalなどから接続されたプロバイダー
}

const AaveOperationsForm = ({ web3Provider }: AaveOperationsFormProps) => {
  // 供給（Supply）用の状態
  const [supplyToken, setSupplyToken] = useState('0xYourTokenAddress');
  const [supplyAmount, setSupplyAmount] = useState('1');
  const [supplyStatus, setSupplyStatus] = useState('');

  // 借入（Borrow）用の状態
  const [borrowToken, setBorrowToken] = useState('0xYourTokenAddress');
  const [borrowAmount, setBorrowAmount] = useState('1');
  const [borrowStatus, setBorrowStatus] = useState('');

  // ユーザーアカウント情報取得用
  const [accountData, setAccountData] = useState<any>(null);
  const [accountStatus, setAccountStatus] = useState('');

  // 共通：プロバイダーとシグナーの取得
  const getSignerAndAddress = async () => {
    if (!web3Provider) throw new Error('Wallet not connected');
    const provider = new ethers.BrowserProvider(web3Provider);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    return { provider, signer, userAddress };
  };

  // 供給処理
  const handleSupply = async () => {
    try {
      setSupplyStatus('Processing supply...');
      const { signer, userAddress } = await getSignerAndAddress();

      // 供給するトークンのインスタンスを生成
      const tokenContract = new ethers.Contract(supplyToken, ERC20_ABI, signer);
      // トークンの小数点桁数を取得
      const decimals: number = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(supplyAmount, decimals);

      // 供給先であるAAVE Lending Poolへの承認が足りるか確認
      const currentAllowance: bigint = await tokenContract.allowance(userAddress, AAVE_LENDING_POOL_ADDRESS);
      if (currentAllowance < amountInWei) {
        setSupplyStatus('Approving token...');
        const approveTx = await tokenContract.approve(AAVE_LENDING_POOL_ADDRESS, amountInWei);
        await approveTx.wait();
      }

      // AAVE Lending Pool コントラクトのインスタンス作成
      const aaveContract = new ethers.Contract(AAVE_LENDING_POOL_ADDRESS, AAVE_LENDING_POOL_ABI, signer);
      setSupplyStatus('Sending supply transaction...');
      // supply関数呼び出し (referralCodeは0を指定)
      const tx = await aaveContract.supply(supplyToken, amountInWei, userAddress, 0);
      setSupplyStatus('Awaiting confirmation...');
      await tx.wait();
      setSupplyStatus('Supply successful!');
    } catch (error: any) {
      console.error("Supply failed:", error);
      setSupplyStatus(`Supply failed: ${error.message}`);
    }
  };

  // 借入処理（変動金利モードを固定として実装）
  const handleBorrow = async () => {
    try {
      setBorrowStatus('Processing borrow...');
      const { signer, userAddress } = await getSignerAndAddress();

      // 借入するトークンのインスタンスを生成
      const tokenContract = new ethers.Contract(borrowToken, ERC20_ABI, signer);
      const decimals: number = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(borrowAmount, decimals);

      // AAVE Lending Pool コントラクトのインスタンス作成
      const aaveContract = new ethers.Contract(AAVE_LENDING_POOL_ADDRESS, AAVE_LENDING_POOL_ABI, signer);
      // interestRateMode: 2 (変動金利)、referralCode: 0
      setBorrowStatus('Sending borrow transaction...');
      const tx = await aaveContract.borrow(borrowToken, amountInWei, 2, 0, userAddress);
      setBorrowStatus('Awaiting confirmation...');
      await tx.wait();
      setBorrowStatus('Borrow successful!');
    } catch (error: any) {
      console.error("Borrow failed:", error);
      setBorrowStatus(`Borrow failed: ${error.message}`);
    }
  };

  // ユーザーアカウントデータ取得処理
  const handleGetAccountData = async () => {
    try {
      setAccountStatus('Fetching account data...');
      const { signer, userAddress } = await getSignerAndAddress();

      const aaveContract = new ethers.Contract(AAVE_LENDING_POOL_ADDRESS, AAVE_LENDING_POOL_ABI, signer);
      const data = await aaveContract.getUserAccountData(userAddress);
      // 返却値はタプルになっているため、分かりやすく整形（healthFactorは大きな数値なので適宜変換）
      const formattedData = {
        totalCollateralBase: data.totalCollateralBase.toString(),
        totalDebtBase: data.totalDebtBase.toString(),
        availableBorrowsBase: data.availableBorrowsBase.toString(),
        currentLiquidationThreshold: data.currentLiquidationThreshold.toString(),
        ltv: data.ltv.toString(),
        healthFactor: ethers.formatUnits(data.healthFactor, 18)
      };
      setAccountData(formattedData);
      setAccountStatus('Account data fetched successfully!');
    } catch (error: any) {
      console.error("Get account data failed:", error);
      setAccountStatus(`Failed to fetch account data: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Supply Section */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-bold mb-4">AAVE - Supply</h2>
        <div className="mb-2">
          <label className="block mb-1">Token Address</label>
          <input
            type="text"
            value={supplyToken}
            onChange={(e) => setSupplyToken(e.target.value)}
            placeholder="e.g., 0x..."
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            value={supplyAmount}
            onChange={(e) => setSupplyAmount(e.target.value)}
            placeholder="Amount to supply"
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          onClick={handleSupply}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Supply
        </button>
        {supplyStatus && <p className="mt-2">{supplyStatus}</p>}
      </div>

      {/* Borrow Section */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-bold mb-4">AAVE - Borrow</h2>
        <div className="mb-2">
          <label className="block mb-1">Token Address</label>
          <input
            type="text"
            value={borrowToken}
            onChange={(e) => setBorrowToken(e.target.value)}
            placeholder="e.g., 0x..."
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">Amount</label>
          <input
            type="number"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder="Amount to borrow"
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          onClick={handleBorrow}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Borrow
        </button>
        {borrowStatus && <p className="mt-2">{borrowStatus}</p>}
      </div>

      {/* Get Account Data Section */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-bold mb-4">AAVE - User Account Data</h2>
        <button
          onClick={handleGetAccountData}
          className="mb-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Get Account Data
        </button>
        {accountStatus && <p className="mb-2">{accountStatus}</p>}
        {accountData && (
          <div className="bg-gray-100 p-2 rounded">
            <p><strong>Total Collateral (Base):</strong> {accountData.totalCollateralBase}</p>
            <p><strong>Total Debt (Base):</strong> {accountData.totalDebtBase}</p>
            <p><strong>Available Borrows (Base):</strong> {accountData.availableBorrowsBase}</p>
            <p><strong>Liquidation Threshold:</strong> {accountData.currentLiquidationThreshold}</p>
            <p><strong>LTV:</strong> {accountData.ltv}</p>
            <p><strong>Health Factor:</strong> {accountData.healthFactor}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AaveOperationsForm;
