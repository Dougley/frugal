/**
 * Verifies Discord webhook signatures using Ed25519
 * Based on Discord's security documentation
 */

export async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string,
  publicKey: string
): Promise<boolean> {
  try {
    // Check timestamp to prevent replay attacks (within 5 minutes)
    const timestampMs = parseInt(timestamp) * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - timestampMs) > fiveMinutes) {
      console.warn("Discord webhook timestamp too old");
      return false;
    }

    // Convert hex public key to Uint8Array
    const publicKeyBytes = hexToBytes(publicKey);

    // Convert hex signature to Uint8Array
    const signatureBytes = hexToBytes(signature);

    // Create the message that was signed (timestamp + body)
    const message = timestamp + body;
    const messageBytes = new TextEncoder().encode(message);

    // Import the public key for verification
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      },
      false,
      ["verify"]
    );

    // Verify the signature
    const isValid = await crypto.subtle.verify(
      "Ed25519",
      cryptoKey,
      signatureBytes,
      messageBytes
    );

    return isValid;
  } catch (error) {
    console.error("Error verifying Discord signature:", error);
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  // Remove any '0x' prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}
