import React, { useState } from "react";
import {
  Aptos,
  AptosConfig,
  Network
} from "@aptos-labs/ts-sdk";

export default function WalletChecker() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Config para mainnet
  const client = new Aptos(
    new AptosConfig({ network: Network.MAINNET })
  );

  const isValidAptosAddress = (addr) => /^0x[a-fA-F0-9]{64}$/.test(addr);

  async function fetchAptBalance(addr) {
    try {
      // Pega saldo de APT direto da SDK
      const balance = await client.getAccountAPTAmount({
        accountAddress: addr,
      });
      return Number(balance) / 1e8; // converte de Octas para APT
    } catch (err) {
      console.error("Erro detalhado:", err);
      throw err;
    }
  }

  async function checkBalance() {
    setError(null);
    setBalance(null);

    if (!isValidAptosAddress(address)) {
      setError("Invalid Aptos address!");
      return;
    }

    setLoading(true);
    try {
      const apt = await fetchAptBalance(address);
      setBalance(apt);
    } catch {
      setError("Error fetching balance.");
    } finally {
      setLoading(false);
    }
  }

  function formatNumberEN(num) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-black">
      <div className="max-w-md w-full space-y-6 text-center">
        <header className="flex items-center justify-center gap-3">
          <img src="/aptos-logo.png" alt="Aptos Logo" className="w-8 h-8" />
          <h1 className="text-3xl font-bold">AptosScanMe</h1>
        </header>

        <input
          type="text"
          placeholder="Paste your Aptos address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-3 border border-gray-400 rounded text-black"
        />

        <button
          onClick={checkBalance}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        >
          {loading ? "Checking..." : "Check Balance"}
        </button>

        {error && <p className="text-red-600">{error}</p>}

        {balance !== null && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Balance (APT):</h2>
            <p className="text-2xl font-bold">{formatNumberEN(balance)}</p>
          </div>
        )}

        <footer className="mt-10 border-t pt-4 text-gray-600 text-sm">
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




