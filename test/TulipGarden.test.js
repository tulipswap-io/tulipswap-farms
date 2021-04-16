const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("TulipGarden", function () {
  before(async function () {
    this.TulipToken = await ethers.getContractFactory("TulipToken")
    this.TulipGarden = await ethers.getContractFactory("TulipGarden")

    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
  })

  beforeEach(async function () {
    this.tulip = await this.TulipToken.deploy()
    this.garden = await this.TulipGarden.deploy(this.tulip.address)
    this.tulip.mint(this.alice.address, "100")
    this.tulip.mint(this.bob.address, "100")
    this.tulip.mint(this.carol.address, "100")
  })

  it("should not allow enter if not enough approve", async function () {
    await expect(this.garden.enter("100")).to.be.revertedWith("ERC20: transfer amount exceeds allowance")
    await this.tulip.approve(this.garden.address, "50")
    await expect(this.garden.enter("100")).to.be.revertedWith("ERC20: transfer amount exceeds allowance")
    await this.tulip.approve(this.garden.address, "100")
    await this.garden.enter("100")
    expect(await this.garden.balanceOf(this.alice.address)).to.equal("100")
  })

  it("should not allow withraw more than what you have", async function () {
    await this.tulip.approve(this.garden.address, "100")
    await this.garden.enter("100")
    await expect(this.garden.leave("200")).to.be.revertedWith("ERC20: burn amount exceeds balance")
  })

  it("should work with more than one participant", async function () {
    await this.tulip.approve(this.garden.address, "100")
    await this.tulip.connect(this.bob).approve(this.garden.address, "100", { from: this.bob.address })
    // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
    await this.garden.enter("20")
    await this.garden.connect(this.bob).enter("10", { from: this.bob.address })
    expect(await this.garden.balanceOf(this.alice.address)).to.equal("20")
    expect(await this.garden.balanceOf(this.bob.address)).to.equal("10")
    expect(await this.tulip.balanceOf(this.garden.address)).to.equal("30")
    // TulipGarden get 20 more TULIPs from an external source.
    await this.tulip.connect(this.carol).transfer(this.garden.address, "20", { from: this.carol.address })
    // Alice deposits 10 more TULIPs. She should receive 10*30/50 = 6 shares.
    await this.garden.enter("10")
    expect(await this.garden.balanceOf(this.alice.address)).to.equal("26")
    expect(await this.garden.balanceOf(this.bob.address)).to.equal("10")
    // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
    await this.garden.connect(this.bob).leave("5", { from: this.bob.address })
    expect(await this.garden.balanceOf(this.alice.address)).to.equal("26")
    expect(await this.garden.balanceOf(this.bob.address)).to.equal("5")
    expect(await this.tulip.balanceOf(this.garden.address)).to.equal("52")
    expect(await this.tulip.balanceOf(this.alice.address)).to.equal("70")
    expect(await this.tulip.balanceOf(this.bob.address)).to.equal("98")
  })
})
