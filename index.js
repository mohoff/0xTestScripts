const MnemonicWalletSubprovider = require('@0xproject/subproviders').MnemonicWalletSubprovider
const RPCSubprovider = require('web3-provider-engine/subproviders/rpc')
const Web3ProviderEngine = require('web3-provider-engine')
const Web3Wrapper = require('@0xproject/web3-wrapper').Web3Wrapper
const Web3 = require('web3')
const fs = require('fs')

const NETWORK_ID = 1
const INFURA_API_KEY = fs.readFileSync('./infura.txt', 'utf8')
const MNEMONIC = fs.readFileSync('./mnemonic.txt', 'utf8')

const networkNames = new Map([
    [ 1, 'mainnet' ],
    [ 3, 'ropsten' ],
    [ 4, 'rinkeby' ],
    [ 42, 'kovan' ]
]);


const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({ mnemonic: MNEMONIC})
//const injectedWeb3Subprovider = new InjectedWeb3Subprovider(window.web3.currentProvider) // browser
const localRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'http://localhost:8545'
})
const infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'https://' + networkNames.get(NETWORK_ID) + '.infura.io/' + INFURA_API_KEY
})


const providerEngine = new Web3ProviderEngine()
providerEngine.addProvider(mnemonicWalletSubprovider)
providerEngine.addProvider(infuraRpcSubprovider)
providerEngine.start();


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

const run = async () => {
    await init()
    
    const eventName = 'LogFill' // LogCancel, LogError
    const tokenPair = web3.utils.sha3(
        '0xe41d2489571d322189246dafa5ebde1f4699f498', // ZRX contract address
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'  // WETH contract address
    )
    const indexFilterValues = {tokens: tokenPair}

    console.log('Watching:')
    console.log('...eventName: ' + eventName)
    console.log('...indexFilterValues: ' + JSON.stringify(indexFilterValues))
    console.log('\nResults:\n')

    zeroEx.exchange.subscribe(
        eventName,
        indexFilterValues,
        async (err, decodedLogEvent) => {
            if (err) {
                console.log(err)
                return;
            } else {
                console.log(decodedLogEvent)
            }
        }
    )
}


run().catch(console.error)