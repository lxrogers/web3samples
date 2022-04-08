import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
const BigNumber = ethers.BigNumber;
import {Crowdfunder, Crowdfunder__factory, Project, Project__factory} from "../typechain";

describe("Crowdfunder", function () {
  let crowdfunder: Crowdfunder
  let deployer: SignerWithAddress
  let projectOwner: SignerWithAddress
  let bob: SignerWithAddress
  let alice: SignerWithAddress
  let addrs: SignerWithAddress[]
  let ProjectFactory: Project__factory

  this.beforeEach(async function() {
    [deployer, projectOwner, bob, alice, ...addrs] = await ethers.getSigners();
    const CrowdfunderFactory = await ethers.getContractFactory("Crowdfunder");
    crowdfunder = (await CrowdfunderFactory.deploy()) as Crowdfunder;
    await crowdfunder.deployed();

    ProjectFactory = (await ethers.getContractFactory("Project")) as Project__factory;
  })

  it("can create a new project", async function () {
    await crowdfunder.createProject("My First Project", ethers.utils.parseEther("1.0"));
    
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    expect( await project1.projectName()).to.equal("My First Project", "wrong name");
    expect( await project1.name()).to.equal("My First Project Badge", "wrong name");
    expect( await project1.goal()).to.equal(ethers.utils.parseEther("1.0"), "wrong goal");
  });

  it("allows a donor to donate to the project and receive an NFT", async function() {
    await crowdfunder.createProject("My First Project", ethers.utils.parseEther("2.0"));
    
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await expect(project1.connect(bob).donate({value:ethers.utils.parseEther("0.001")}))
      .to.be.revertedWith("Donation less than 0.01 ether");
    
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});
    expect(await project1.balanceOf(bob.address)).to.equal(0);
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});
    expect(await project1.balanceOf(bob.address)).to.equal(1);
    await project1.connect(bob).donate({value:ethers.utils.parseEther("1")});
    expect(await project1.balanceOf(bob.address)).to.equal(1);
    await expect(project1.connect(bob).donate({value:ethers.utils.parseEther("1")}))
      .to.be.revertedWith("not active");
  });

  it("allows badgeNFTs to be traded", async function() {
    await crowdfunder.createProject("My First Project", ethers.utils.parseEther("2.0"));
    
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    
    await project1.connect(bob).donate({value:ethers.utils.parseEther("2.0")});
    expect(await project1.balanceOf(bob.address)).to.equal(1);
    expect(await project1.ownerOf(0)).to.equal(bob.address);
    expect(await project1.balanceOf(alice.address)).to.equal(0);
    await project1.connect(bob).transferFrom(bob.address, alice.address, 0);
    expect(await project1.balanceOf(bob.address)).to.equal(0);
    expect(await project1.ownerOf(0)).to.equal(alice.address);
    expect(await project1.balanceOf(alice.address)).to.equal(1);
  });

  it("can be cancelled by sender", async function() {
    await crowdfunder.connect(projectOwner).createProject("My First Project", ethers.utils.parseEther("2.0"));
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});
    await expect(project1.connect(bob).cancel()).to.be.revertedWith("not creator");
    await project1.connect(projectOwner).cancel();
    expect(await project1.cancelled()).to.equal(true);
    //can't donate
    await expect(project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")}))
      .to.be.revertedWith("not active");

  })

  it("can't be cancelled if fully funded", async function() {
    await crowdfunder.connect(projectOwner).createProject("My First Project", ethers.utils.parseEther("2.0"));
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await project1.connect(bob).donate({value:ethers.utils.parseEther("5")});
    await expect(project1.connect(projectOwner).cancel()).to.be.revertedWith("not active");
  });

  it("prevents donor withdrawals while project is live or funded", async function() {
    await crowdfunder.createProject("My First Project", ethers.utils.parseEther("2.0"));
    
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});
    await expect(project1.connect(bob).withdrawDonation()).to.be.revertedWith("not failed or cancelled");

  })

  it("allows the creator to withdraw funds IFF the project was funded", async function() {
    await crowdfunder.connect(projectOwner).createProject("My First Project", ethers.utils.parseEther("2.0"));
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});
    await expect(project1.connect(projectOwner).withdrawFunds(ethers.utils.parseEther("0.4")))
      .to.be.revertedWith("not funded");
    
    await project1.connect(bob).donate({value:ethers.utils.parseEther("1.5")});

    const ownerBeforeAmount = await ethers.provider.getBalance(projectOwner.address);
    await project1.connect(projectOwner).withdrawFunds(ethers.utils.parseEther("0.5"));
    const ownerAfterAmount = await ethers.provider.getBalance(projectOwner.address);
    expect(ownerAfterAmount.sub(ownerBeforeAmount)).to.be.below(ethers.utils.parseEther("0.5"));
    expect(ownerAfterAmount.sub(ownerBeforeAmount)).to.be.above(ethers.utils.parseEther("0.499"));
  })

  it("allows donors to withdraw from failed project", async function() {
    await crowdfunder.connect(projectOwner).createProject("My First Project", ethers.utils.parseEther("2.0"));
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});
    await ethers.provider.send("evm_increaseTime", [30*24*60*60]);

    const donorBeforeAmount = await ethers.provider.getBalance(bob.address);
    await project1.connect(bob).withdrawDonation();
    const donorAfterAmount = await ethers.provider.getBalance(bob.address);
    expect(donorAfterAmount.sub(donorBeforeAmount)).to.be.below(ethers.utils.parseEther("0.5"));
    expect(donorAfterAmount.sub(donorBeforeAmount)).to.be.above(ethers.utils.parseEther("0.499"));
  });

  it("allows donors to withdraw from cancelled project", async function() {
    await crowdfunder.connect(projectOwner).createProject("My First Project", ethers.utils.parseEther("2.0"));
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});
    await project1.connect(projectOwner).cancel();

    const donorBeforeAmount = await ethers.provider.getBalance(bob.address);
    await project1.connect(bob).withdrawDonation();
    const donorAfterAmount = await ethers.provider.getBalance(bob.address);
    expect(donorAfterAmount.sub(donorBeforeAmount)).to.be.below(ethers.utils.parseEther("0.5"));
    expect(donorAfterAmount.sub(donorBeforeAmount)).to.be.above(ethers.utils.parseEther("0.499"));
  });

  it("doesn't allow creator to withdraw, or new donations, or cancellations if the project fails", async function() {
    await crowdfunder.connect(projectOwner).createProject("My First Project", ethers.utils.parseEther("2.0"));
    let project1: Project = ProjectFactory.attach(await crowdfunder.projects(0));
    await project1.connect(bob).donate({value:ethers.utils.parseEther("0.5")});

    await ethers.provider.send("evm_increaseTime", [30*24*60*60]);
    await expect(project1.connect(projectOwner).cancel()).to.be.revertedWith("not active");
    await expect(project1.connect(bob).donate({value:ethers.utils.parseEther("1")}))
      .to.be.revertedWith("not active");
    await expect(project1.connect(projectOwner).withdrawFunds(ethers.utils.parseEther("0.4")))
      .to.be.revertedWith("not funded");
  })

});
