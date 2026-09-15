import { createContext, useContext, useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:3000";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [user, setUser] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  useEffect(() => {
    if (!window.ethereum) return;

    function handleAccountsChanged(accounts) {
      if (accounts.length === 0) {
        setWalletAddress(null);
        setUser(null);
        setSigner(null);
      } else {
        connectWallet();
      }
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () =>
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connectWallet() {
    setError(null);
    setNeedsRegistration(false);
    if (!window.ethereum) {
      setError("MetaMask not found. Please install it.");
      return;
    }
    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const newSigner = await provider.getSigner();
      const address = await newSigner.getAddress();
      setSigner(newSigner);
      setWalletAddress(address);

      const res = await fetch(`${BACKEND_URL}/users/by-wallet/${address}`);
      if (res.ok) {
        setUser(await res.json());
      } else {
        setNeedsRegistration(true);
      }
    } catch (err) {
      setError(`Something went wrong: ${err.message}`);
    }
  }

  async function register({ name, email, role }) {
    setError(null);
    const res = await fetch(`${BACKEND_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, walletAddress }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return false;
    }
    setUser(data);
    setNeedsRegistration(false);
    return true;
  }

  return (
    <AuthContext.Provider
      value={{
        walletAddress,
        user,
        signer,
        error,
        needsRegistration,
        connectWallet,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
