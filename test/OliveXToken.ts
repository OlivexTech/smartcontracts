import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

// ToDo:
// - 从 owner 转移 100万代币到 acc01
// - 增加一天
// - 查看总数
// - 从 acc01 转移 50万代币到 acc02
// - 增加一天
// - 查看总数

describe("OliveX-Token", function () {
    async function preLoadFixture() {
        const [owner, acc01, acc02] = await ethers.getSigners();
        const mainContract = await ethers.deployContract("OliveXToken");

        return { mainContract, owner, acc01, acc02 };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { mainContract, owner } = await loadFixture(preLoadFixture);

            expect(await mainContract.owner()).to.equal(owner.address);
        });

        it("Should owner get all token", async function () {
            const { mainContract, owner } = await loadFixture(preLoadFixture);

            expect(await mainContract.totalSupply()).to.equal(await mainContract.balanceOf(owner.address));
        });
    });

    // 可以使用 resetStopDate 这个功能更改停止日期
    // stopDate = 1689206400; // 13 July 2023 00:00:00
    describe("Transactions", function () {
        describe("whitelisted", function () {
            it("Should transfer to acc01", async function () {
                const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

                await mainContract.transfer(acc01.address, 10000000000);

                expect(await mainContract.balanceOf(owner.address)).to.equal("999999999999999990000000000");
            });

            it("Should balance on day 0: 999999999999999990000000000", async function () {
                const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

                await mainContract.transfer(acc01.address, 10000000000);

                expect(await mainContract.balanceOf(owner.address)).to.equal("999999999999999990000000000"); // day 0
            });

            it("Should balance on day 1: 999999999999999990000000000", async function () {
                const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

                await mainContract.transfer(acc01.address, 10000000000);
                await time.increaseTo((await time.latest()) + 86400);

                expect(await mainContract.balanceOf(owner.address)).to.equal("999999999999999990000000000"); // day 1
            });

            it("Should balance on day 2: 999999999999999990000000000", async function () {
                const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

                await mainContract.transfer(acc01.address, 10000000000);
                await time.increaseTo((await time.latest()) + 86400);
                await time.increaseTo((await time.latest()) + 86400);

                expect(await mainContract.balanceOf(owner.address)).to.equal("999999999999999990000000000"); // day 2
            });
        });

        describe("Acc01-Auto-Burn", function () {
            it("Should balance on day 0: 10000000000", async function () {
                const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

                await mainContract.transfer(acc01.address, 10000000000);

                expect(await mainContract.balanceOf(acc01.address)).to.equal(10000000000); // day 0
            });

            it("Should balance on day 1: 9900000000", async function () {
                const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

                await mainContract.transfer(acc01.address, 10000000000);
                await time.increaseTo((await time.latest()) + 86400);

                expect(await mainContract.balanceOf(acc01.address)).to.equal(9900000000); // day 1
            });

            // stop time: at 2033-01-01
            it("Should balance on day 2: 9801000000", async function () {
                const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

                await mainContract.transfer(acc01.address, 10000000000);
                await time.increaseTo((await time.latest()) + 86400);
                await time.increaseTo((await time.latest()) + 86400);
                // console.log(await mainContract.totalSupply());

                expect(await mainContract.balanceOf(acc01.address)).to.equal(9801000000); // day 2
            });

            // stop time: at 2023-07-13
            // it("Should balance on day 2: 9900000000", async function () {
            //     const { mainContract, owner, acc01 } = await loadFixture(preLoadFixture);

            //     await mainContract.transfer(acc01.address, 10000000000);
            //     await time.increaseTo((await time.latest()) + 86400);
            //     await time.increaseTo((await time.latest()) + 86400);

            //     expect(await mainContract.balanceOf(acc01.address)).to.equal(9900000000); // day 2
            // });
        });

        describe("Acc02-Auto-Burn", function () {
            it("Should balance on day 0: 1000000000", async function () {
                const { mainContract, owner, acc01, acc02 } = await loadFixture(preLoadFixture);

                await mainContract.connect(owner).transfer(acc01.address, 10000000000);
                await mainContract.connect(acc01).transfer(acc02.address, 1000000000);

                expect(await mainContract.balanceOf(acc02.address)).to.equal(1000000000); // day 0
            });

            it("Should balance on day 1: 990000000", async function () {
                const { mainContract, owner, acc01, acc02 } = await loadFixture(preLoadFixture);

                await mainContract.connect(owner).transfer(acc01.address, 10000000000);
                await mainContract.connect(acc01).transfer(acc02.address, 1000000000);
                await time.increaseTo((await time.latest()) + 86400);

                expect(await mainContract.balanceOf(acc02.address)).to.equal(990000000); // day 1
            });

            // stop time: at 2033-01-01
            it("Should balance on day 2: 980100000", async function () {
                const { mainContract, owner, acc01, acc02 } = await loadFixture(preLoadFixture);

                await mainContract.connect(owner).transfer(acc01.address, 10000000000);
                await mainContract.connect(acc01).transfer(acc02.address, 1000000000);
                // console.log(await mainContract.balanceOf(acc01.address));
                // console.log(await mainContract.balanceOf(acc02.address));
                // console.log(await mainContract.totalSupply());
                // console.log("--------");
                await time.increaseTo((await time.latest()) + 86400);
                // console.log(await mainContract.balanceOf(acc01.address));
                // console.log(await mainContract.balanceOf(acc02.address));
                // console.log(await mainContract.totalSupply());
                // console.log("--------");
                await time.increaseTo((await time.latest()) + 86400);
                // console.log(await mainContract.balanceOf(acc01.address));
                // console.log(await mainContract.balanceOf(acc02.address));
                // console.log(await mainContract.totalSupply());
                // console.log("--------");

                expect(await mainContract.balanceOf(acc02.address)).to.equal(980100000); // day 2
            });

            // stop time: at 2023-07-13
            // it("Should balance on day 2: 990000000", async function () {
            //     const { mainContract, owner, acc01, acc02 } = await loadFixture(preLoadFixture);

            //     await mainContract.connect(owner).transfer(acc01.address, 10000000000);
            //     await mainContract.connect(acc01).transfer(acc02.address, 1000000000);
            //     await time.increaseTo((await time.latest()) + 86400);
            //     await time.increaseTo((await time.latest()) + 86400);

            //     expect(await mainContract.balanceOf(acc02.address)).to.equal(990000000); // day 2
            // });
        });
    });
});
