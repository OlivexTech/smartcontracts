import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("OliveX-NFT", function () {
    async function preLoadFixture() {
        const [owner, acc01, acc02] = await ethers.getSigners();
        const mainContract = await ethers.deployContract("OliveXNode");

        return { mainContract, owner, acc01, acc02 };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { mainContract, owner } = await loadFixture(preLoadFixture);

            expect(await mainContract.owner()).to.equal(owner.address);
        });
    });

    describe("Minting", function () {
        it("Should mint a nft to holder", async function () {
            const { mainContract, acc01 } = await loadFixture(preLoadFixture);

            await mainContract.mintTo(acc01, "testABC");

            const content = await mainContract.tokenURI("0");

            // console.log(content);
            expect(await mainContract.balanceOf(acc01.address)).to.equal(1);
        });

        it("Should holder has lost nft", async function () {
            const { mainContract, acc01 } = await loadFixture(preLoadFixture);

            await mainContract.mintTo(acc01, "testABC");

            await mainContract.destroyNFT("0");

            expect(await mainContract.balanceOf(acc01.address)).to.equal(0);
        });
    });

    describe("Transfers", function () {
        it("Should disable transfer to the other", async function () {
            const { mainContract, acc01, acc02 } = await loadFixture(preLoadFixture);

            expect(mainContract.transferFrom(acc01, acc02, 0)).to.be.revertedWith("Transfer not allowed");
        });
    });
});
