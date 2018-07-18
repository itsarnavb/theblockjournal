import createKeccakHash from 'keccak';

import Eth from '@/services/getWeb3';
import store from '@/store';
import v0 from '@/contracts/v0';

class BlockJournal {
  constructor() {
    this.rawContracts = {v0};
    this.contracts = {};
    for(let contractName in this.rawContracts) {
      let rawContract = this.rawContracts[contractName];
      this.contracts[contractName] = Eth.contract(rawContract.abi);
    }
  }
  async signFile(file) {
    let signature = `0x${createKeccakHash('keccak256').update(file.content).digest('hex')}`;
    let txHash = await this.addEntry(signature);
    let sign = {
      signature,
      txHash,
      time: Date.now(),
      fileID: file.id
    };
    store.commit('addSign', sign);
  }
  async addEntry(signature) {
    let contractInstance = await this.getContractInstance('v0');
    let txHash = await contractInstance.addEntry(signature, {from: store.state.app.accounts[0]});
    return txHash;
  }
  async getEntry(address, signature) {
    if(!address) address = store.state.app.accounts[0];
    let contractInstance = await this.getContractInstance('v0');
    return await contractInstance.getEntry(address, signature);
  }
  async getContractInstance(name) {
    let instanceAddress = this.rawContracts[name].deployments[store.state.app.networkID];
    return this.contracts[name].at(instanceAddress);
  }
}

export default new BlockJournal();