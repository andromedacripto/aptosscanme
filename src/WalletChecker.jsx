import React, { useState } from "react";
import { Aptos, Network } from "@aptos-labs/ts-sdk";

export default function WalletChecker() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const client = new Aptos({ network: Network.MAINNET });

  const isValidAptosAddress = (addr) => /^0x[a-fA-F0-9]{64}$/.test(addr);

  async function fetchAptBalance(addr) {
    try {
      const resources = await client.getAccountResources({ accountAddress: addr });
      console.log("Resources:", resources);

      const coinStore = resources.find(
        (r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
      );

      console.log("CoinStore:", coinStore);

      if (!coinStore) return 0;

      const balanceStr = coinStore.data.coin.value;
      return Number(balanceStr) / 1e8;
    } catch (err) {
      console.error("Erro fetchAptBalance detalhado:", err);
      throw err;
    }
  }

  function formatNumberBR(num) {
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function checkBalance() {
    setError(null);
    setBalance(null);

    if (!isValidAptosAddress(address)) {
      setError("Endereço Aptos inválido!");
      return;
    }

    setLoading(true);
    try {
      const apt = await fetchAptBalance(address);
      setBalance(apt);
    } catch {
      setError("Erro ao buscar saldo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-black">
      <div className="max-w-md w-full space-y-6">
        <header className="flex items-center justify-center gap-3">
          <img src="/aptos-logo.png" alt="Aptos Logo" className="w-8 h-8" />
          <h1 className="text-3xl font-bold">AptosScanMe</h1>
        </header>

        <input
          type="text"
          placeholder="Cole seu endereço Aptos"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-3 border border-gray-400 rounded text-black"
        />

        <button
          onClick={checkBalance}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        >
          {loading ? "Consultando..." : "Consultar saldo"}
        </button>

        {error && <p className="text-red-600 text-center">{error}</p>}

        {balance !== null && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Saldo (APT):</h2>
            <p className="text-2xl font-bold">{formatNumberBR(balance)}</p>
          </div>
        )}

        <footer className="mt-10 border-t pt-4 text-center text-gray-600 text-sm">
          ©2025 AptosScanMe. Powered by{" "}
          <a
            href="https://github.com/andromedacripto"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            GitHub
          </a>{" "}
          • v0.0.1
        </footer>
      </div>
    </div>
  );
}




