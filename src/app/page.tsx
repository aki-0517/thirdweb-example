import { createThirdwebClient, getContract, resolveMethod } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import { ThirdwebProvider } from "thirdweb/react";

// create the client with your clientId, or secretKey if in a server environment
export const client = createThirdwebClient({ 
  clientId: "bd3ec27ce65a21d9bc23aa2a93080287" 
});

// connect to your contract
export const contract = getContract({ 
  client, 
  chain: defineChain(421614), 
  address: "0xBfc25c27A6e4eDFe5414B249D892A9acf90Fe911"
});

export default function Home() {
  return (
    <main className="flex min-h-screen items-center p-24">
      <iframe
    src="https://embed.ipfscdn.io/ipfs/bafybeicd3qfzelz4su7ng6n523virdsgobrc5pcbarhwqv3dj3drh645pi/?contract=0xBfc25c27A6e4eDFe5414B249D892A9acf90Fe911&chain=%7B%22name%22%3A%22Arbitrum+Sepolia%22%2C%22chain%22%3A%22ETH%22%2C%22rpc%22%3A%5B%22https%3A%2F%2F421614.rpc.thirdweb.com%2F%24%7BTHIRDWEB_API_KEY%7D%22%5D%2C%22nativeCurrency%22%3A%7B%22name%22%3A%22Sepolia+Ether%22%2C%22symbol%22%3A%22ETH%22%2C%22decimals%22%3A18%7D%2C%22shortName%22%3A%22arb-sep%22%2C%22chainId%22%3A421614%2C%22testnet%22%3Atrue%2C%22slug%22%3A%22arbitrum-sepolia%22%7D&clientId=bd3ec27ce65a21d9bc23aa2a93080287&theme=light&primaryColor=purple"
    width="max"
    height="600"
    // style="max-width:100%;"
    // frameborder="0"
></iframe>
<iframe
    src="https://embed.ipfscdn.io/ipfs/bafybeicd3qfzelz4su7ng6n523virdsgobrc5pcbarhwqv3dj3drh645pi/?contract=0xBfc25c27A6e4eDFe5414B249D892A9acf90Fe911&chain=%7B%22name%22%3A%22Arbitrum+Sepolia%22%2C%22chain%22%3A%22ETH%22%2C%22rpc%22%3A%5B%22https%3A%2F%2F421614.rpc.thirdweb.com%2F%24%7BTHIRDWEB_API_KEY%7D%22%5D%2C%22nativeCurrency%22%3A%7B%22name%22%3A%22Sepolia+Ether%22%2C%22symbol%22%3A%22ETH%22%2C%22decimals%22%3A18%7D%2C%22shortName%22%3A%22arb-sep%22%2C%22chainId%22%3A421614%2C%22testnet%22%3Atrue%2C%22slug%22%3A%22arbitrum-sepolia%22%7D&clientId=bd3ec27ce65a21d9bc23aa2a93080287&theme=light&primaryColor=purple"
    width="max"
    height="600"
    // style="max-width:100%;"
    // frameborder="0"
></iframe>
    </main>
  );
}
