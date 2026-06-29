const { execSync } = require("child_process");

const alias = "krishnajobs";
const keyPassword = "Krishna@123";
const storePassword = "Krishna@123";
const keystoreFile = "krishna-jobs-release.keystore";

const command = `
keytool -genkeypair \
-v \
-keystore ${keystoreFile} \
-alias ${alias} \
-keyalg RSA \
-keysize 2048 \
-validity 10000 \
-storepass ${storePassword} \
-keypass ${keyPassword} \
-dname "CN=Krishna Jobs, OU=Development, O=Krishna Jobs, L=Delhi, ST=Delhi, C=IN"
`;

try {
  execSync(command, { stdio: "inherit" });
  console.log("\n✅ Keystore generated successfully!");
} catch (err) {
  console.error("❌ Failed to generate keystore.");
}