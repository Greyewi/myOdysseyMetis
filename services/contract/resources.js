import * as TronWeb from "tronweb";
import { readFile } from 'fs/promises';

const tronWeb = new TronWeb.TronWeb({
  fullHost: "https://api.trongrid.io",
  privateKey: "5c3a34303909959e170b5d2039d3916688f1cf160474ba12a30e9ba05ad287f3",
});

const abiAndBytecode = JSON.parse(await readFile('./artifacts/contracts/goal.sol/CryptoGoals.json', 'utf8'));
const { abi, bytecode } = abiAndBytecode;

const resources = await tronWeb.trx.getAccountResources('TWZxXWevYLvJ2NV5gU5KTQBTYduz5vUZeF');


async function estimateDeploymentEnergy() {
  try {
    const deployerAddress = tronWeb.defaultAddress.hex;

    const estimatedEnergy = await tronWeb.transactionBuilder.estimateEnergy(
      null, // Нет адреса контракта, так как мы деплоим
      null, // Нет вызова функции, так как мы деплоим
      {
        feeLimit: 200_000_000, // 200 TRX
        callValue: 0,
      },
      [], // Нет параметров
      deployerAddress
    );

    console.log(`Оценочная энергия для деплоя: ${estimatedEnergy.energy_required}`);
  } catch (error) {
    console.error("Ошибка оценки энергии:", error);
  }
}

estimateDeploymentEnergy();