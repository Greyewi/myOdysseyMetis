import * as TronWeb from "tronweb";
import { readFile } from "fs/promises";

const abiAndBytecode = JSON.parse(await readFile('./artifacts/contracts/goal.sol/CryptoGoals.json', 'utf8'));
const { abi, bytecode } = abiAndBytecode;

// Настройки Tron
const tronWeb = new TronWeb.TronWeb({
  fullHost: "https://api.shasta.trongrid.io",
  privateKey: "5c3a34303909959e170b5d2039d3916688f1cf160474ba12a30e9ba05ad287f3",
});

async function deploy() {
  try {
    // Создаём экземпляр контракта
    const contractInstance = await tronWeb.contract().new({
      abi,
      bytecode,
      feeLimit: 193_000_000_0, // 2000 TRX
      callValue: 0,
    });

  } catch (err) {
    console.error("Ошибка при деплое:", err);
  }
}

deploy();
