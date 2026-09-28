// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @dev Безопасные переводы: поддерживают токены, которые не возвращают bool
 * (USDT-подобные), и токены, которые возвращают false вместо revert.
 */
library SafeERC20 {
    error SafeERC20Failed(address token);

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _call(token, abi.encodeCall(IERC20.transfer, (to, value)));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _call(token, abi.encodeCall(IERC20.transferFrom, (from, to, value)));
    }

    function _call(IERC20 token, bytes memory data) private {
        (bool ok, bytes memory ret) = address(token).call(data);
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool))) || address(token).code.length == 0) {
            revert SafeERC20Failed(address(token));
        }
    }
}

/**
 * @dev Двухшаговая передача владения: новый владелец должен сам вызвать acceptOwnership,
 * чтобы нельзя было случайно передать права арбитра на опечатанный адрес.
 */
abstract contract Ownable2Step {
    address private _owner;
    address private _pendingOwner;

    error NotOwner();
    error NotPendingOwner();
    error ZeroOwner();

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroOwner();
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        if (msg.sender != _owner) revert NotOwner();
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function pendingOwner() public view returns (address) {
        return _pendingOwner;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroOwner();
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(_owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != _pendingOwner) revert NotPendingOwner();
        address old = _owner;
        _owner = msg.sender;
        _pendingOwner = address(0);
        emit OwnershipTransferred(old, msg.sender);
    }
}

abstract contract ReentrancyGuard {
    uint256 private _status = 1;
    error Reentrancy();

    modifier nonReentrant() {
        if (_status == 2) revert Reentrancy();
        _status = 2;
        _;
        _status = 1;
    }
}

/**
 * @title FlowPayEscrow
 * @notice Эскроу для фриланс-сделок в USDC на Arc.
 *
 * Жизненный цикл:
 *   createEscrow (заказчик) -> FundsLocked
 *   submitWork (фрилансер, до дедлайна) -> WorkSubmitted
 *   releaseFunds (заказчик) -> Completed
 *   claimAfterReview (фрилансер, если заказчик молчит REVIEW_PERIOD после сдачи) -> Completed
 *   refundAfterDeadline (заказчик, если работа не сдана к дедлайну) -> Refunded
 *   refundByFreelancer (фрилансер сам отказывается от сделки) -> Refunded
 *   initiateDispute (любая сторона) -> Disputed
 *   resolveDispute (арбитр, произвольный сплит) -> Resolved
 *   resolveDisputeByTimeout (любая сторона, если арбитр молчит DISPUTE_TIMEOUT) -> Resolved 50/50
 */
contract FlowPayEscrow is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant REVIEW_PERIOD = 3 days;
    uint256 public constant DISPUTE_TIMEOUT = 30 days;
    uint256 public constant MAX_DURATION = 365 days;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 280;

    IERC20 public immutable token;
    uint256 public escrowIdCounter;

    enum EscrowStatus {
        FundsLocked,
        WorkSubmitted,
        Completed,
        Disputed,
        Refunded,
        Resolved
    }

    struct Escrow {
        uint256 id;
        address client;
        address freelancer;
        uint256 amount;
        uint64 createdAt;
        uint64 deadline;
        uint64 submittedAt;
        uint64 disputedAt;
        EscrowStatus status;
        string description;
    }

    mapping(uint256 => Escrow) private _escrows;
    mapping(address => uint256[]) private _clientEscrows;
    mapping(address => uint256[]) private _freelancerEscrows;

    error InvalidAddress();
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidDescription();
    error EscrowNotFound();
    error Unauthorized();
    error InvalidStatus();
    error TooEarly();
    error TooLate();
    error InvalidSplit();
    error ArbitratorIsParty();

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed freelancer,
        uint256 amount,
        uint256 deadline,
        string description
    );
    event WorkSubmitted(uint256 indexed escrowId, address indexed freelancer);
    event FundsReleased(uint256 indexed escrowId, address indexed freelancer, uint256 amount);
    event FundsClaimedAfterReview(uint256 indexed escrowId, address indexed freelancer, uint256 amount);
    event Refunded(uint256 indexed escrowId, address indexed client, uint256 amount, address indexed initiatedBy);
    event DisputeInitiated(uint256 indexed escrowId, address indexed initiatedBy);
    event DisputeResolved(uint256 indexed escrowId, uint256 toClient, uint256 toFreelancer, bool byTimeout);

    constructor(address _tokenAddress, address _arbitrator) Ownable2Step(_arbitrator) {
        if (_tokenAddress == address(0) || _tokenAddress.code.length == 0) revert InvalidAddress();
        token = IERC20(_tokenAddress);
    }

    // ───────────── views ─────────────

    function getEscrow(uint256 id) external view returns (Escrow memory) {
        Escrow memory e = _escrows[id];
        if (e.id == 0) revert EscrowNotFound();
        return e;
    }

    function getClientEscrowIds(address client) external view returns (uint256[] memory) {
        return _clientEscrows[client];
    }

    function getFreelancerEscrowIds(address freelancer) external view returns (uint256[] memory) {
        return _freelancerEscrows[freelancer];
    }

    // ───────────── заказчик ─────────────

    function createEscrow(
        address _freelancer,
        uint256 _amount,
        uint256 _deadline,
        string calldata _description
    ) external nonReentrant returns (uint256 newId) {
        if (_freelancer == address(0) || _freelancer == msg.sender) revert InvalidAddress();
        if (_freelancer == owner() || msg.sender == owner()) revert ArbitratorIsParty();
        if (_amount == 0) revert InvalidAmount();
        if (_deadline <= block.timestamp || _deadline > block.timestamp + MAX_DURATION) revert InvalidDeadline();
        uint256 len = bytes(_description).length;
        if (len == 0 || len > MAX_DESCRIPTION_LENGTH) revert InvalidDescription();

        newId = ++escrowIdCounter;

        // Защита от fee-on-transfer токенов: фиксируем реально полученную сумму
        uint256 before = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), _amount);
        uint256 received = token.balanceOf(address(this)) - before;
        if (received != _amount) revert InvalidAmount();

        _escrows[newId] = Escrow({
            id: newId,
            client: msg.sender,
            freelancer: _freelancer,
            amount: _amount,
            createdAt: uint64(block.timestamp),
            deadline: uint64(_deadline),
            submittedAt: 0,
            disputedAt: 0,
            status: EscrowStatus.FundsLocked,
            description: _description
        });
        _clientEscrows[msg.sender].push(newId);
        _freelancerEscrows[_freelancer].push(newId);

        emit EscrowCreated(newId, msg.sender, _freelancer, _amount, _deadline, _description);
    }

    function releaseFunds(uint256 id) external nonReentrant {
        Escrow storage e = _get(id);
        if (msg.sender != e.client) revert Unauthorized();
        if (e.status != EscrowStatus.FundsLocked && e.status != EscrowStatus.WorkSubmitted) revert InvalidStatus();

        e.status = EscrowStatus.Completed;
        token.safeTransfer(e.freelancer, e.amount);
        emit FundsReleased(id, e.freelancer, e.amount);
    }

    /// @notice Работа не сдана к дедлайну: заказчик забирает деньги без арбитра.
    function refundAfterDeadline(uint256 id) external nonReentrant {
        Escrow storage e = _get(id);
        if (msg.sender != e.client) revert Unauthorized();
        if (e.status != EscrowStatus.FundsLocked) revert InvalidStatus();
        if (block.timestamp <= e.deadline) revert TooEarly();

        e.status = EscrowStatus.Refunded;
        token.safeTransfer(e.client, e.amount);
        emit Refunded(id, e.client, e.amount, msg.sender);
    }

    // ───────────── фрилансер ─────────────

    function submitWork(uint256 id) external {
        Escrow storage e = _get(id);
        if (msg.sender != e.freelancer) revert Unauthorized();
        if (e.status != EscrowStatus.FundsLocked) revert InvalidStatus();
        if (block.timestamp > e.deadline) revert TooLate();

        e.status = EscrowStatus.WorkSubmitted;
        e.submittedAt = uint64(block.timestamp);
        emit WorkSubmitted(id, msg.sender);
    }

    /// @notice Работа сдана, заказчик молчит REVIEW_PERIOD: фрилансер забирает оплату.
    function claimAfterReview(uint256 id) external nonReentrant {
        Escrow storage e = _get(id);
        if (msg.sender != e.freelancer) revert Unauthorized();
        if (e.status != EscrowStatus.WorkSubmitted) revert InvalidStatus();
        if (block.timestamp < uint256(e.submittedAt) + REVIEW_PERIOD) revert TooEarly();

        e.status = EscrowStatus.Completed;
        token.safeTransfer(e.freelancer, e.amount);
        emit FundsClaimedAfterReview(id, e.freelancer, e.amount);
    }

    /// @notice Фрилансер добровольно отказывается от сделки и возвращает деньги заказчику.
    function refundByFreelancer(uint256 id) external nonReentrant {
        Escrow storage e = _get(id);
        if (msg.sender != e.freelancer) revert Unauthorized();
        if (
            e.status != EscrowStatus.FundsLocked &&
            e.status != EscrowStatus.WorkSubmitted &&
            e.status != EscrowStatus.Disputed
        ) revert InvalidStatus();

        e.status = EscrowStatus.Refunded;
        token.safeTransfer(e.client, e.amount);
        emit Refunded(id, e.client, e.amount, msg.sender);
    }

    // ───────────── споры ─────────────

    function initiateDispute(uint256 id) external {
        Escrow storage e = _get(id);
        if (msg.sender != e.client && msg.sender != e.freelancer) revert Unauthorized();
        if (e.status != EscrowStatus.FundsLocked && e.status != EscrowStatus.WorkSubmitted) revert InvalidStatus();

        e.status = EscrowStatus.Disputed;
        e.disputedAt = uint64(block.timestamp);
        emit DisputeInitiated(id, msg.sender);
    }

    /// @param toFreelancer сумма фрилансеру, остаток уходит заказчику (частичный сплит).
    function resolveDispute(uint256 id, uint256 toFreelancer) external onlyOwner nonReentrant {
        Escrow storage e = _get(id);
        if (e.status != EscrowStatus.Disputed) revert InvalidStatus();
        if (msg.sender == e.client || msg.sender == e.freelancer) revert ArbitratorIsParty();
        if (toFreelancer > e.amount) revert InvalidSplit();
        _settle(id, e, toFreelancer, false);
    }

    /// @notice Если арбитр не решил спор за DISPUTE_TIMEOUT, любая сторона делит сумму 50/50.
    function resolveDisputeByTimeout(uint256 id) external nonReentrant {
        Escrow storage e = _get(id);
        if (msg.sender != e.client && msg.sender != e.freelancer) revert Unauthorized();
        if (e.status != EscrowStatus.Disputed) revert InvalidStatus();
        if (block.timestamp < uint256(e.disputedAt) + DISPUTE_TIMEOUT) revert TooEarly();
        _settle(id, e, e.amount / 2, true);
    }

    // ───────────── internal ─────────────

    function _settle(uint256 id, Escrow storage e, uint256 toFreelancer, bool byTimeout) private {
        uint256 toClient = e.amount - toFreelancer;
        e.status = EscrowStatus.Resolved;
        if (toFreelancer > 0) token.safeTransfer(e.freelancer, toFreelancer);
        if (toClient > 0) token.safeTransfer(e.client, toClient);
        emit DisputeResolved(id, toClient, toFreelancer, byTimeout);
    }

    function _get(uint256 id) private view returns (Escrow storage e) {
        e = _escrows[id];
        if (e.id == 0) revert EscrowNotFound();
    }
}
