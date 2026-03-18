// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PropertyHistory {
	struct HistoryRecord {
		uint256 recordId;
		uint256 propertyId;
		address actor;
		string action;
		string details;
		uint256 timestamp;
	}

	address public immutable admin;
	uint256 public nextRecordId = 1;

	mapping(address => bool) public authorizedWriters;
	mapping(uint256 => HistoryRecord[]) private propertyHistory;

	event WriterAuthorizationUpdated(address indexed writer, bool authorized);
	event PropertyHistoryRecorded(
		uint256 indexed recordId,
		uint256 indexed propertyId,
		address indexed actor,
		string action,
		uint256 timestamp
	);

	error NotAdmin();
	error NotAuthorized();
	error InvalidWriter();
	error InvalidInput();
	error InvalidRange();

	constructor() {
		admin = msg.sender;
		authorizedWriters[msg.sender] = true;
		emit WriterAuthorizationUpdated(msg.sender, true);
	}

	modifier onlyAdmin() {
		if (msg.sender != admin) revert NotAdmin();
		_;
	}

	modifier onlyAuthorizedWriter() {
		if (!authorizedWriters[msg.sender]) revert NotAuthorized();
		_;
	}

	function setAuthorizedWriter(address writer, bool allowed) external onlyAdmin {
		if (writer == address(0)) revert InvalidWriter();

		authorizedWriters[writer] = allowed;
		emit WriterAuthorizationUpdated(writer, allowed);
	}

	function recordAction(uint256 propertyId, address actor, string calldata action, string calldata details)
		external
		onlyAuthorizedWriter
		returns (uint256 recordId)
	{
		if (propertyId == 0 || actor == address(0)) revert InvalidInput();
		if (bytes(action).length == 0) revert InvalidInput();

		recordId = nextRecordId;
		nextRecordId += 1;

		HistoryRecord memory record = HistoryRecord({
			recordId: recordId,
			propertyId: propertyId,
			actor: actor,
			action: action,
			details: details,
			timestamp: block.timestamp
		});

		propertyHistory[propertyId].push(record);

		emit PropertyHistoryRecorded(recordId, propertyId, actor, action, record.timestamp);
	}

	function getHistoryCount(uint256 propertyId) external view returns (uint256) {
		return propertyHistory[propertyId].length;
	}

	function getFullHistory(uint256 propertyId) external view returns (HistoryRecord[] memory) {
		return propertyHistory[propertyId];
	}

	function getHistoryByRange(uint256 propertyId, uint256 offset, uint256 limit)
		external
		view
		returns (HistoryRecord[] memory)
	{
		HistoryRecord[] storage entries = propertyHistory[propertyId];
		uint256 total = entries.length;

		if (offset >= total) {
			return new HistoryRecord[](0);
		}

		if (limit == 0) revert InvalidRange();

		uint256 end = offset + limit;
		if (end > total) {
			end = total;
		}

		uint256 size = end - offset;
		HistoryRecord[] memory result = new HistoryRecord[](size);

		for (uint256 i = 0; i < size; i++) {
			result[i] = entries[offset + i];
		}

		return result;
	}
}

