const MnemonicWalletSubprovider = require('@0xproject/subproviders').MnemonicWalletSubprovider
const RPCSubprovider = require('web3-provider-engine/subproviders/rpc')
const WebsocketSubprovider = require('web3-provider-engine/subproviders/websocket')
const Web3ProviderEngine = require('web3-provider-engine')
const Web3Wrapper = require('@0xproject/web3-wrapper').Web3Wrapper
const Web3 = require('web3')
const fs = require('fs')

const ethUtil = require('ethereumjs-util')

const NETWORK_ID = 1
const INFURA_API_KEY = fs.readFileSync('./infura.txt', 'utf8')
const MNEMONIC = fs.readFileSync('./mnemonic.txt', 'utf8')

const networkNames = new Map([
    [ 1, 'mainnet' ],
    [ 3, 'ropsten' ],
    [ 4, 'rinkeby' ],
    [ 42, 'kovan' ]
])

const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({ mnemonic: MNEMONIC})
//const injectedWeb3Subprovider = new InjectedWeb3Subprovider(window.web3.currentProvider) // browser
const infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'https://' + networkNames.get(NETWORK_ID) + '.infura.io/' + INFURA_API_KEY
})



const providerEngine = new Web3ProviderEngine()
providerEngine.addProvider(mnemonicWalletSubprovider)
providerEngine.addProvider(infuraRpcSubprovider)
providerEngine.start()

const web3Wrapper = new Web3Wrapper(providerEngine)
const web3 = new Web3(providerEngine)

const ZeroEx = require('0x.js')
const zeroEx = new ZeroEx.ZeroEx(providerEngine, { networkId: NETWORK_ID })


const init = async () => {
    console.log('Running with Mnemonic path: ' + mnemonicWalletSubprovider.getPath())
    const accounts = await mnemonicWalletSubprovider.getAccountsAsync(3)
    console.log('Accounts:')
    for (account of accounts) {
        console.log('       ' + account)
    }
    console.log('-------------------------------------------------------')
}

const WETH = 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const ZRX = 'e41d2489571d322189246dafa5ebde1f4699f498'

const hash = async (input1, input2) => {
    await init()

    const sha3 = web3.utils.sha3(input1 + input2)
    const soliditySha3 = web3.utils.soliditySha3(input1 + input2)
    const ethUtilSha3 = ethUtil.sha3(input1 + input2)
    
    // This works! Same as when you do in solidity: `keccak256(address,address)`
    const ethUtilSha3Buffer = ethUtil.sha3(
        Buffer.concat([
            Buffer.from(input1, 'hex'),
            Buffer.from(input2, 'hex')
        ])
    )

    console.log('\nInput1: ' + input1)
    console.log('Input2: ' + input2)
    console.log('Way of hasing: "<input1><input2>"\n')
    console.log('web3.util.sha3:\t\t\t\t' + sha3)
    console.log('web3.util.soliditySha3:\t\t\t' + soliditySha3)
    console.log('ethUtil.sha3:\t\t\t\t' + '0x' + ethUtilSha3.toString('hex'))
    console.log('ethUtil.sha3(Buffer.concat(...)):\t' + '0x' + ethUtilSha3Buffer.toString('hex'))
}

const run = async () => {
    hash(
        ZRX, WETH
    )
}


run().catch(console.error)
