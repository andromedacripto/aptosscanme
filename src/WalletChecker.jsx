import { useState, useEffect } from "react";
import { Aptos, Network } from "@aptos-labs/ts-sdk";

export default function WalletChecker() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(null);
  const [nfts, setNfts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState(Network.MAINNET);
  const [client, setClient] = useState(new Aptos({ network }));

  useEffect(() => {
    setClient(new Aptos({ network }));
    setBalance(null);
    setNfts([]);
    setTransactions([]);
    setError(null);
  }, [network]);

  const isValidAptosAddress = (addr) => /^0x[a-fA-F0-9]{64}$/.test(addr);

  const checkWallet = async () => {
    if (!isValidAptosAddress(address)) {
      setError("Invalid Aptos address format.");
      return;
    }

    setLoading(true);
    setError(null);
    setBalance(null);
    setNfts([]);
    setTransactions([]);

    try {
      const resources = await client.getAccountResources({ accountAddress: address });

      const aptosCoin = resources.find((r) =>
        r.type.includes("0x1::aptos_coin::AptosCoin")
      );
      const balanceAPT = aptosCoin?.data?.coin?.value;
      const balanceUSDC = resources.find((r) =>
        r.type.toLowerCase().includes("usdc")
      )?.data?.coin?.value;
      const balanceUSDT = resources.find((r) =>
        r.type.toLowerCase().includes("usdt")
      )?.data?.coin?.value;

      setBalance({
        APT: balanceAPT ? Number(balanceAPT) / 1e8 : 0,
        USDC: balanceUSDC ? Number(balanceUSDC) / 1e6 : 0,
        USDT: balanceUSDT ? Number(balanceUSDT) / 1e6 : 0,
      });

      const tokens = await client.getAccountOwnedTokens({ accountAddress: address });
      setNfts(tokens);

      const txs = await client.getAccountTransactions({ accountAddress: address });
      if (txs && txs.length > 0) {
        const filtered = txs.filter((tx) => {
          const time = new Date(tx.timestamp / 1000);
          const now = new Date();
          return now.getTime() - time.getTime() <= 24 * 60 * 60 * 1000;
        });
        setTransactions(
          filtered.sort((a, b) => b.timestamp - a.timestamp) // ordenar do mais recente para o mais antigo
        );
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching wallet data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleNetwork = () => {
    setNetwork((prev) =>
      prev === Network.MAINNET ? Network.TESTNET : Network.MAINNET
    );
  };

  return (
    <div className="min-h-screen bg-white text-black px-4 py-10">
      <header className="fixed top-0 left-0 w-full bg-white shadow z-10 px-6 py-4 flex items-center justify-center gap-3">
        <img
          src="/63dbd45d586cb37715b933b2_TuhC2Dz_BkhtHqSc2LEQbbtCKdeCsDJb38eMJ0vd8dGt1JVPtfOHlUI4dWeiJl-yTtF-3OdESFC_AcaSE6FNaPnWpcv2fBKBFAsbRBoqYvSJV6Cc161fE0zGAaXwM9oMSU2UA0O1wGpUz4jQq2Cc0N4.png"
          alt="Aptos Logo"
          className="w-6 h-6"
        />
        <h1 className="text-2xl font-bold">AptosScanMe</h1>
      </header>

      <div className="pt-28 flex flex-col items-center w-full max-w-4xl mx-auto">
        <button
          onClick={toggleNetwork}
          className="mb-4 px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-black font-semibold w-full max-w-xs"
        >
          Switch to {network === Network.MAINNET ? "Testnet" : "Mainnet"}
        </button>

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
            <h2 className="text-xl font-bold mb-4">
              Balances ({network === Network.MAINNET ? "Mainnet" : "Testnet"}):
            </h2>
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
            <h2 className="text-xl font-bold mb-1 text-center">Transactions (last 24h)</h2>
            <p className="text-center mb-4 font-semibold">
              Total transactions from Address: {transactions.length}
            </p>
            <ul className="space-y-3">
              {transactions.map((tx) => {
                const isTransfer =
                  tx.payload?.type === "entry_function_payload" &&
                  tx.payload?.function?.includes("coin::transfer");

                const toAddress = isTransfer ? tx.payload.arguments?.[0] : "Unknown";
                const amount = isTransfer ? Number(tx.payload.arguments?.[1]) / 1e8 : "N/A";

                // Formatar data e hora
                const txDate = new Date(tx.timestamp / 1000);
                const formattedDate = txDate.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = txDate.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                });

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
                      href={`https://explorer.aptoslabs.com/txn/${tx.hash}?network=${network === Network.MAINNET ? "mainnet" : "testnet"}`}
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
          balance && transactions.length === 0 && (
            <p className="mt-8 text-center text-gray-500">No transactions in the last 24 hours.</p>
          )
        )}
      </div>

      <footer className="mt-20 py-6 w-full text-gray-600 text-sm text-center border-t">
        <p className="mb-2">Network: {network === Network.MAINNET ? "Mainnet" : "Testnet"}</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span>© 2025 <strong>AptosScanMe</strong>.</span>
          <a
            href="https://github.com/andromedacripto"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 underline hover:text-blue-600"
          >
            GitHub
          </a>
          <span>• v0.0.1</span>
        </div>
      </footer>
    </div>
  );
}






