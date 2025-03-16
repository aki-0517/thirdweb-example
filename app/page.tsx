'use client';

import { useEffect, useState, useCallback } from 'react';
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";

import WalletSection from '../components/WalletSection';
import SwapForm from '../components/SwapForm';
import AaveOperationsForm from '../components/AaveOperationsForm';
import LidoOperationsForm from '../components/LidoOperationsForm';
import EigenLayerOperationsForm from '../components/EigenLayerOperationsForm';

const Page = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [web3Provider, setWeb3Provider] = useState<any>(null);
  const [account, setAccount] = useState('');

  // WalletConnect 用の provider options
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID,
      },
    },
  };

  // Web3Modal のインスタンス作成（インスタンスはコンポーネント内で保持）
  const web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
  });

  // ウォレット接続処理
  const connectWallet = useCallback(async () => {
    try {
      const provider = await web3Modal.connect();
      setWeb3Provider(provider);

      // 接続済みアカウントを取得
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }

      // アカウント変更イベントのリッスン
      if (provider.on) {
        provider.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setWalletConnected(true);
          } else {
            disconnectWallet();
          }
        });
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [web3Modal]);

  // ウォレット切断処理
  const disconnectWallet = async () => {
    if (web3Provider && web3Provider.disconnect) {
      await web3Provider.disconnect();
    }
    await web3Modal.clearCachedProvider();
    setWeb3Provider(null);
    setWalletConnected(false);
    setAccount('');
  };

  // キャッシュがあれば自動接続
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, [connectWallet, web3Modal.cachedProvider]);

  return (
    <div className="container mx-auto p-4">
      {/* ウォレットセクション */}
      <WalletSection
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        walletConnected={walletConnected}
        account={account}
      />

      {/* ウォレット接続時のみ各 DeFi 操作を表示 */}
      {walletConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div className="p-4 border rounded-md">
            <h2 className="text-xl font-bold mb-4 text-center">Uniswap Swap</h2>
            <SwapForm web3Provider={web3Provider} />
          </div>
          <div className="p-4 border rounded-md">
            <h2 className="text-xl font-bold mb-4 text-center">AAVE Operations</h2>
            <AaveOperationsForm web3Provider={web3Provider} />
          </div>
          <div className="p-4 border rounded-md">
            <h2 className="text-xl font-bold mb-4 text-center">Lido Operations</h2>
            <LidoOperationsForm web3Provider={web3Provider} />
          </div>
          <div className="p-4 border rounded-md">
            <EigenLayerOperationsForm web3Provider={web3Provider} />
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-gray-500">
          Please connect your wallet to access DeFi features.
        </p>
      )}
    </div>
  );
};

export default Page;
