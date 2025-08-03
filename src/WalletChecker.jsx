import { useState, useEffect } from "react";
import { Aptos, Network } from "@aptos-labs/ts-sdk";

export default function WalletChecker() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  // Cliente fixo na mainnet
  const client = new Aptos({ network: Network.MAINNET });

  const isValidAptosAddress = (addr) => /^0x[a-fA-F0-9]{64}$/.test(addr);

  // Função para buscar saldo APT pela API REST oficial
  const fetchAptBalance = async (addr) => {
    try {
      const url = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${addr}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`;
      const res = await fetch(url);
      if (!res.ok) return 0;
      const data = await res.json();
      return Number(data.data.coin.value) / 1e8;
    } catch {
      return 0;
    }
  };

  const checkWallet = async () => {
    setError(null);
    setBalance(null);
    setNfts([]);
    setTransactions([]);

    if (!isValidAptosAddress(address)) {
      setError("Invalid Aptos address format.");
      return;
    }

    setLoading(true);

    try {
      // Saldo APT via REST
      const balanceAPT = await fetchAptBalance(address);

      // Recursos para USDC e USDT via SDK
      const resources = await client.getAccountResources({ accountAddress: address });
      const balanceUSDC = resources.find(r =>
        r.type.toLowerCase().includes("usdc")
      )?.data?.coin?.value;
      const balanceUSDT = resources.find(r =>
        r.type.toLowerCase().includes("usdt")
      )?.data?.coin?.value;

      setBalance({
        APT: balanceAPT,
        USDC: balanceUSDC ? Number(balanceUSDC) / 1e6 : 0,
        USDT: balanceUSDT ? Number(balanceUSDT) / 1e6 : 0,
      });

      // NFTs
      const tokens = await client.getAccountOwnedTokens({ accountAddress: address });
      setNfts(tokens);

      // Transações
      const txs = await client.getAccountTransactions({ accountAddress: address });
      setTransactions(txs);

    } catch (err) {
      console.error(err);
      setError("Error fetching wallet data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black px-4 py-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-center gap-3 mb-10">
        <img
          src="/63dbd45d586cb37715b933b2_TuhC2Dz_BkhtHqSc2LEQbbtCKdeCsDJb38eMJ0vd8dGt1JVPtfOHlUI4dWeiJl-yTtF-3OdESFC_AcaSE6FNaPnWpcv2fBKBFAsbRBoqYvSJV6Cc161fE0zGAaXwM9oMSU2UA0O1wGpUz4jQq2Cc0N4.png"
          alt="Aptos Logo"
          className="w-6 h-6"
        />
        <h1 className="text-2xl font-bold">AptosScanMe</h1>
      </header>

      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Paste your Aptos address here"
        className="w-full max-w-md p-3 rounded mb-4 border border-gray-400"
      />

      <button
        onClick={checkWallet}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold text-white transition w-full max-w-md"
      >
        {loading ? "Loading..." : "Check Wallet"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {balance && (
        <div className="mt-6 text-center w-full max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">Balances (Mainnet):</h2>
          <ul className="flex justify-center gap-8 text-lg font-semibold">
            <li>APT: {balance.APT}</li>
            <li>USDC: {balance.USDC}</li>
            <li>USDT: {balance.USDT}</li>
            <li>Total NFTs: {nfts.length}</li>
          </ul>
        </div>
      )}

      {transactions.length > 0 ? (
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="text-xl font-bold mb-1 text-center">Transactions</h2>
          <ul className="space-y-3 max-h-80 overflow-auto border rounded p-3">
            {transactions.map((tx) => {
              const isTransfer =
                tx.payload?.type === "entry_function_payload" &&
                tx.payload?.function?.includes("coin::transfer");

              const toAddress = isTransfer ? tx.payload.arguments?.[0] : "Unknown";
              const amount = isTransfer ? Number(tx.payload.arguments?.[1]) / 1e8 : "N/A";

              const txDate = new Date(tx.timestamp / 1000);
              const formattedDate = txDate.toLocaleDateString();
              const formattedTime = txDate.toLocaleTimeString();

              return (
                <li key={tx.hash} className="bg-gray-100 rounded p-3 text-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <p><strong>To:</strong> {toAddress}</p>
                    <p><strong>Amount:</strong> {amount}</p>
                  </div>
                  <div className="text-gray-600 text-xs whitespace-nowrap">
                    {formattedDate} {formattedTime}
                  </div>
                  <a
                    href={`https://explorer.aptoslabs.com/txn/${tx.hash}?network=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 text-sm mt-1 sm:mt-0"
                  >
                    View on Explorer
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        balance && <p className="mt-8 text-center text-gray-500">No transactions found.</p>
      )}
    </div>
  );
}




