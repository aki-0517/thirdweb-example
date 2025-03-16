'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

interface EigenLayerOperationsFormProps {
  web3Provider: any; // WalletConnect や Web3Modal などで接続されたプロバイダー
}

const EigenLayerOperationsForm = ({ web3Provider }: EigenLayerOperationsFormProps) => {
  const [assetAddress, setAssetAddress] = useState('0xYourAssetAddress');
  const [amount, setAmount] = useState('1');
  const [status, setStatus] = useState('');

  // reStake 操作の処理
  const handleReStake = async () => {
    if (!web3Provider) return;
    try {
      setStatus('Processing reStake...');
      const provider = new ethers.BrowserProvider(web3Provider);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // EigenLayer コントラクトの設定
      const EIGENLAYER_ADDRESS = "0xdfB5f6CE42aAA7830E94ECFCcAd411beF4d4D5b6";
      const EIGENLAYER_ABI = [
        "function depositIntoStrategy(address strategy, address token, uint256 amount) public"
      ];

      // ERC20 の最低限の ABI
      const ERC20_ABI = [
        "function decimals() view returns (uint8)",
        "function approve(address spender, uint256 amount) public returns (bool)"
      ];

      // 対象トークンのインスタンス生成
      const tokenContract = new ethers.Contract(assetAddress, ERC20_ABI, signer);
      const decimals: number = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // EigenLayer 用のアセット使用承認
      setStatus('Approving token...');
      const approveTx = await tokenContract.approve(EIGENLAYER_ADDRESS, amountInWei);
      await approveTx.wait();

      // reStake 処理：strategy アドレスはツール実装内の固定値を使用
      const strategyAddress = "0x7D704507b76571a51d9caE8AdDAbBFd0ba0e63d3";
      setStatus('Depositing into strategy...');
      const eigenlayerContract = new ethers.Contract(EIGENLAYER_ADDRESS, EIGENLAYER_ABI, signer);
      const depositTx = await eigenlayerContract.depositIntoStrategy(strategyAddress, assetAddress, amountInWei);
      await depositTx.wait();

      setStatus('ReStake successful!');
    } catch (error: any) {
      console.error("ReStake failed:", error);
      setStatus(`ReStake failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-4 text-center">EigenLayer Operations</h2>
      <div className="mb-2">
        <label className="block mb-1">Asset Address</label>
        <input
          type="text"
          value={assetAddress}
          onChange={(e) => setAssetAddress(e.target.value)}
          placeholder="例: 0x..."
          className="w-full border p-2 rounded"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to reStake"
          className="w-full border p-2 rounded"
        />
      </div>
      <button
        onClick={handleReStake}
        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
      >
        ReStake
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
};

export default EigenLayerOperationsForm;
