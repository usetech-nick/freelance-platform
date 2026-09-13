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
    uint public riskCategory; // 0 = Low, 1 = Medium, 2 = High
    bytes32 public requirementHash;

    Milestone[] public milestones;

    modifier onlyClient() {
        require(msg.sender == client, "Only the client can call this");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "Only the freelancer can call this");
        _;
    }

    event Deposited(uint totalAmount, uint milestoneCount);
    event MilestoneSubmitted(uint milestoneIndex);
    event MilestoneApproved(uint milestoneIndex, uint amountPaid);

    constructor(
        address _client,
        address _freelancer,
        uint _riskCategory,
        bytes32 _requirementHash,
        uint[] memory _milestoneAmounts
    ) payable {
        require(_client != address(0), "Invalid client address");
        require(_freelancer != address(0), "Invalid freelancer address");
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
}
