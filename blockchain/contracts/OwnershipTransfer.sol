// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPropertyRegistry {
	function transferOwnershipByContract(uint256 propertyId, address expectedCurrentOwner, address newOwner) external;
}

contract OwnershipTransfer {
	struct TransferRequest {
		uint256 requestId;
		uint256 propertyId;
		address fromOwner;
		address toOwner;
		bool approved;
		bool executed;
		uint256 createdAt;
	}

	uint256 public nextRequestId = 1;
	IPropertyRegistry public immutable registry;

	mapping(uint256 => TransferRequest) public transferRequests;

	event TransferRequested(uint256 indexed requestId, uint256 indexed propertyId, address indexed fromOwner, address toOwner);
	event TransferApproved(uint256 indexed requestId, address indexed approver);
	event TransferExecuted(uint256 indexed requestId, uint256 indexed propertyId, address indexed toOwner);
	event TransferCancelled(uint256 indexed requestId);

	error InvalidAddress();
	error InvalidRequest();
	error NotIntendedRecipient();
	error NotRequester();
	error AlreadyApproved();
	error AlreadyExecuted();
	error NotApproved();

	constructor(address registryAddress) {
		if (registryAddress == address(0)) revert InvalidAddress();
		registry = IPropertyRegistry(registryAddress);
	}

	function requestTransfer(uint256 propertyId, address toOwner) external returns (uint256 requestId) {
		if (toOwner == address(0) || toOwner == msg.sender) revert InvalidAddress();

		requestId = nextRequestId;
		nextRequestId += 1;

		transferRequests[requestId] = TransferRequest({
			requestId: requestId,
			propertyId: propertyId,
			fromOwner: msg.sender,
			toOwner: toOwner,
			approved: false,
			executed: false,
			createdAt: block.timestamp
		});

		emit TransferRequested(requestId, propertyId, msg.sender, toOwner);
	}

	function approveTransfer(uint256 requestId) external {
		TransferRequest storage request = transferRequests[requestId];
		if (request.requestId == 0) revert InvalidRequest();
		if (request.executed) revert AlreadyExecuted();
		if (request.approved) revert AlreadyApproved();
		if (msg.sender != request.toOwner) revert NotIntendedRecipient();

		request.approved = true;
		emit TransferApproved(requestId, msg.sender);
	}

	function executeTransfer(uint256 requestId) external {
		TransferRequest storage request = transferRequests[requestId];
		if (request.requestId == 0) revert InvalidRequest();
		if (request.executed) revert AlreadyExecuted();
		if (!request.approved) revert NotApproved();

		registry.transferOwnershipByContract(request.propertyId, request.fromOwner, request.toOwner);
		request.executed = true;

		emit TransferExecuted(requestId, request.propertyId, request.toOwner);
	}

	function cancelTransfer(uint256 requestId) external {
		TransferRequest storage request = transferRequests[requestId];
		if (request.requestId == 0) revert InvalidRequest();
		if (request.executed) revert AlreadyExecuted();
		if (msg.sender != request.fromOwner) revert NotRequester();

		delete transferRequests[requestId];
		emit TransferCancelled(requestId);
	}
}
