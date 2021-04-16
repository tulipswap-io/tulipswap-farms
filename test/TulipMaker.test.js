const { ethers } = require("hardhat")
const { prepare, deploy, getBigNumber, createSLP } = require("./utilities")
const { expect } = require("chai")

describe("TulipMaker", function () {
  before(async function () {
    await prepare(this, ["TulipMaker", "TulipGarden", "TulipMakerExploitMock", "ERC20Mock", "TulipFactoryMock", "TulipPairMock"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["tulip", this.ERC20Mock, ["TULIP", "TULIP", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.TulipFactoryMock, [this.alice.address]],
    ])
    await deploy(this, [["garden", this.TulipGarden, [this.tulip.address]]])
    await deploy(this, [["tulipMaker", this.TulipMaker, [this.factory.address, this.garden.address, this.tulip.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.TulipMakerExploitMock, [this.tulipMaker.address]]])
    await createSLP(this, "tulipEth", this.tulip, this.weth, getBigNumber(10))
    await createSLP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createSLP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createSLP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createSLP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createSLP(this, "tulipUSDC", this.tulip, this.usdc, getBigNumber(10))
    await createSLP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createSLP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Tulip", async function () {
      await expect(this.tulipMaker.setBridge(this.tulip.address, this.weth.address)).to.be.revertedWith("TulipMaker: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.tulipMaker.setBridge(this.weth.address, this.tulip.address)).to.be.revertedWith("TulipMaker: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.tulipMaker.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("TulipMaker: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.tulipMaker.setBridge(this.dai.address, this.tulip.address))
        .to.emit(this.tulipMaker, "LogBridgeSet")
        .withArgs(this.dai.address, this.tulip.address)
    })
  })
  describe("convert", function () {
    it("should convert TULIP - ETH", async function () {
      await this.tulipEth.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.convert(this.tulip.address, this.weth.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulipEth.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.convert(this.usdc.address, this.weth.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.convert(this.strudel.address, this.weth.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - TULIP", async function () {
      await this.tulipUSDC.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.convert(this.usdc.address, this.tulip.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulipUSDC.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.convert(this.dai.address, this.weth.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.setBridge(this.usdc.address, this.tulip.address)
      await this.tulipMaker.setBridge(this.mic.address, this.usdc.address)
      await this.tulipMaker.convert(this.mic.address, this.usdc.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.setBridge(this.usdc.address, this.tulip.address)
      await this.tulipMaker.setBridge(this.dai.address, this.usdc.address)
      await this.tulipMaker.convert(this.dai.address, this.usdc.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.setBridge(this.dai.address, this.usdc.address)
      await this.tulipMaker.setBridge(this.mic.address, this.dai.address)
      await this.tulipMaker.convert(this.dai.address, this.mic.address)
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.setBridge(this.dai.address, this.mic.address)
      await this.tulipMaker.setBridge(this.mic.address, this.dai.address)
      await expect(this.tulipMaker.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.tulipEth.transfer(this.tulipMaker.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.tulip.address, this.weth.address)).to.be.revertedWith("TulipMaker: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.tulipMaker.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("TulipMaker: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.tulipMaker.address, getBigNumber(1))
      await expect(this.tulipMaker.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("TulipMaker: Cannot convert")
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.tulipMaker.address)).to.equal(getBigNumber(1))
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipEth.transfer(this.tulipMaker.address, getBigNumber(1))
      await this.tulipMaker.convertMultiple([this.dai.address, this.tulip.address], [this.weth.address, this.weth.address])
      expect(await this.tulip.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.tulipMaker.address)).to.equal(0)
      expect(await this.tulip.balanceOf(this.garden.address)).to.equal("3186583558687783097")
    })
  })
})
