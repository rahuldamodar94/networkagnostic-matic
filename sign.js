const Web3 = require("web3");
const { getTypedData } = require("./meta-tx")
const request = require('request')
const maticProvider = "https://rpc-mumbai.matic.today";

const tokenAddresses = {
  "80001": "0xf2F04cD6D26CB030A476f1A29B7dCb4a5b601487"
}

let mumbai = new Web3('https://rpc-mumbai.matic.today/'), eth, accounts, chain

async function fillMaticDetails () {
  let _data = await mumbai.eth.abi.encodeFunctionCall({
    name: 'balanceOf',
    type: 'function',
    inputs: [{
        type: 'address',
        name: 'address'
    }]
  }, [accounts[0]]);

  let balanceMumbai = await mumbai.eth.call ({
    to: tokenAddresses["80001"],
    data: _data
  });

  document.getElementById("mum-token").innerHTML = tokenAddresses["80001"]
  document.getElementById("mum-balance").innerHTML = parseInt(balanceMumbai)
}

window.addEventListener('load', async () => {
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!')
    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    document.getElementById("account").innerHTML = accounts[0]
    chainArea = document.getElementById("chain")
    chain = await window.ethereum.chainId
    chain = parseInt(chain)
    chainArea.innerHTML = chain
    
    eth = window.ethereum
    await fillMaticDetails ()
  }
})


async function executeMetaTx(functionSig) {
  let data = await mumbai.eth.abi.encodeFunctionCall({
    name: 'getNonce', 
    type: 'function', 
    inputs: [{
        "name": "user",
        "type": "address"
      }]
  }, [accounts[0]])
  let _nonce = await mumbai.eth.call ({
    to: tokenAddresses["80001"],
    data
  });
  const dataToSign = getTypedData({
    name: 'Demo',
    version: '1',
    salt: '0x0000000000000000000000000000000000000000000000000000000000013881',
    verifyingContract: tokenAddresses["80001"],
    nonce: parseInt(_nonce),
    from: accounts[0],
    functionSignature: functionSig
  })
  const msgParams = [accounts[0], JSON.stringify(dataToSign)]
  let sign = await eth.request ({
    method: 'eth_signTypedData_v3', 
    params: msgParams
  })
  const { r, s, v } = getSignatureParameters(sign)
  return {
    sig: sign,
    r,
    s, 
    v, 
  }
}
const amt = "10"
document.getElementById('approveBtn').onclick = async () => {
  let data = await mumbai.eth.abi.encodeFunctionCall({
    name: 'transfer', 
    type: 'function', 
    inputs: [
      {
        "name": "recipient",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ]
  }, ["0xFd71Dc9721d9ddCF0480A582927c3dCd42f3064C", "100000000000000000"])

  let { sig, r, s, v } = await executeMetaTx (data)
  document.getElementById('approve-tx').innerHTML = 

  `sig:`+sig + `<br />` + `<br />`
  +`function sig:`+data

  let tx = {
    intent: sig, 
    fnSig: data, 
    from: accounts[0], 
    contractAddress: tokenAddresses["80001"]
  }

  await executeAndDisplay (
    tx, 
    'result-approve'
  )

}

document.getElementById('withdrawBtn').onclick = async () => {
  let data = await mumbai.eth.abi.encodeFunctionCall({
    name: 'withdraw', 
    type: 'function', 
    inputs: [{
        "name": "amount",
        "type": "uint256"
    }]
  }, [amt])

  let { sig, r, s, v } = await executeMetaTx (data)
  document.getElementById('withdraw-tx').innerHTML = 

  `sig:`+sig + `<br />` + `<br />`
  +`function sig:`+data

  let tx = {
    intent: sig, 
    fnSig: data, 
    from: accounts[0], 
    contractAddress: tokenAddresses["80001"]
  }

  await executeAndDisplay (
    tx, 
    'result-withdraw'
  )
}

async function executeAndDisplay(txObj, el) {
  const response = await request.post(
    'http://localhost:3000/exec', {
      json: txObj,
    },
    (error, res, body) => {
      if (error) {
        console.error(error)
        return
      }
      document.getElementById(el).innerHTML = 
      `response:`+ JSON.stringify(body)
    }
  )
}

const getSignatureParameters = (signature) => {
  if (!mumbai.utils.isHexStrict(signature)) {
    throw new Error(
      'Given value "'.concat(signature, '" is not a valid hex string.')
    );
  }
  var r = signature.slice(0, 66);
  var s = "0x".concat(signature.slice(66, 130));
  var v = "0x".concat(signature.slice(130, 132));
  v = mumbai.utils.hexToNumber(v);
  if (![27, 28].includes(v)) v += 27;
  return {
    r: r,
    s: s,
    v: v,
  };
};
