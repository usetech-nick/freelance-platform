import { createContext, useContext, useState } from "react";

const BACKEND_URL = "http://localhost:3000";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [user, setUser] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);

  async function connectWallet() {
    setError(null);
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
        const userData = await res.json();
        setUser(userData);
      } else {
        setError("This wallet isn't registered as a user yet.");
      }
    } catch (err) {
      setError(`Something went wrong: ${err.message}`);
    }
  }

  return (
    <AuthContext.Provider
      value={{ walletAddress, user, signer, error, connectWallet }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
