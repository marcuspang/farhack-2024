import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  chains: [base, baseSepolia],
  ssr: false,
});
