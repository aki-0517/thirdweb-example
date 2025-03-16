'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import UNISWAP_ROUTER_ABI from '../abis/uniswapRouterABI';

// Uniswap V4 Universal Router のアドレス（ネットワークに合わせて変更）
const UNISWAP_ROUTER_ADDRESS = "0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b";

// ERC20 の最低限の ABI（approve と allowance 用）
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

interface SwapFormProps {
  web3Provider: any; // WalletConnect/Web3Modal で接続したプロバイダーを想定
}

const SwapForm = ({ web3Provider }: SwapFormProps) => {
  const [tokenIn, setTokenIn] = useState('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238');
  const [tokenOut, setTokenOut] = useState('0xfff9976782d46cc05630d1f6ebab18b2324d6b14');
  const [amount, setAmount] = useState('1');
  const [status, setStatus] = useState('');

  const handleSwap = async () => {
    try {
      setStatus('Processing...');
      if (!web3Provider) {
        setStatus('Wallet not connected');
        return;
      }

      // プロバイダーおよびシグナーの作成（web3Provider を利用）
      const provider = new ethers.BrowserProvider(web3Provider);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      console.log("User Address:", userAddress);

      // amount の変換
      const amountIn = ethers.parseUnits(amount, 18);
      console.log("Amount In:", amountIn.toString());
      
      const amountOutMin = 0; // ※スリッページ対策等は各自実装してください
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 分後
      console.log("Deadline:", deadline);

      // tokenIn の承認（approve）処理
      const tokenInContract = new ethers.Contract(tokenIn, ERC20_ABI, signer);
      const currentAllowance = await tokenInContract.allowance(userAddress, UNISWAP_ROUTER_ADDRESS);
      console.log("Current Allowance:", currentAllowance.toString());
      if (currentAllowance < amountIn) {
        setStatus('Approving token...');
        const approveTx = await tokenInContract.approve(UNISWAP_ROUTER_ADDRESS, amountIn);
        console.log("Approve Transaction Sent:", approveTx.hash);
        await approveTx.wait();
        console.log("Token approved");
      } else {
        console.log("Sufficient allowance exists");
      }

      // コマンドと入力パラメータのエンコード
      const commands = "0x06"; // 例: swap コマンド（SWAP_EXACT_IN_SINGLE）
      console.log("Commands:", commands);
      const abiCoder = ethers.AbiCoder.defaultAbiCoder();
      
      // 各パラメータを個別にエンコードして inputs 配列に格納
      const encodedAmountIn = abiCoder.encode(["uint256"], [amountIn]);
      const encodedAmountOutMin = abiCoder.encode(["uint256"], [amountOutMin]);
      const encodedTokenIn = abiCoder.encode(["address"], [tokenIn]);
      const encodedTokenOut = abiCoder.encode(["address"], [tokenOut]);
      const encodedRecipient = abiCoder.encode(["address"], [userAddress]);

      console.log("Encoded amountIn:", encodedAmountIn);
      console.log("Encoded amountOutMin:", encodedAmountOutMin);
      console.log("Encoded tokenIn:", encodedTokenIn);
      console.log("Encoded tokenOut:", encodedTokenOut);
      console.log("Encoded recipient:", encodedRecipient);

      const inputs = [
        encodedAmountIn,
        encodedAmountOutMin,
        encodedTokenIn,
        encodedTokenOut,
        encodedRecipient
      ];

      console.log("Inputs:", inputs);

      // execute 関数の呼び出し
      setStatus('Sending swap transaction...');
      const router = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, signer);
      console.log("Calling execute with deadline:", deadline);
      const tx = await router.execute(commands, inputs, deadline, {
        value: 0 // ETH を送らない前提（ERC20 の場合）
      });
      console.log("Swap Transaction Sent:", tx.hash);
      setStatus('Awaiting confirmation...');
      await tx.wait();
      setStatus('Swap successful!');
      console.log("Swap transaction:", tx);
    } catch (error: any) {
      console.error("Swap failed:", error);
      setStatus(`Swap failed: ${error.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-md mt-4">
      <h2 className="text-xl font-bold mb-4">Token Swap (Uniswap V4 Universal Router)</h2>
      <div className="mb-2">
        <label className="block mb-1">Token In (Address)</label>
        <input
          type="text"
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          placeholder="e.g., 0x..."
          className="w-full border p-2 rounded"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Token Out (Address)</label>
        <input
          type="text"
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
          placeholder="e.g., 0x..."
          className="w-full border p-2 rounded"
        />
      </div>
      <div className="mb-2">
        <label className="block mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to swap"
          className="w-full border p-2 rounded"
        />
      </div>
      <button
        onClick={handleSwap}
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Swap
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
};

export default SwapForm;
