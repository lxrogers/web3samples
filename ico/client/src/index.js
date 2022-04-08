import { ethers } from "ethers"
import IcoJSON from '../../artifacts/contracts/SpaceCoinICO.sol/SpaceCoinICO.json';

window.ethereum.enable();
const provider = new ethers.providers.Web3Provider(window.ethereum)
const signer = provider.getSigner()

const icoAddr = '0xD76f1daF18149f585b5174Edf01b9B0E0354C2a2';
const icoContract = new ethers.Contract(icoAddr, IcoJSON.abi, provider);
const logger = new ethers.utils.Logger();

async function connectToMetamask() {
  try {
    console.log("Signed in as", await signer.getAddress())
  }
  catch(err) {
    console.log("Not signed in")
    await provider.send("eth_requestAccounts", [])
  }
}

ico_spc_buy.addEventListener('submit', async e => {
  e.preventDefault()
  const form = e.target
  const eth = ethers.utils.parseEther(form.eth.value)
  console.log("Buying", eth, "eth")

  await connectToMetamask();
  try {
    await icoContract.connect(signer).contribute({value: eth});
  }
  catch(err) {
    console.log("ERROR: ", err.error.data.originalError.message)
    document.getElementById("error").innerHTML = "error: " + err.error.data.originalError.message
  }
})

provider.on("block", async function(n) {
  
  console.log("new block");
  var signerAddress = signer.getAddress()
  document.getElementById('ico_spc_left').innerHTML = ethers.utils.formatEther(await icoContract.contributions(await signerAddress));
  document.getElementById('ico_spc_balance').innerHTML = ethers.utils.formatEther(await icoContract.balanceOf(await signerAddress));
  
  var phases = ["Seed", "General", "Open"]
  document.getElementById('ico_phase').innerHTML = phases[await icoContract.currentPhase()];
});


