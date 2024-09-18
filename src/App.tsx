import { Button } from "@/components/ui/button";
import { config } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, WagmiProvider } from "wagmi";
import { startGeneration, verifyValidatorSignature } from "./utils";

import { ConnectButton, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Main />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

const res = {
  taskId: "c206831f36184e73b916d56f023978de",
  publicFields: [],
  allocatorAddress: "0x19a567b3b212a5b35bA0E3B600FbEd5c2eE9083d",
  publicFieldsHash:
    "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6",
  allocatorSignature:
    "0xea60f8607f99ab8935300fbab75fb04cc885d0d2b028caa2e14301355320628f6817e43610f0775662c2de7a86bc68887a947f8b0b85ad0a40f6d9d846458be31b",
  uHash: "0x5b32b66ceb9f251ac34a651eddd479d1a67bfd5a2d903f2192b2c95ad9729077",
  validatorAddress: "0xb1C4C1E1Cdd5Cf69E27A3A08C8f51145c2E12C6a",
  validatorSignature:
    "0x0f66eb2fd8ce1300c2b4813dc80335e6d36357b1da0a2d393f29f60777319eac395f3bd3463efc850ea11e1d4ab417eb8508342c8eb1e667932a43f853e5df151b",
  recipient: "0x7730B4Cdc1B1E7a33A309AB7205411faD009C106",
} as const;

function Main() {
  const { address } = useAccount();

  const handleVerify = async () => {
    if (!address) return;
    const { isVerified, isTransgateAvailable } = await startGeneration(address);
    console.log({ isVerified, isTransgateAvailable });
  };

  const test = async () => {
    const a = await verifyValidatorSignature(
      res.taskId,
      res.uHash,
      res.publicFieldsHash,
      res.recipient,
      res.validatorSignature,
      res.validatorAddress
    );
    console.log({ a });
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h1 className="mb-4 text-3xl font-bold">Verify Warpcast with ZKPass</h1>
      <ConnectButton />
      <Button onClick={handleVerify} className="mt-4">
        Verify
      </Button>
      <Button onClick={test} className="mt-4">
        Test
      </Button>
    </main>
  );
}
