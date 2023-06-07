import '@nomicfoundation/hardhat-toolbox'
import fs from 'fs'
import { HardhatUserConfig } from 'hardhat/types'
import '@typechain/hardhat'
import 'hardhat-preprocessor'
import { node_url, accounts } from './utils/network'
import '@nomiclabs/hardhat-etherscan'
import * as dotenv from 'dotenv'
dotenv.config()

export const DEFAULT_PRIVATE_KEY =
  process.env.MNEMONIC ||
  '1000000000000000000000000000000000000000000000000000000000000000'
export const FILE_SUFFIX = process.env.PRODUCTION ? '' : 'staging.'

function getRemappings() {
  return fs
    .readFileSync('remappings.txt', 'utf8')
    .split('\n')
    .filter(Boolean) // remove empty lines
    .map((line) => line.trim().split('='))
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: accounts(process.env.HARDHAT_FORK),
      forking: process.env.HARDHAT_FORK
        ? {
            // TODO once PR merged : network: process.env.HARDHAT_FORK,
            url: node_url(process.env.HARDHAT_FORK),
            blockNumber: process.env.HARDHAT_FORK_NUMBER
              ? parseInt(process.env.HARDHAT_FORK_NUMBER)
              : undefined,
          }
        : undefined,
    },
    goerli: {
      url: node_url('goerli'),
    },
    ethereum: {
      url: `${process.env.ETH_NODE_URI_MAINNET}`,
      chainId: 1,
      accounts: [`0x${DEFAULT_PRIVATE_KEY}`],
    },
  },
  defaultNetwork: 'hardhat',
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  preprocess: {
    eachLine: (hre) => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          for (const [from, to] of getRemappings()) {
            if (line.includes(from)) {
              line = line.replace(from, to)
              break
            }
          }
        }
        return line
      },
    }),
  },
  paths: {
    sources: './src',
    cache: './cache_hardhat',
  },
}

export default config
