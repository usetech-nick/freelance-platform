// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Escrow {
    enum MilestoneStatus {
        Pending,
        Submitted,
        Approved
    }

    struct Milestone {
        uint amount;
        MilestoneStatus status;
    }

    address public client;
    address public freelancer;
    address public backendOracle;
    uint public riskCategory; // 0 = Low, 1 = Medium, 2 = High
    bytes32 public requirementHash;
    Milestone[] public milestones;
    address public disputeContract;

    modifier onlyClient() {
        require(msg.sender == client, "Only the client can call this");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Only the freelancer can call this");
        _;
    }

    modifier onlyOracle() {
        require(
            msg.sender == backendOracle,
            "Only the backend oracle can call this"
        );
        _;
    }

    modifier onlyDisputeContract() {
        require(
            msg.sender == disputeContract,
            "Only the dispute contract can call this"
        );
        _;
    }

    event Refunded(uint amount);
    event Deposited(uint totalAmount, uint milestoneCount);
    event MilestoneSubmitted(uint milestoneIndex);
    event MilestoneApproved(uint milestoneIndex, uint amountPaid);
    event RequirementHashUpdated(bytes32 newHash);
    event RiskCategoryUpdated(uint newRiskCategory);
    event DisputeContractSet(address disputeContract);
    event DisputeResolved(
        uint milestoneIndex,
        bool releasedToFreelancer,
        uint amount
    );

    constructor(
        address _client,
        address _freelancer,
        address _backendOracle,
        uint _riskCategory,
        bytes32 _requirementHash,
        uint[] memory _milestoneAmounts
    ) payable {
        require(_client != address(0), "Invalid client address");
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_backendOracle != address(0), "Invalid oracle address");
        require(_milestoneAmounts.length > 0, "Need at least one milestone");

        uint total = 0;
        for (uint i = 0; i < _milestoneAmounts.length; i++) {
            milestones.push(
                Milestone({
                    amount: _milestoneAmounts[i],
                    status: MilestoneStatus.Pending
                })
            );
            total += _milestoneAmounts[i];
        }

        require(
            msg.value == total,
            "Deposit must equal sum of milestone amounts"
        );

        client = _client;
        freelancer = _freelancer;
        backendOracle = _backendOracle;
        riskCategory = _riskCategory;
        requirementHash = _requirementHash;

        emit Deposited(msg.value, _milestoneAmounts.length);
    }

    function getMilestoneCount() public view returns (uint) {
        return milestones.length;
    }

    function submitMilestone(uint milestoneIndex) public onlyFreelancer {
        require(milestoneIndex < milestones.length, "Invalid milestone index");
        require(
            milestones[milestoneIndex].status == MilestoneStatus.Pending,
            "Milestone not in Pending state"
        );

        milestones[milestoneIndex].status = MilestoneStatus.Submitted;
        emit MilestoneSubmitted(milestoneIndex);
    }

    function approveMilestone(uint milestoneIndex) public onlyClient {
        require(milestoneIndex < milestones.length, "Invalid milestone index");
        require(
            milestones[milestoneIndex].status == MilestoneStatus.Submitted,
            "Milestone not in Submitted state"
        );

        milestones[milestoneIndex].status = MilestoneStatus.Approved;
        uint amount = milestones[milestoneIndex].amount;

        (bool success, ) = payable(freelancer).call{value: amount}("");
        require(success, "Transfer to freelancer failed");

        emit MilestoneApproved(milestoneIndex, amount);
    }

    function refund() public onlyClient {
        uint remaining = 0;

        for (uint i = 0; i < milestones.length; i++) {
            if (milestones[i].status != MilestoneStatus.Approved) {
                remaining += milestones[i].amount;
                milestones[i].status = MilestoneStatus.Approved; // mark as settled so it can't be paid out twice
            }
        }

        require(remaining > 0, "Nothing left to refund");

        (bool success, ) = payable(client).call{value: remaining}("");
        require(success, "Refund transfer failed");

        emit Refunded(remaining);
    }

    function updateRequirementHash(bytes32 newHash) public onlyClient {
        requirementHash = newHash;
        emit RequirementHashUpdated(newHash);
    }

    function updateRiskCategory(uint newRiskCategory) public onlyOracle {
        require(newRiskCategory <= 2, "Invalid risk category");
        riskCategory = newRiskCategory;
        emit RiskCategoryUpdated(newRiskCategory);
    }

    function setDisputeContract(address _disputeContract) public onlyOracle {
        require(disputeContract == address(0), "Dispute contract already set");
        require(
            _disputeContract != address(0),
            "Invalid dispute contract address"
        );
        disputeContract = _disputeContract;
        emit DisputeContractSet(_disputeContract);
    }

    function resolveDisputedMilestone(
        uint milestoneIndex,
        bool releaseToFreelancer
    ) public onlyDisputeContract {
        require(milestoneIndex < milestones.length, "Invalid milestone index");
        require(
            milestones[milestoneIndex].status == MilestoneStatus.Submitted,
            "Milestone must be Submitted to dispute"
        );

        uint amount = milestones[milestoneIndex].amount;
        milestones[milestoneIndex].status = MilestoneStatus.Approved; // settled either way

        address payable recipient = releaseToFreelancer
            ? payable(freelancer)
            : payable(client);
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Dispute payout transfer failed");

        emit DisputeResolved(milestoneIndex, releaseToFreelancer, amount);
    }
}
