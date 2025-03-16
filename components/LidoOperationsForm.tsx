'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

// Lido コントラクト情報（Sepolia ネットワーク用）
const LIDO_ADDRESS = "0x3e3FE7dBc6B4C189E7128855dD526361c49b40Af";
const LIDO_ABI = [
  {
    constant: false,
    inputs: [{ name: "_referral", type: "address" }],
    name: "submit",
    outputs: [{ name: "", type: "uint256" }],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
  // stETH 残高取得用（ERC20 の最小限の ABI）
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

interface LidoOperationsFormProps {
  web3Provider: any; // WalletConnect や Web3Modal などで接続されたプロバイダー
}

const LidoOperationsForm = ({ web3Provider }: LidoOperationsFormProps) => {
  // ステーキング用状態
  const [stakeAmount, setStakeAmount] = useState('1');
  const [referralAddress, setReferralAddress] = useState('0x0000000000000000000000000000000000000000');
  const [stakeStatus, setStakeStatus] = useState('');

  // 残高取得用状態
  const [ethBalance, setEthBalance] = useState('');
  const [stETHBalance, setStETHBalance] = useState('');
  const [balanceStatus, setBalanceStatus] = useState('');

  // プロバイダー、シグナー、ユーザーアドレスを取得する共通処理
  const getSignerAndAddress = async () => {
    if (!web3Provider) throw new Error('ウォレットが接続されていません');
    const provider = new ethers.BrowserProvider(web3Provider);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    return { provider, signer, userAddress };
  };

  // Lido の submit 関数を呼び出して ETH をステークする処理
  const handleStake = async () => {
    try {
      setStakeStatus('ステーク処理中...');
      const { signer } = await getSignerAndAddress();
      const lidoContract = new ethers.Contract(LIDO_ADDRESS, LIDO_ABI, signer);
      const amountInWei = ethers.parseUnits(stakeAmount, "ether");
      // submit 関数に referralAddress を渡しつつ、ETH（payable）として送信
      const tx = await lidoContract.submit(referralAddress, { value: amountInWei });
      setStakeStatus('トランザクション送信済み。確認中...');
      await tx.wait();
      setStakeStatus('ステーク成功！');
    } catch (error: any) {
      console.error("ステーク失敗:", error);
      setStakeStatus(`ステーク失敗: ${error.message}`);
    }
  };

  // ETH 残高と stETH 残高を取得する処理
  const handleGetBalances = async () => {
    try {
      setBalanceStatus('残高取得中...');
      const { provider, userAddress } = await getSignerAndAddress();
      // ETH 残高
      const ethBal = await provider.getBalance(userAddress);
      setEthBalance(ethers.formatEther(ethBal));
      // stETH 残高：Lido コントラクト（ERC20 として）を利用
      const lidoContract = new ethers.Contract(LIDO_ADDRESS, LIDO_ABI, provider);
      const stETHBal = await lidoContract.balanceOf(userAddress);
      let decimals = 18;
      try {
        decimals = await lidoContract.decimals();
      } catch {
        // decimals 関数が取得できない場合は 18 とする
      }
      setStETHBalance(ethers.formatUnits(stETHBal, decimals));
      setBalanceStatus('残高の取得に成功しました！');
    } catch (error: any) {
      console.error("残高取得失敗:", error);
      setBalanceStatus(`残高取得失敗: ${error.message}`);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* ステーク処理セクション */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-bold mb-4">Lido - ETH ステーク</h2>
        <div className="mb-2">
          <label className="block mb-1">Referral アドレス</label>
          <input
            type="text"
            value={referralAddress}
            onChange={(e) => setReferralAddress(e.target.value)}
            placeholder="例: 0x..."
            className="w-full border p-2 rounded"
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1">ステーク量 (ETH)</label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="例: 1"
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          onClick={handleStake}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          ETH をステーク
        </button>
        {stakeStatus && <p className="mt-2">{stakeStatus}</p>}
      </div>

      {/* 残高取得セクション */}
      <div className="p-4 border rounded-md">
        <h2 className="text-xl font-bold mb-4">残高確認</h2>
        <button
          onClick={handleGetBalances}
          className="mb-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          残高を取得
        </button>
        {balanceStatus && <p className="mb-2">{balanceStatus}</p>}
        <div className="bg-gray-100 p-2 rounded">
          <p><strong>ETH 残高:</strong> {ethBalance}</p>
          <p><strong>stETH 残高:</strong> {stETHBalance}</p>
        </div>
      </div>
    </div>
  );
};

export default LidoOperationsForm;
