const crypto = require("crypto");

// VAPID キーペアを生成する関数
function generateVAPIDKeys() {
  // P-256楕円曲線を使用してキーペアを生成
  const keyPair = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
    },
  });

  // キーをbase64urlエンコード
  const publicKey = keyPair.publicKey.subarray(-65); // 最後の65バイト（未圧縮点）
  const privateKey = keyPair.privateKey.subarray(-32); // 最後の32バイト（秘密鍵）

  const publicKeyBase64url = Buffer.from(publicKey)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const privateKeyBase64url = Buffer.from(privateKey)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return {
    publicKey: publicKeyBase64url,
    privateKey: privateKeyBase64url,
  };
}

// キーペアを生成して出力
const vapidKeys = generateVAPIDKeys();

console.log("=== VAPID Keys Generated ===");
console.log();
console.log("Public Key (for client-side):");
console.log(vapidKeys.publicKey);
console.log();
console.log("Private Key (for server-side):");
console.log(vapidKeys.privateKey);
console.log();
console.log("=== Environment Variables ===");
console.log();
console.log("For client (.env.local):");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log();
console.log("For server (.env):");
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(
  `SNS_TOPIC_ARN=arn:aws:sns:us-east-1:868865500828:postcard_collect_notifications`,
);
console.log("SNS_PLATFORM_APPLICATION_ARN=  # Set this if using Firebase/GCM");
console.log();

module.exports = { generateVAPIDKeys };
