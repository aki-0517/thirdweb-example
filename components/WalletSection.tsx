'use client';

interface WalletSectionProps {
  walletConnected: boolean;
  connectWallet: () => void;
  account?: string;
  disconnectWallet?: () => void;
}

const WalletSection = ({ walletConnected, connectWallet, account, disconnectWallet }: WalletSectionProps) => {
  return (
    <div className="flex justify-end items-center">
      {walletConnected ? (
        <div className="flex items-center space-x-4">
          <span className="font-medium">
            {account ? account : "Connected"}
          </span>
          {disconnectWallet && (
            <button 
              onClick={disconnectWallet}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <button 
          onClick={connectWallet}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletSection;
