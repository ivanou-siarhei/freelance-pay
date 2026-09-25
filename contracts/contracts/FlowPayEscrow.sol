// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Standard ERC-20 interface required to interact with USDC or other stablecoins.
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @dev Helper to secure token transactions against broken or malicious ERC-20 tokens.
 */
library SafeERC20 {
    error SafeTransferFailed();
    error SafeTransferFromFailed();

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        bool success = token.transfer(to, value);
        if (!success) revert SafeTransferFailed();
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        bool success = token.transferFrom(from, to, value);
        if (!success) revert SafeTransferFromFailed();
    }
}

/**
 * @dev Simple Ownable standard tailored directly for the arbitrator/owner mechanisms.
 */
abstract contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert("Ownable: initial owner cannot be zero address");
        }
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
    }

    /**
     * @dev FIX: сохраняем oldOwner до перезаписи, чтобы событие эмитило правильный previousOwner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert("Ownable: new owner cannot be zero address");
        }
        address oldOwner = _owner; // сохраняем до изменения
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner); // теперь previousOwner корректен
    }
}

/**
 * @dev Защита от reentrancy-атак.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @title FlowPayEscrow
 * @author FlowPay Core Team
 * @notice Децентрализованный смарт-контракт для безопасных B2B-сделок с обеспечением (Escrow) в сетях EVM.
 * Позволяет удерживать депозиты в стейблкоинах (например, USDC) до выполнения условий фрилансером.
 *
 * @dev Исправления по сравнению с предыдущей версией:
 *   1. Баг в transferOwnership: previousOwner теперь сохраняется до перезаписи _owner.
 *   2. Диспут можно открыть в любой момент (убрано ограничение по дедлайну).
 *   3. Добавлен ReentrancyGuard на все функции с переводом средств.
 *   4. Убран неиспользуемый статус Initialized из enum EscrowStatus.
 *   5. Добавлена функция claimAfterDeadline — фрилансер может забрать средства
 *      если клиент молчит после истечения дедлайна.
 */
contract FlowPayEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Взаиморасчеты ведутся в конкретном типе токенов (например, USDC)
    IERC20 public immutable token;

    // Порядковый счетчик уникальных идентификаторов сделок
    uint256 public escrowIdCounter;

    /**
     * @dev FIX: убран неиспользуемый статус Initialized.
     * Все сделки начинаются сразу с FundsLocked при создании.
     */
    enum EscrowStatus {
        FundsLocked, // Средства клиента заблокированы в смарт-контракте
        Completed,   // Сделка завершена, деньги успешно выплачены исполнителю
        Disputed,    // Начата процедура арбитража/спора между сторонами
        Refunded     // Сделка отменена, средства возвращены клиенту
    }

    // Структурированные данные escrow-сделки
    struct Escrow {
        uint256 id;             // Уникальный ID сделки
        address client;         // Заказчик (клиент), который блокирует средства
        address freelancer;     // Исполнитель (фрилансер), выполняющий работу
        uint256 amount;         // Сумма депозита в USDC/ERC20
        uint256 deadline;       // Крайний срок сдачи (Unix timestamp)
        EscrowStatus status;    // Текущий статус договора
    }

    // Маппинг для хранения всех сделок: ID => Escrow
    mapping(uint256 => Escrow) public escrows;

    // Ошибки работы с контрактом (газоэффективные кастомные ошибки)
    error InvalidAddress();
    error InvalidAmount();
    error InvalidDeadline();
    error EscrowNotFound();
    error Unauthorized();
    error InvalidStatus();
    error DeadlineNotMet();

    // Системные события для мониторинга и индексации
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        uint256 deadline
    );
    event FundsReleased(uint256 indexed escrowId, address indexed freelancer, uint256 amount);
    event FundsClaimedAfterDeadline(uint256 indexed escrowId, address indexed freelancer, uint256 amount);
    event DisputeInitiated(uint256 indexed escrowId, address indexed initiatedBy);
    event DisputeResolved(uint256 indexed escrowId, address indexed recipient, uint256 amountRefunded, uint256 amountPaidToFreelancer);

    /**
     * @param _tokenAddress Контракт токена ERC-20 (например, USDC), используемый для удержания средств.
     * @param _arbitrator Арбитр (владелец контракта), разрешающий спорные ситуации.
     */
    constructor(address _tokenAddress, address _arbitrator) Ownable(_arbitrator) {
        if (_tokenAddress == address(0)) revert InvalidAddress();
        token = IERC20(_tokenAddress);
    }

    /**
     * @notice Создание сделки и автоматическая блокировка целевых средств клиента на балансе контракта.
     * @param _freelancer Кошелек исполнителя/фрилансера.
     * @param _amount Депозит в токенах (требуется предварительный approve со стороны клиента).
     * @param _deadline Временной диапазон окончания сдачи работы (Unix timestamp).
     * @return Возвращает сгенерированный ID сделки.
     */
    function createEscrow(
        address _freelancer,
        uint256 _amount,
        uint256 _deadline
    ) external nonReentrant returns (uint256) {
        if (_freelancer == address(0)) revert InvalidAddress();
        if (_freelancer == msg.sender) revert InvalidAddress(); // клиент и фрилансер не могут совпадать
        if (_amount == 0) revert InvalidAmount();
        if (_deadline <= block.timestamp) revert InvalidDeadline();

        uint256 newEscrowId = ++escrowIdCounter;

        escrows[newEscrowId] = Escrow({
            id: newEscrowId,
            client: msg.sender,
            freelancer: _freelancer,
            amount: _amount,
            deadline: _deadline,
            status: EscrowStatus.FundsLocked
        });

        // Забираем стейблкоины у клиента на баланс смарт-контракта
        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit EscrowCreated(newEscrowId, msg.sender, _freelancer, _amount, _deadline);

        return newEscrowId;
    }

    /**
     * @notice Успешное закрытие сделки клиентом и выплата всей заблокированной суммы в пользу исполнителя.
     * @param _escrowId ID закрываемого эскроу.
     */
    function releaseFunds(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        if (escrow.id == 0) revert EscrowNotFound();
        if (msg.sender != escrow.client) revert Unauthorized();
        if (escrow.status != EscrowStatus.FundsLocked) revert InvalidStatus();

        escrow.status = EscrowStatus.Completed;

        // Переводим заблокированные средства фрилансеру
        token.safeTransfer(escrow.freelancer, escrow.amount);

        emit FundsReleased(_escrowId, escrow.freelancer, escrow.amount);
    }

    /**
     * @notice FIX: новая функция. Фрилансер может забрать средства самостоятельно
     * если клиент не подтверждает и не открывает диспут после истечения дедлайна.
     * Это защищает исполнителя от заморозки средств при молчании клиента.
     * @param _escrowId ID эскроу.
     */
    function claimAfterDeadline(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        if (escrow.id == 0) revert EscrowNotFound();
        if (msg.sender != escrow.freelancer) revert Unauthorized();
        if (escrow.status != EscrowStatus.FundsLocked) revert InvalidStatus();
        if (block.timestamp < escrow.deadline) revert DeadlineNotMet();

        escrow.status = EscrowStatus.Completed;

        token.safeTransfer(escrow.freelancer, escrow.amount);

        emit FundsClaimedAfterDeadline(_escrowId, escrow.freelancer, escrow.amount);
    }

    /**
     * @notice Инициация спорной ситуации (Dispute).
     * @dev FIX: убрано ограничение по дедлайну — диспут можно открыть в любой момент
     * пока статус FundsLocked. Это позволяет клиенту защититься если фрилансер
     * исчез или нарушил условия до истечения срока.
     * @param _escrowId ID спорного эскроу.
     */
    function initiateDispute(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        if (escrow.id == 0) revert EscrowNotFound();

        // Только участники сделки могут начать диспут
        if (msg.sender != escrow.client && msg.sender != escrow.freelancer) revert Unauthorized();
        if (escrow.status != EscrowStatus.FundsLocked) revert InvalidStatus();

        escrow.status = EscrowStatus.Disputed;

        emit DisputeInitiated(_escrowId, msg.sender);
    }

    /**
     * @notice Решение спора официальным арбитром (владельцем контракта).
     * Средства могут быть либо полностью возвращены клиенту, либо начислены фрилансеру.
     * @param _escrowId ID разрешаемой сделки.
     * @param _refundToClient Флаг решения: true — вернуть клиенту (Refund), false — выплатить фрилансеру.
     */
    function resolveDispute(uint256 _escrowId, bool _refundToClient) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        if (escrow.id == 0) revert EscrowNotFound();
        if (escrow.status != EscrowStatus.Disputed) revert InvalidStatus();

        uint256 payoutAmount = escrow.amount;

        if (_refundToClient) {
            escrow.status = EscrowStatus.Refunded;
            token.safeTransfer(escrow.client, payoutAmount);
            emit DisputeResolved(_escrowId, escrow.client, payoutAmount, 0);
        } else {
            escrow.status = EscrowStatus.Completed;
            token.safeTransfer(escrow.freelancer, payoutAmount);
            emit DisputeResolved(_escrowId, escrow.freelancer, 0, payoutAmount);
        }
    }
}
