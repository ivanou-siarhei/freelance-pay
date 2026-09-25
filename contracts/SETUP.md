# Папка contracts — установка и запуск

## Установка (один раз)

```bash
cd contracts
npm install
```

## Компиляция контрактов

```bash
npx hardhat compile
```

## Запуск тестов

```bash
npx hardhat test
```

## Запуск с отчётом по газу

```bash
REPORT_GAS=true npx hardhat test
```

---

## Структура папки contracts/

```
contracts/
├── FlowPayEscrow.sol          # основной контракт
├── MockERC20.sol              # мок-токен только для тестов
├── test/
│   └── FlowPayEscrow.test.ts  # тесты
├── hardhat.config.ts
├── package.json
└── tsconfig.json
```

---

## package.json

Создай файл `contracts/package.json` с таким содержимым:

```json
{
  "name": "flowpay-contracts",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy:local": "hardhat run scripts/deploy.ts --network localhost",
    "deploy:arc": "hardhat run scripts/deploy.ts --network arc_testnet"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.0",
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "hardhat": "^2.22.0",
    "typescript": "^5.4.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.0.0",
    "chai": "^4.4.0",
    "ethers": "^6.11.0"
  }
}
```

## hardhat.config.ts

Создай файл `contracts/hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    arc_testnet: {
      url: process.env.ARC_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
```

## tsconfig.json

Создай файл `contracts/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist"
  },
  "include": ["./test", "./scripts", "hardhat.config.ts"],
  "files": ["hardhat.config.ts"]
}
```

## .env (создай contracts/.env, не коммить в git!)

```
ARC_RPC_URL=https://rpc.testnet.arc.io   # получи из Discord Arc
PRIVATE_KEY=твой_приватный_ключ_кошелька
```
