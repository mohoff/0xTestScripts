const MnemonicWalletSubprovider = require('@0xproject/subproviders').MnemonicWalletSubprovider
const RPCSubprovider = require('web3-provider-engine/subproviders/rpc')
const WebsocketSubprovider = require('web3-provider-engine/subproviders/websocket')
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
])

const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({ mnemonic: MNEMONIC})
//const injectedWeb3Subprovider = new InjectedWeb3Subprovider(window.web3.currentProvider) // browser
const localRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'http://localhost:8545'
})
const infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'https://' + networkNames.get(NETWORK_ID) + '.infura.io/' + INFURA_API_KEY
})
let websocketSubprovider = new WebsocketSubprovider({
    rpcUrl: 'wss://' + networkNames.get(NETWORK_ID) + '.infura.io/ws'
})



const providerEngine = new Web3ProviderEngine()
websocketSubprovider.on('data', (err, notification) => {
  providerEngine.emit('data', err, notification)
})

// Draft to reconnect to websocketProvider once connection is lost (onEnd called)
// websocketSubprovider.on('data', (err, notification) => {
//   providerEngine.emit('data', err, notification)
// })
// websocketSubprovider.on('error', err => {
//   console.log('websocketSubprovider on(error) triggered; ', err)
// })
// websocketSubprovider.on('end', (err, notification) => {
//     console.log('WS closed');
//     console.log('Attempting to reconnect...');
//     websocketSubprovider = new WebsocketSubprovider({
//       rpcUrl: 'wss://' + networkNames.get(NETWORK_ID) + '.infura.io/ws'
//     })
//     websocketSubprovider.on('connect', function () {
//       console.log('WSS Reconnected')
//     })
    
//     web3.setProvider(provider)
// })


//providerEngine.addProvider(mnemonicWalletSubprovider)
//providerEngine.addProvider(infuraRpcSubprovider)
providerEngine.addProvider(websocketSubprovider)
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


const zeroExSubscribe = async () => {
    await init()
    
    const eventName = 'LogFill' // LogCancel, LogError
    const tokenPair = web3.utils.sha3(
        '0xe41d2489571d322189246dafa5ebde1f4699f498', // ZRX contract address
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'  // WETH contract address
    )
    const indexFilterValues = {tokens: tokenPair}
    //const indexFilterValues = {maker: '0x4f3e7B7900e1352a43EA1a6aA8fc7F1FC03EfAc9'.toLowerCase()}

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
            } else {
                console.log(decodedLogEvent)
            }
        }
    )
}

const web3LogSubscribeExchange = async () => {
    var subscription = web3.eth.subscribe('logs', {
        fromBlock: null,
        address: '0x1d16ef40fac01cec8adac2ac49427b9384192c05'.toLowerCase(),
        topics: ['0x0d0b9391970d9a25552f37d436d2aae2925e2bfe1b2a923754bada030c498cb3']
    }, (error, result) => {
        if (error) {
            console.log('\nERROR')
            console.log(error)
        }
    })
    .on('data', (log) => {
        //console.log(log)
        const timestamp = Math.floor(Date.now() / 1000)
        const maker = getAddressFromChunk(log.topics[1])
        const feeRecipient = getAddressFromChunk(log.topics[2])
        const tradingPairHash = log.topics[3]

        dataChunks = getChunksFromData(log.data)

        const taker = dataChunks[0]
        const makerToken = dataChunks[1]
        const takerToken = dataChunks[2]
        const filledMakerTokenAmount = dataChunks[3]
        const filledTakerTokenAmount = dataChunks[4]
        const paidMakerFee = dataChunks[5]
        const paidTakerFee = dataChunks[6]

        console.log('timestamp: ' + timestamp)
        console.log('tradingPairHash: ' + tradingPairHash)
        console.log('maker: ' + getAddressFromChunk(maker))
        console.log('taker: ' + getAddressFromChunk(taker))
        console.log('feeRecipient: ' + getAddressFromChunk(feeRecipient))
        console.log('makerToken: ' + getAddressFromChunk(makerToken))
        console.log('takerToken: ' + getAddressFromChunk(takerToken))
        console.log('filledMakerTokenAmount: ' + getNumberFromChunk(filledMakerTokenAmount))
        console.log('filledTakerTokenAmount: ' + getNumberFromChunk(filledTakerTokenAmount))
        console.log('paidMakerFee: ' + getNumberFromChunk(paidMakerFee))
        console.log('paidTakerFee: ' + getNumberFromChunk(paidTakerFee))
    })
    .on('changed', (log) => {
        //console.log('\nCHANGED:')
        //console.log(log)
    })
}

const getChunksFromData = (data) => {
    const dataHex = data.substr(2)
    let dataChunks = []
    for (let i=0; i<dataHex.length; i+=64) {
        //console.log(i + ' ' + (i+64))
        dataChunks.push(dataHex.substr(i, 64))
    }
    return dataChunks
}

const getAddressFromChunk = (chunkHex) => {
    return '0x' + chunkHex.substring(chunkHex.length-40)
}

const getNumberFromChunk = (chunkHex, decimals=1e18) => {
    return (web3.utils.toBN(chunkHex)/decimals).toString()
}

const web3LogSubscribeToken = async () => {
    var subscription = web3.eth.subscribe('logs', {
        fromBlock: 5941042,
        address: '0xe41d2489571d322189246dafa5ebde1f4699f498', // ZRX contract address
        topics: [null]
    }, (error, result) => {
        if (error) {
            console.log('\nERROR')
            console.log(error)
        }
    })
    .on('data', (log) => {
        const timestamp = Math.floor(Date.now() / 1000)
        const from = '0x' + log.topics[1].substring(log.topics[1].length-40)
        const to = '0x' + log.topics[2].substring(log.topics[2].length-40)
        const amount = (web3.utils.toBN(log.data)/1e18).toString() //web3.utils.hexToNumberString(log.data)

        console.log(timestamp)
        console.log(from)
        console.log(to)
        console.log(amount)
        console.log('txHash: ' + log.transactionHash + '\n')
    })
    .on('changed', (log) => {
        console.log('\nCHANGED:')
        console.log(log)
    })
}

const web3NewHeadsSubscribe = async () => {
    var subscription = web3.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
        if (!error) {
            console.log('\nnewBlockHeaders SUCCESS')
            console.log(blockHeader)
        } else {
            console.log('\nnewBlockHeaders ERROR')
            console.log(error)
        }
    }).on('data', (blockHeader) => {
        //console.log('blockHeader: ', blockHeader)
    })
}

const run = async () => {
    //zeroExSubscribe()
    //web3LogSubscribeExchange()
    web3LogSubscribeToken()
    //web3NewHeadsSubscribe() // works
}


run().catch(console.error)