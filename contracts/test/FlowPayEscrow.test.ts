import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { FlowPayEscrow, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const ONE_DAY = 24 * 60 * 60;
const usdc = (n: number) => ethers.parseUnits(n.toString(), 6);

describe("FlowPayEscrow", function () {
  let escrow: FlowPayEscrow;
  let token: MockERC20;
  let arbitrator: SignerWithAddress, client: SignerWithAddress, freelancer: SignerWithAddress, stranger: SignerWithAddress;
  let deadline: number;
  const AMOUNT = usdc(1000);
  const DESC = "Landing page redesign";

  beforeEach(async function () {
    [arbitrator, client, freelancer, stranger] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("MockERC20")).deploy("USD Coin", "USDC", 6);
    await token.mint(client.address, usdc(10_000));
    escrow = await (await ethers.getContractFactory("FlowPayEscrow")).deploy(await token.getAddress(), arbitrator.address);
    deadline = (await time.latest()) + 7 * ONE_DAY;
    await token.connect(client).approve(await escrow.getAddress(), ethers.MaxUint256);
  });

  async function create() {
    await escrow.connect(client).createEscrow(freelancer.address, AMOUNT, deadline, DESC);
    return 1n;
  }

  describe("createEscrow", function () {
    it("блокирует USDC и индексирует сделку по участникам", async function () {
      await expect(escrow.connect(client).createEscrow(freelancer.address, AMOUNT, deadline, DESC))
        .to.emit(escrow, "EscrowCreated")
        .withArgs(1, client.address, freelancer.address, AMOUNT, deadline, DESC);
      expect(await token.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);
      expect(await escrow.getClientEscrowIds(client.address)).to.deep.equal([1n]);
      expect(await escrow.getFreelancerEscrowIds(freelancer.address)).to.deep.equal([1n]);
      const e = await escrow.getEscrow(1);
      expect(e.description).to.equal(DESC);
      expect(e.status).to.equal(0);
    });

    it("revert: некорректные параметры", async function () {
      const c = escrow.connect(client);
      await expect(c.createEscrow(ethers.ZeroAddress, AMOUNT, deadline, DESC)).to.be.revertedWithCustomError(escrow, "InvalidAddress");
      await expect(c.createEscrow(client.address, AMOUNT, deadline, DESC)).to.be.revertedWithCustomError(escrow, "InvalidAddress");
      await expect(c.createEscrow(freelancer.address, 0, deadline, DESC)).to.be.revertedWithCustomError(escrow, "InvalidAmount");
      await expect(c.createEscrow(freelancer.address, AMOUNT, (await time.latest()) - 1, DESC)).to.be.revertedWithCustomError(escrow, "InvalidDeadline");
      await expect(c.createEscrow(freelancer.address, AMOUNT, (await time.latest()) + 400 * ONE_DAY, DESC)).to.be.revertedWithCustomError(escrow, "InvalidDeadline");
      await expect(c.createEscrow(freelancer.address, AMOUNT, deadline, "")).to.be.revertedWithCustomError(escrow, "InvalidDescription");
      await expect(c.createEscrow(freelancer.address, AMOUNT, deadline, "x".repeat(281))).to.be.revertedWithCustomError(escrow, "InvalidDescription");
    });

    it("revert: арбитр не может быть стороной сделки", async function () {
      await expect(escrow.connect(client).createEscrow(arbitrator.address, AMOUNT, deadline, DESC)).to.be.revertedWithCustomError(escrow, "ArbitratorIsParty");
    });
  });

  describe("submitWork / releaseFunds / claimAfterReview", function () {
    beforeEach(create);

    it("заказчик подтверждает и платит", async function () {
      await escrow.connect(freelancer).submitWork(1);
      await expect(escrow.connect(client).releaseFunds(1)).to.emit(escrow, "FundsReleased").withArgs(1, freelancer.address, AMOUNT);
      expect(await token.balanceOf(freelancer.address)).to.equal(AMOUNT);
      await expect(escrow.connect(client).releaseFunds(1)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("только заказчик может release", async function () {
      await expect(escrow.connect(freelancer).releaseFunds(1)).to.be.revertedWithCustomError(escrow, "Unauthorized");
      await expect(escrow.connect(stranger).releaseFunds(1)).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("нельзя забрать деньги без сдачи работы (старая дыра claimAfterDeadline)", async function () {
      await time.increaseTo(deadline + 10 * ONE_DAY);
      await expect(escrow.connect(freelancer).claimAfterReview(1)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("фрилансер забирает оплату только после окна проверки", async function () {
      await escrow.connect(freelancer).submitWork(1);
      await expect(escrow.connect(freelancer).claimAfterReview(1)).to.be.revertedWithCustomError(escrow, "TooEarly");
      await time.increase(3 * ONE_DAY);
      await expect(escrow.connect(freelancer).claimAfterReview(1)).to.emit(escrow, "FundsClaimedAfterReview");
      expect(await token.balanceOf(freelancer.address)).to.equal(AMOUNT);
    });

    it("нельзя сдать работу после дедлайна", async function () {
      await time.increaseTo(deadline + 1);
      await expect(escrow.connect(freelancer).submitWork(1)).to.be.revertedWithCustomError(escrow, "TooLate");
    });
  });

  describe("возвраты", function () {
    beforeEach(create);

    it("заказчик возвращает деньги, если работа не сдана к дедлайну", async function () {
      await expect(escrow.connect(client).refundAfterDeadline(1)).to.be.revertedWithCustomError(escrow, "TooEarly");
      await time.increaseTo(deadline + 1);
      await expect(escrow.connect(client).refundAfterDeadline(1)).to.emit(escrow, "Refunded");
      expect(await token.balanceOf(client.address)).to.equal(usdc(10_000));
    });

    it("refundAfterDeadline недоступен, если работа сдана", async function () {
      await escrow.connect(freelancer).submitWork(1);
      await time.increaseTo(deadline + 1);
      await expect(escrow.connect(client).refundAfterDeadline(1)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("фрилансер может сам отменить сделку", async function () {
      await expect(escrow.connect(freelancer).refundByFreelancer(1)).to.emit(escrow, "Refunded");
      expect(await token.balanceOf(client.address)).to.equal(usdc(10_000));
    });
  });

  describe("споры", function () {
    beforeEach(async function () {
      await create();
      await escrow.connect(client).initiateDispute(1);
    });

    it("двойной спор невозможен", async function () {
      await expect(escrow.connect(freelancer).initiateDispute(1)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("арбитр делит сумму частично", async function () {
      await expect(escrow.connect(arbitrator).resolveDispute(1, usdc(300)))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1, usdc(700), usdc(300), false);
      expect(await token.balanceOf(freelancer.address)).to.equal(usdc(300));
      expect(await token.balanceOf(client.address)).to.equal(usdc(9_700));
    });

    it("revert: не арбитр / сплит больше суммы", async function () {
      await expect(escrow.connect(stranger).resolveDispute(1, 0)).to.be.revertedWithCustomError(escrow, "NotOwner");
      await expect(escrow.connect(arbitrator).resolveDispute(1, AMOUNT + 1n)).to.be.revertedWithCustomError(escrow, "InvalidSplit");
    });

    it("если арбитр молчит 30 дней, стороны делят 50/50", async function () {
      await expect(escrow.connect(client).resolveDisputeByTimeout(1)).to.be.revertedWithCustomError(escrow, "TooEarly");
      await time.increase(30 * ONE_DAY);
      await expect(escrow.connect(stranger).resolveDisputeByTimeout(1)).to.be.revertedWithCustomError(escrow, "Unauthorized");
      await escrow.connect(freelancer).resolveDisputeByTimeout(1);
      expect(await token.balanceOf(freelancer.address)).to.equal(usdc(500));
    });
  });

  describe("Ownable2Step", function () {
    it("новый арбитр должен принять права", async function () {
      await escrow.connect(arbitrator).transferOwnership(stranger.address);
      expect(await escrow.owner()).to.equal(arbitrator.address);
      await expect(escrow.connect(client).acceptOwnership()).to.be.revertedWithCustomError(escrow, "NotPendingOwner");
      await escrow.connect(stranger).acceptOwnership();
      expect(await escrow.owner()).to.equal(stranger.address);
    });
  });
});
