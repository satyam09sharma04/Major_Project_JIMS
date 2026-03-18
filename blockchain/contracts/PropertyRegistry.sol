// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PropertyRegistry {
	struct Property {
		uint256 propertyId;
		string khasraNumber;
		string surveyNumber;
		string plotNumber;
		string location;
		uint256 area;
		address currentOwner;
		uint256 registeredAt;
		uint256 updatedAt;
		bool exists;
	}

	address public immutable admin;
	address public transferContract;
	uint256 public nextPropertyId = 1;

	mapping(uint256 => Property) private properties;
	mapping(bytes32 => uint256) private propertyFingerprintToId;

	event PropertyRegistered(
		uint256 indexed propertyId,
		address indexed owner,
		string khasraNumber,
		string surveyNumber,
		string plotNumber
	);
	event PropertyUpdated(uint256 indexed propertyId, string location, uint256 area);
	event PropertyOwnershipTransferred(uint256 indexed propertyId, address indexed fromOwner, address indexed toOwner);
	event TransferContractUpdated(address indexed transferContract);

	error NotAdmin();
	error NotPropertyOwner();
	error InvalidAddress();
	error InvalidProperty();
	error DuplicateProperty();
	error InvalidData();
	error UnauthorizedTransferContract();

	constructor() {
		admin = msg.sender;
	}

	modifier onlyAdmin() {
		if (msg.sender != admin) revert NotAdmin();
		_;
	}

	modifier onlyPropertyOwner(uint256 propertyId) {
		if (!properties[propertyId].exists) revert InvalidProperty();
		if (properties[propertyId].currentOwner != msg.sender) revert NotPropertyOwner();
		_;
	}

	function setTransferContract(address transferContractAddress) external onlyAdmin {
		if (transferContractAddress == address(0)) revert InvalidAddress();
		transferContract = transferContractAddress;
		emit TransferContractUpdated(transferContractAddress);
	}

	function registerProperty(
		string calldata khasraNumber,
		string calldata surveyNumber,
		string calldata plotNumber,
		string calldata location,
		uint256 area,
		address owner
	) external returns (uint256 propertyId) {
		if (owner == address(0)) revert InvalidAddress();
		if (area == 0) revert InvalidData();
		if (
			bytes(khasraNumber).length == 0 || bytes(surveyNumber).length == 0 || bytes(plotNumber).length == 0
				|| bytes(location).length == 0
		) {
			revert InvalidData();
		}

		bytes32 fingerprint = keccak256(abi.encodePacked(khasraNumber, surveyNumber, plotNumber));
		if (propertyFingerprintToId[fingerprint] != 0) revert DuplicateProperty();

		propertyId = nextPropertyId;
		nextPropertyId += 1;

		properties[propertyId] = Property({
			propertyId: propertyId,
			khasraNumber: khasraNumber,
			surveyNumber: surveyNumber,
			plotNumber: plotNumber,
			location: location,
			area: area,
			currentOwner: owner,
			registeredAt: block.timestamp,
			updatedAt: block.timestamp,
			exists: true
		});

		propertyFingerprintToId[fingerprint] = propertyId;

		emit PropertyRegistered(propertyId, owner, khasraNumber, surveyNumber, plotNumber);
	}

	function updatePropertyMetadata(uint256 propertyId, string calldata location, uint256 area)
		external
		onlyPropertyOwner(propertyId)
	{
		if (bytes(location).length == 0 || area == 0) revert InvalidData();

		Property storage propertyItem = properties[propertyId];
		propertyItem.location = location;
		propertyItem.area = area;
		propertyItem.updatedAt = block.timestamp;

		emit PropertyUpdated(propertyId, location, area);
	}

	function transferOwnership(uint256 propertyId, address newOwner) external onlyPropertyOwner(propertyId) {
		_transferOwnership(propertyId, msg.sender, newOwner);
	}

	function transferOwnershipByContract(uint256 propertyId, address expectedCurrentOwner, address newOwner) external {
		if (msg.sender != transferContract) revert UnauthorizedTransferContract();
		if (!properties[propertyId].exists) revert InvalidProperty();
		if (properties[propertyId].currentOwner != expectedCurrentOwner) revert NotPropertyOwner();

		_transferOwnership(propertyId, expectedCurrentOwner, newOwner);
	}

	function getProperty(uint256 propertyId) external view returns (Property memory) {
		if (!properties[propertyId].exists) revert InvalidProperty();
		return properties[propertyId];
	}

	function ownerOf(uint256 propertyId) external view returns (address) {
		if (!properties[propertyId].exists) revert InvalidProperty();
		return properties[propertyId].currentOwner;
	}

	function exists(uint256 propertyId) external view returns (bool) {
		return properties[propertyId].exists;
	}

	function _transferOwnership(uint256 propertyId, address currentOwner, address newOwner) private {
		if (!properties[propertyId].exists) revert InvalidProperty();
		if (newOwner == address(0) || newOwner == currentOwner) revert InvalidAddress();

		Property storage propertyItem = properties[propertyId];
		propertyItem.currentOwner = newOwner;
		propertyItem.updatedAt = block.timestamp;

		emit PropertyOwnershipTransferred(propertyId, currentOwner, newOwner);
	}
}
