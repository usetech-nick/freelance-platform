// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IEscrow {
    function resolveDisputedMilestone(
        uint milestoneIndex,
        bool releaseToFreelancer
    ) external;
}

contract Dispute {
    enum Vote {
        None,
        Freelancer,
        Client
    }

    struct DisputeCase {
        address escrowAddress;
        uint milestoneIndex;
        address[3] verifiers;
        mapping(address => Vote) votes;
        uint freelancerVotes;
        uint clientVotes;
        bool resolved;
    }

    address public backendOracle;
    uint public disputeCount;
    mapping(uint => DisputeCase) public disputes;

    event DisputeRaised(
        uint disputeId,
        address escrowAddress,
        uint milestoneIndex
    );
    event VoteCast(uint disputeId, address verifier, Vote vote);
    event DisputeFinalized(uint disputeId, bool releasedToFreelancer);

    modifier onlyOracle() {
        require(
            msg.sender == backendOracle,
            "Only the backend oracle can call this"
        );
        _;
    }

    constructor(address _backendOracle) {
        require(_backendOracle != address(0), "Invalid oracle address");
        backendOracle = _backendOracle;
    }

    function raiseDispute(
        address escrowAddress,
        uint milestoneIndex,
        address[3] memory verifiers
    ) public onlyOracle returns (uint) {
        require(
            verifiers[0] != verifiers[1] &&
                verifiers[1] != verifiers[2] &&
                verifiers[0] != verifiers[2],
            "Verifiers must be 3 distinct addresses"
        );

        uint disputeId = disputeCount;
        DisputeCase storage d = disputes[disputeId];
        d.escrowAddress = escrowAddress;
        d.milestoneIndex = milestoneIndex;
        d.verifiers = verifiers;

        disputeCount++;
        emit DisputeRaised(disputeId, escrowAddress, milestoneIndex);
        return disputeId;
    }

    function isVerifier(
        uint disputeId,
        address account
    ) public view returns (bool) {
        DisputeCase storage d = disputes[disputeId];
        return
            account == d.verifiers[0] ||
            account == d.verifiers[1] ||
            account == d.verifiers[2];
    }

    function castVote(uint disputeId, bool voteForFreelancer) public {
        DisputeCase storage d = disputes[disputeId];

        require(!d.resolved, "Dispute already resolved");
        require(
            isVerifier(disputeId, msg.sender),
            "Not a verifier for this dispute"
        );
        require(d.votes[msg.sender] == Vote.None, "Already voted");

        Vote v = voteForFreelancer ? Vote.Freelancer : Vote.Client;
        d.votes[msg.sender] = v;

        if (v == Vote.Freelancer) {
            d.freelancerVotes++;
        } else {
            d.clientVotes++;
        }

        emit VoteCast(disputeId, msg.sender, v);

        // Check for 2-of-3 majority
        if (d.freelancerVotes == 2 || d.clientVotes == 2) {
            d.resolved = true;
            bool releaseToFreelancer = d.freelancerVotes == 2;

            IEscrow(d.escrowAddress).resolveDisputedMilestone(
                d.milestoneIndex,
                releaseToFreelancer
            );

            emit DisputeFinalized(disputeId, releaseToFreelancer);
        }
    }
}
