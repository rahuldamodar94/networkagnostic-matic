const express = require('express')
const app = express()
const cors = require('cors')
const _ = require('lodash')
const Web3 = require('web3')
const web3 = new Web3 ('https://rpc-mumbai.matic.today')

// set contract
const abi = require ('./abi.json').abi
const contract = new web3.eth.Contract(abi)

// set user
const pvtKey = process.env.PRIVATE_KEY
web3.eth.accounts.wallet.add(pvtKey)
const user = web3.eth.accounts.wallet[0].address

const getSignatureParameters = (signature) => {
  if (!web3.utils.isHexStrict(signature)) {
    throw new Error(
      'Given value "'.concat(signature, '" is not a valid hex string.')
    );
  }
  var r = signature.slice(0, 66);
  var s = "0x".concat(signature.slice(66, 130));
  var v = "0x".concat(signature.slice(130, 132));
  v = web3.utils.hexToNumber(v);
  if (![27, 28].includes(v)) v += 27;
  return {
    r: r,
    s: s,
    v: v,
  };
};

app.use(express.json({ extended: true }))
app.use(cors())
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.post (
  '/exec', 
  async function (req, res, next) {
  txDetails = _.pick(req.body, [
    'intent', 
    'fnSig',
    'from',
    'contractAddress'
  ])
  const { r, s, v } = getSignatureParameters(txDetails.intent)
  contract.options.address = txDetails.contractAddress
  let tx
  try {
    tx = await contract.methods.executeMetaTransaction(
      txDetails.from, txDetails.fnSig, r, s, v
    ).send ({
      from: user,
      gas: 800000
    })
    req.txHash = tx.transactionHash
  } catch (err) {
    console.log (err)
    // throw new Error ('tx broken')
    next(err)
  }
  next()
  },
  (req, res, next) => {
    // res.status(200).json({
    //   result: req.txHash
    // })
    res.send ({
      result: req.txHash
    })
  })


console.log ('listening on Port 3000.')
app.listen(3000)
