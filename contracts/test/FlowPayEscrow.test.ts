import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { FlowPayEscrow, MockERC20 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

// ─────────────────────────────────────────────
//  Вспомогательные константы
// ─────────────────────────────────────────────
const USDC_DECIMALS = 6;
const ONE_DAY = 24 * 60 * 60;
const SEVEN_DAYS = 7 * ONE_DAY;

function usdc(amount: number): bigint {
  return ethers.parseUnits(amount.toString(), USDC_DECIMALS);
}

// ─────────────────────────────────────────────
//  Тесты
// ─────────────────────────────────────────────
describe("FlowPayEscrow", function () {
  let escrow: FlowPayEscrow;
  let token: MockERC20;

  let arbitrator: SignerWithAddress;
  let client: SignerWithAddress;
  let freelancer: SignerWithAddress;
  let stranger: SignerWithAddress;

  let deadline: number;

  // ── Деплой перед каждым тестом ──────────────
  beforeEach(async function () {
    [arbitrator, client, freelancer, stranger] = await ethers.getSigners();

    // Деплоим MockERC20 (имитация USDC)
    const TokenFactory = await ethers.getContractFactory("MockERC20");
    token = await TokenFactory.deploy("USD Coin", "USDC", USDC_DECIMALS);

    // Минтим клиенту 10 000 USDC
    await token.mint(client.address, usdc(10_000));

    // Деплоим FlowPayEscrow
    const EscrowFactory = await ethers.getContractFactory("FlowPayEscrow");
    escrow = await EscrowFactory.deploy(
      await token.getAddress(),
      arbitrator.address
    );

    // Дедлайн = текущее время + 7 дней
    const now = await time.latest();
    deadline = now + SEVEN_DAYS;

    // Клиент даёт approve контракту на 1 000 USDC
    await token.connect(client).approve(await escrow.getAddress(), usdc(1_000));
  });

  // ════════════════════════════════════════════
  //  1. createEscrow — создание сделки
  // ════════════════════════════════════════════
  describe("createEscrow", function () {
    it("создаёт эскроу и блокирует USDC на контракте", async function () {
      await expect(
        escrow.connect(client).createEscrow(freelancer.address, usdc(500), deadline)
      ).to.emit(escrow, "EscrowCreated");

      const deal = await escrow.escrows(1);
      expect(deal.client).to.equal(client.address);
      expect(deal.freelancer).to.equal(freelancer.address);
      expect(deal.amount).to.equal(usdc(500));
      expect(deal.status).to.equal(0); // FundsLocked

      // Средства должны быть на контракте
      const contractBalance = await token.balanceOf(await escrow.getAddress());
      expect(contractBalance).to.equal(usdc(500));
    });

    it("возвращает правильный ID сделки", async function () {
      const tx = await escrow
        .connect(client)
        .createEscrow(freelancer.address, usdc(100), deadline);
      const receipt = await tx.wait();
      // ID должен быть 1 (первая сделка)
      const deal = await escrow.escrows(1);
      expect(deal.id).to.equal(1n);
    });

    it("revert: нулевой адрес фрилансера", async function () {
      await expect(
        escrow.connect(client).createEscrow(ethers.ZeroAddress, usdc(100), deadline)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("revert: клиент и фрилансер — один адрес", async function () {
      await expect(
        escrow.connect(client).createEscrow(client.address, usdc(100), deadline)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("revert: сумма равна нулю", async function () {
      await expect(
        escrow.connect(client).createEscrow(freelancer.address, 0n, deadline)
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("revert: дедлайн в прошлом", async function () {
      const pastDeadline = (await time.latest()) - ONE_DAY;
      await expect(
        escrow.connect(client).createEscrow(freelancer.address, usdc(100), pastDeadline)
      ).to.be.revertedWithCustomError(escrow, "InvalidDeadline");
    });
  });

  // ════════════════════════════════════════════
  //  2. releaseFunds — клиент подтверждает выплату
  // ════════════════════════════════════════════
  describe("releaseFunds", function () {
    beforeEach(async function () {
      await escrow
        .connect(client)
        .createEscrow(freelancer.address, usdc(500), deadline);
    });

    it("выплачивает всю сумму фрилансеру", async function () {
      const balanceBefore = await token.balanceOf(freelancer.address);

      await expect(escrow.connect(client).releaseFunds(1))
        .to.emit(escrow, "FundsReleased")
        .withArgs(1n, freelancer.address, usdc(500));

      const balanceAfter = await token.balanceOf(freelancer.address);
      expect(balanceAfter - balanceBefore).to.equal(usdc(500));

      const deal = await escrow.escrows(1);
      expect(deal.status).to.equal(1); // Completed
    });

    it("revert: не клиент пытается подтвердить", async function () {
      await expect(
        escrow.connect(freelancer).releaseFunds(1)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("revert: посторонний адрес пытается подтвердить", async function () {
      await expect(
        escrow.connect(stranger).releaseFunds(1)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("revert: двойная выплата невозможна", async function () {
      await escrow.connect(client).releaseFunds(1);
      await expect(
        escrow.connect(client).releaseFunds(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("revert: несуществующая сделка", async function () {
      await expect(
        escrow.connect(client).releaseFunds(999)
      ).to.be.revertedWithCustomError(escrow, "EscrowNotFound");
    });
  });

  // ════════════════════════════════════════════
  //  3. claimAfterDeadline — фрилансер забирает
  //     средства если клиент молчит после дедлайна
  // ════════════════════════════════════════════
  describe("claimAfterDeadline", function () {
    beforeEach(async function () {
      await escrow
        .connect(client)
        .createEscrow(freelancer.address, usdc(500), deadline);
    });

    it("фрилансер забирает средства после истечения дедлайна", async function () {
      // Перематываем время вперёд за дедлайн
      await time.increaseTo(deadline + 1);

      const balanceBefore = await token.balanceOf(freelancer.address);

      await expect(escrow.connect(freelancer).claimAfterDeadline(1))
        .to.emit(escrow, "FundsClaimedAfterDeadline")
        .withArgs(1n, freelancer.address, usdc(500));

      const balanceAfter = await token.balanceOf(freelancer.address);
      expect(balanceAfter - balanceBefore).to.equal(usdc(500));

      const deal = await escrow.escrows(1);
      expect(deal.status).to.equal(1); // Completed
    });

    it("revert: дедлайн ещё не наступил", async function () {
      await expect(
        escrow.connect(freelancer).claimAfterDeadline(1)
      ).to.be.revertedWithCustomError(escrow, "DeadlineNotMet");
    });

    it("revert: не фрилансер пытается забрать", async function () {
      await time.increaseTo(deadline + 1);
      await expect(
        escrow.connect(client).claimAfterDeadline(1)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("revert: средства уже выплачены через releaseFunds", async function () {
      await escrow.connect(client).releaseFunds(1);
      await time.increaseTo(deadline + 1);
      await expect(
        escrow.connect(freelancer).claimAfterDeadline(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ════════════════════════════════════════════
  //  4. initiateDispute — открытие спора
  // ════════════════════════════════════════════
  describe("initiateDispute", function () {
    beforeEach(async function () {
      await escrow
        .connect(client)
        .createEscrow(freelancer.address, usdc(500), deadline);
    });

    it("клиент может открыть диспут в любой момент", async function () {
      await expect(escrow.connect(client).initiateDispute(1))
        .to.emit(escrow, "DisputeInitiated")
        .withArgs(1n, client.address);

      const deal = await escrow.escrows(1);
      expect(deal.status).to.equal(2); // Disputed
    });

    it("фрилансер может открыть диспут в любой момент", async function () {
      await expect(escrow.connect(freelancer).initiateDispute(1))
        .to.emit(escrow, "DisputeInitiated")
        .withArgs(1n, freelancer.address);
    });

    it("диспут открывается до наступления дедлайна (важная проверка)", async function () {
      // Дедлайн ещё не прошёл — диспут должен открыться без ошибок
      const now = await time.latest();
      expect(now).to.be.lessThan(deadline);

      await expect(
        escrow.connect(client).initiateDispute(1)
      ).to.not.be.reverted;
    });

    it("revert: посторонний не может открыть диспут", async function () {
      await expect(
        escrow.connect(stranger).initiateDispute(1)
      ).to.be.revertedWithCustomError(escrow, "Unauthorized");
    });

    it("revert: двойной диспут невозможен", async function () {
      await escrow.connect(client).initiateDispute(1);
      await expect(
        escrow.connect(client).initiateDispute(1)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ════════════════════════════════════════════
  //  5. resolveDispute — арбитр решает спор
  // ════════════════════════════════════════════
  describe("resolveDispute", function () {
    beforeEach(async function () {
      await escrow
        .connect(client)
        .createEscrow(freelancer.address, usdc(500), deadline);
      await escrow.connect(client).initiateDispute(1);
    });

    it("арбитр возвращает средства клиенту", async function () {
      const balanceBefore = await token.balanceOf(client.address);

      await expect(escrow.connect(arbitrator).resolveDispute(1, true))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1n, client.address, usdc(500), 0n);

      const balanceAfter = await token.balanceOf(client.address);
      expect(balanceAfter - balanceBefore).to.equal(usdc(500));

      const deal = await escrow.escrows(1);
      expect(deal.status).to.equal(3); // Refunded
    });

    it("арбитр выплачивает средства фрилансеру", async function () {
      const balanceBefore = await token.balanceOf(freelancer.address);

      await expect(escrow.connect(arbitrator).resolveDispute(1, false))
        .to.emit(escrow, "DisputeResolved")
        .withArgs(1n, freelancer.address, 0n, usdc(500));

      const balanceAfter = await token.balanceOf(freelancer.address);
      expect(balanceAfter - balanceBefore).to.equal(usdc(500));

      const deal = await escrow.escrows(1);
      expect(deal.status).to.equal(1); // Completed
    });

    it("revert: не арбитр пытается решить спор", async function () {
      await expect(
        escrow.connect(client).resolveDispute(1, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("revert: нет активного диспута", async function () {
      // Создаём вторую сделку без диспута
      await token.connect(client).approve(await escrow.getAddress(), usdc(100));
      await escrow
        .connect(client)
        .createEscrow(freelancer.address, usdc(100), deadline);

      await expect(
        escrow.connect(arbitrator).resolveDispute(2, true)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("revert: двойное решение невозможно", async function () {
      await escrow.connect(arbitrator).resolveDispute(1, true);
      await expect(
        escrow.connect(arbitrator).resolveDispute(1, true)
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  // ════════════════════════════════════════════
  //  6. transferOwnership — смена арбитра
  // ════════════════════════════════════════════
  describe("transferOwnership", function () {
    it("арбитр может передать права новому адресу", async function () {
      await expect(
        escrow.connect(arbitrator).transferOwnership(stranger.address)
      )
        .to.emit(escrow, "OwnershipTransferred")
        .withArgs(arbitrator.address, stranger.address); // FIX: оба адреса корректны

      expect(await escrow.owner()).to.equal(stranger.address);
    });

    it("revert: передача нулевому адресу", async function () {
      await expect(
        escrow.connect(arbitrator).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Ownable: new owner cannot be zero address");
    });

    it("revert: не владелец пытается передать права", async function () {
      await expect(
        escrow.connect(client).transferOwnership(stranger.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
