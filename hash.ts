import bcrypt from "bcryptjs";

async function main() {
  console.log(await bcrypt.hash("Admin@123", 10));
}

main();