'use strict';
const fs = require('fs');
const HDWalletProvider = require('truffle-hdwallet-provider');

const Timelock = require('./build/contracts/Timelock.json');
const Multicall = require('./build/contracts/Multicall.json');
const MasterGardener = require('./build/contracts/MasterGardener.json');
const TulipGarden = require('./build/contracts/TulipGarden.json');
const TulipMaker = require('./build/contracts/TulipMaker.json');
const TulipToken = require('./build/contracts/TulipToken.json');

function get_data(_message) {
  return new Promise(function(resolve, reject) {
      fs.readFile('./installation_data.json', (err, data) => {
          if (err) throw err;
          resolve(data);
      });
  });
}

function write_data(_message) {
  return new Promise(function(resolve, reject) {
      fs.writeFile('./installation_data.json', _message, (err) => {
          if (err) throw err;
          console.log('Data written to file');
          resolve();
      });
  });
}

var privateKeys = [];
var URL = "";


(async () => {
  // Read in the configuration information
  var data = await get_data();
  var data_object = JSON.parse(data);
  // Add keys
  console.log("Adding Alice key ...");
  privateKeys.push(data_object.private_key.alice);
  // RPC
  URL = data_object.provider.rpc_endpoint;

  // Web3 - keys and accounts
  const Web3 = require("web3");
  const provider = new HDWalletProvider(privateKeys, URL, 0, 1);
  const web3 = new Web3(provider);
  await web3.eth.net.isListening();
  console.log('Web3 is connected.');
  console.log("Private keys: " + privateKeys);
  let accounts = await web3.eth.getAccounts();
  console.log(`accounts: ${JSON.stringify(accounts)}`);

  console.log("Starting MultiCall Deployment");
  let multiCall;
  multiCall = await new web3.eth.Contract(Multicall.abi)
                        .deploy({
                          data: Multicall.bytecode, 
                          arguments: []})
                        .send({
                          from: accounts[0]
                        })
  console.log(`\Multicall contract deployed at ${multiCall.options.address}`);
  console.log(`Please store this multiCall address for future use ^^^`);
  data_object.contract_address.multi_call = multiCall.options.address;

  console.log("Starting Time Lock Deployment");
  // Timelock Contract Deployment
  let timeLock;
  timeLock = await new web3.eth.Contract(Timelock.abi)
                        .deploy({
                          data: Timelock.bytecode, 
                          arguments: [accounts[0], 216000]})
                        .send({
                          from: accounts[0]
                        })
  console.log(`\Timelock contract deployed at ${timeLock.options.address}`);
  console.log(`Please store this timelock address for future use ^^^`);
  data_object.contract_address.time_lock = timeLock.options.address;

  console.log("Starting Tulip Token");
  // // TulipToken Contract Deployment
  let tulipToken;
  tulipToken = await new web3.eth.Contract(TulipToken.abi)
                        .deploy({
                          data: TulipToken.bytecode, 
                          arguments: []})
                        .send({
                          from: accounts[0]
                        })
  console.log(`\TulipToken contract deployed at ${tulipToken.options.address}`);
  console.log(`Please store this tuliptoken address for future use ^^^`);
  data_object.contract_address.tulip_token = tulipToken.options.address;

  console.log("Starting Master Gardener");
  let masterGardener;
  masterGardener = await new web3.eth.Contract(MasterGardener.abi)
                          .deploy({
                            data: MasterGardener.bytecode, 
                            arguments: [data_object.contract_address.tulip_token,
                                        accounts[0],
                                        accounts[0],
                                        1,
                                        18393
                                      ]})
                          .send({
                            from: accounts[0]
                          })
  console.log(`\MasterGardener contract deployed at ${masterGardener.options.address}`);
  console.log(`Please store this Master Gardener address for future use ^^^`);
  data_object.contract_address.master_gardener = masterGardener.options.address;

  console.log("Transfering Ownership");
  tulipToken = await new web3.eth.Contract(TulipToken.abi, data_object.contract_address.tulip_token);
  await tulipToken.methods.transferOwnership(
                    data_object.contract_address.master_gardener
                  ).send({from: accounts[0]});

  console.log("Deploying Tulip Garden");

  let tulipGarden;
  tulipGarden = await new web3.eth.Contract(TulipGarden.abi)
                          .deploy({
                            data: TulipGarden.bytecode, 
                            arguments: [data_object.contract_address.tulip_token]})
                          .send({
                            from: accounts[0]
                          })
  console.log(`\TulipGarden contract deployed at ${tulipGarden.options.address}`);
  console.log(`Please store this tulip garden address for future use ^^^`);
  data_object.contract_address.tulip_garden = tulipGarden.options.address;

  console.log("Deploying Tulip Maker");
  let tulipMaker;
  tulipMaker = await new web3.eth.Contract(TulipMaker.abi)
                          .deploy({
                            data: TulipMaker.bytecode, 
                            arguments: [
                              data_object.contract_address.tulip_factory,
                              data_object.contract_address.tulip_garden,
                              data_object.contract_address.tulip_token,
                              data_object.contract_address.woeth]})
                          .send({
                            from: accounts[0]
                          })
  console.log(`\TulipMaker contract deployed at ${tulipMaker.options.address}`);
  console.log(`Please store this tulip maker address for future use ^^^`);
  data_object.contract_address.tulip_maker = tulipMaker.options.address;


  let data_to_write = JSON.stringify(data_object, null, 2);
  await write_data(data_to_write);


  await provider.engine.stop();
})();
