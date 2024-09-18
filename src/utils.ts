import TransgateConnect from "@zkpass/transgate-js-sdk";
import {
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  recoverAddress,
  stringToHex,
  type Address,
  type Hash,
} from "viem";

const appId = import.meta.env.VITE_ZK_PASS_APP_ID;
const schemaId = import.meta.env.VITE_ZK_PASS_SCHEMA_ID;

export const TRANSGATE_INSTALL_LINK =
  "https://chromewebstore.google.com/detail/zkpass-transgate/afkoofjocpbclhnldmmaphappihehpma";

/**
   * res = {
    "taskId": "6703ec47861c430689f8470fe7ce015f",
    "publicFields": [],
    "allocatorAddress": "0x19a567b3b212a5b35bA0E3B600FbEd5c2eE9083d",
    "publicFieldsHash": "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6",
    "allocatorSignature": "0x410795b1c7a9c644204dc6b211be0c641fb1be14e4886b7e67d5b52f16b552bf1a88b4780c5d22a002dc515c10c2a09a7167376a37e7ab76c866250cbf3f92441c",
    "uHash": "0x5b32b66ceb9f251ac34a651eddd479d1a67bfd5a2d903f2192b2c95ad9729077",
    "validatorAddress": "0xb1C4C1E1Cdd5Cf69E27A3A08C8f51145c2E12C6a",
    "validatorSignature": "0x8effd72fad5f1418b310378e1cac0c56fa8989c6944c87b73829d67469c124e324ab092ed294cc548e7d08655e9d0d239a061dc3e305c5c7ecab24e26df1fadc1b"
}
   */

export const startGeneration = async (address: Address) => {
  console.log({ appId, schemaId });
  try {
    const connector = new TransgateConnect(appId);

    const isAvailable = await connector.isTransgateAvailable();

    if (isAvailable) {
      // Launch the process of verification
      const res = (await connector.launch(schemaId, address)) as any;

      console.log({ res });

      // verifiy the res onchain/offchain based on the requirement
      const isVerified = await verify({
        taskId: res.taskId,
        publicFieldsHash: res.publicFieldsHash,
        allocatorAddress: res.allocatorAddress,
        allocatorSignature: res.allocatorSignature,
        uHash: res.uHash,
        validatorAddress: res.validatorAddress,
        validatorSignature: res.validatorSignature,
        recipient: address,
      });
      console.log("here", isVerified);

      return { isVerified, isTransgateAvailable: true };
    } else {
      console.error("Please install TransGate");
      return { isVerified: false, isTransgateAvailable: false };
    }
  } catch (error) {
    console.error("transgate error", error);
    return { isVerified: false, isTransgateAvailable: false };
  }
};

export const verify = async ({
  taskId,
  publicFieldsHash,
  allocatorAddress,
  allocatorSignature,
  uHash,
  validatorAddress,
  validatorSignature,
  recipient,
}: {
  taskId: string;
  publicFieldsHash: Hash;
  allocatorAddress: Address;
  allocatorSignature: Hash;
  uHash: Address;
  validatorAddress: Address;
  validatorSignature: Hash;
  recipient: Address;
}) => {
  // verify allocator signature
  const isAllocatorSignatureValid = await verifyAllocatorSignature(
    taskId,
    validatorAddress,
    allocatorSignature,
    allocatorAddress
  );

  // verify validator signature
  const isValidatorSignatureValid = await verifyValidatorSignature(
    taskId,
    uHash,
    publicFieldsHash,
    recipient,
    validatorSignature,
    validatorAddress
  );

  console.log({ isAllocatorSignatureValid, isValidatorSignatureValid });

  return isAllocatorSignatureValid && isValidatorSignatureValid;
};

export const verifyAllocatorSignature = async (
  taskId: string,
  validatorAddress: Address,
  allocatorSignature: Hash,
  allocatorAddress: Address
) => {
  const taskIdHex = stringToHex(taskId);
  const schemaIdHex = stringToHex(schemaId);

  const encodeParams = encodeAbiParameters(
    parseAbiParameters(["bytes32", "bytes32", "address"]),
    [taskIdHex, schemaIdHex, validatorAddress]
  );
  const paramsHash = keccak256(encodeParams);

  const signedAllocatorAddress = await recoverAddress({
    hash: paramsHash,
    signature: allocatorSignature,
  });
  // Fixed allocator address
  return signedAllocatorAddress === allocatorAddress;
};

export const verifyValidatorSignature = async (
  taskId: string,
  uHash: Address,
  publicFieldsHash: Address,
  recipient: Address,
  validatorSignature: Hash,
  validatorAddress: Address
) => {
  const taskIdHex = stringToHex(taskId);
  const schemaIdHex = stringToHex(schemaId);

  let paramHash: `0x${string}`;
  if (recipient) {
    const types = [
      "bytes32",
      "bytes32",
      "bytes32",
      "bytes32",
      "address",
    ] as const;
    const values = [
      taskIdHex,
      schemaIdHex,
      uHash,
      publicFieldsHash,
      recipient,
    ] as const;
    const encodeParams = encodeAbiParameters(parseAbiParameters(types), values);
    paramHash = keccak256(encodeParams);
  } else {
    const types = ["bytes32", "bytes32", "bytes32", "bytes32"] as const;
    const values = [taskIdHex, schemaIdHex, uHash, publicFieldsHash] as const;
    const encodeParams = encodeAbiParameters(parseAbiParameters(types), values);
    paramHash = keccak256(encodeParams);
  }
  const signedValidatorAddress = await recoverAddress({
    hash: paramHash,
    signature: validatorSignature,
  });

  return signedValidatorAddress === validatorAddress;
};
