import { ed25519 } from "@noble/curves/ed25519";

export interface TestKeypair {
  publicKey: string;
  privateKey: string;
}

// fixed keypair for deterministic tests
// testing signing and verifying is outside the scope of our tests, so we can rely on a known keypair
export const TEST_KEYPAIR: TestKeypair = {
  privateKey:
    "38371760850084cc59635056bc07d807a500339504622f34fcba5a313c4058e4",
  publicKey: "d6b67e871b26b2e414f1e50d3929c2c68981ce2ae92887458a986da03b2fd2cf",
};

export function generateTestKeypair(): TestKeypair {
  const privateKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return {
    publicKey: Buffer.from(publicKey).toString("hex"),
    privateKey: Buffer.from(privateKey).toString("hex"),
  };
}

export function signDiscordRequest(
  keypair: TestKeypair,
  body: string,
  timestamp?: string
): { signature: string; timestamp: string } {
  const ts = timestamp ?? new Date().toISOString();
  const message = Buffer.from(ts + body);
  const sig = ed25519.sign(message, keypair.privateKey);
  return {
    signature: Buffer.from(sig).toString("hex"),
    timestamp: ts,
  };
}

export function createSignedDiscordRequest(
  keypair: TestKeypair,
  body: string,
  url = "http://localhost/"
): Request {
  const { signature, timestamp } = signDiscordRequest(keypair, body);
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature-ed25519": signature,
      "x-signature-timestamp": timestamp,
    },
    body,
  });
}
