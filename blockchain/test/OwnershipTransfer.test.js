const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OwnershipTransfer", function () {
	async function deployFixture() {
		const [admin, owner, buyer, outsider] = await ethers.getSigners();

		const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
		const registry = await PropertyRegistry.connect(admin).deploy();
		await registry.waitForDeployment();

		const OwnershipTransfer = await ethers.getContractFactory("OwnershipTransfer");
		const transfer = await OwnershipTransfer.connect(admin).deploy(await registry.getAddress());
		await transfer.waitForDeployment();

		await registry.connect(admin).setTransferContract(await transfer.getAddress());

		await registry.connect(admin).registerProperty(
			"KH-101",
			"SV-202",
			"PL-303",
			"Noida Sector 12",
			1200,
			owner.address
		);

		const propertyId = 1;

		return {
			admin,
			owner,
			buyer,
			outsider,
			registry,
			transfer,
			propertyId,
		};
	}

	describe("constructor", function () {
		it("reverts for zero registry address", async function () {
			const OwnershipTransfer = await ethers.getContractFactory("OwnershipTransfer");
			await expect(OwnershipTransfer.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
				OwnershipTransfer,
				"InvalidAddress"
			);
		});
	});

	describe("requestTransfer", function () {
		it("creates transfer request and emits event", async function () {
			const { transfer, owner, buyer, propertyId } = await deployFixture();

			await expect(transfer.connect(owner).requestTransfer(propertyId, buyer.address))
				.to.emit(transfer, "TransferRequested")
				.withArgs(1, propertyId, owner.address, buyer.address);

			const request = await transfer.transferRequests(1);
			expect(request.requestId).to.equal(1);
			expect(request.propertyId).to.equal(propertyId);
			expect(request.fromOwner).to.equal(owner.address);
			expect(request.toOwner).to.equal(buyer.address);
			expect(request.approved).to.equal(false);
			expect(request.executed).to.equal(false);

			expect(await transfer.nextRequestId()).to.equal(2);
		});

		it("reverts when recipient is zero address", async function () {
			const { transfer, owner, propertyId } = await deployFixture();

			await expect(
				transfer.connect(owner).requestTransfer(propertyId, ethers.ZeroAddress)
			).to.be.revertedWithCustomError(transfer, "InvalidAddress");
		});

		it("reverts when recipient is requester", async function () {
			const { transfer, owner, propertyId } = await deployFixture();

			await expect(
				transfer.connect(owner).requestTransfer(propertyId, owner.address)
			).to.be.revertedWithCustomError(transfer, "InvalidAddress");
		});
	});

	describe("approveTransfer", function () {
		it("allows intended recipient to approve", async function () {
			const { transfer, owner, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);

			await expect(transfer.connect(buyer).approveTransfer(1))
				.to.emit(transfer, "TransferApproved")
				.withArgs(1, buyer.address);

			const request = await transfer.transferRequests(1);
			expect(request.approved).to.equal(true);
		});

		it("reverts for invalid request id", async function () {
			const { transfer, buyer } = await deployFixture();

			await expect(transfer.connect(buyer).approveTransfer(999)).to.be.revertedWithCustomError(
				transfer,
				"InvalidRequest"
			);
		});

		it("reverts when approver is not intended recipient", async function () {
			const { transfer, owner, outsider, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);

			await expect(transfer.connect(outsider).approveTransfer(1)).to.be.revertedWithCustomError(
				transfer,
				"NotIntendedRecipient"
			);
		});

		it("reverts when already approved", async function () {
			const { transfer, owner, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);
			await transfer.connect(buyer).approveTransfer(1);

			await expect(transfer.connect(buyer).approveTransfer(1)).to.be.revertedWithCustomError(
				transfer,
				"AlreadyApproved"
			);
		});
	});

	describe("executeTransfer", function () {
		it("executes approved transfer and updates registry owner", async function () {
			const { transfer, registry, owner, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);
			await transfer.connect(buyer).approveTransfer(1);

			await expect(transfer.connect(owner).executeTransfer(1))
				.to.emit(transfer, "TransferExecuted")
				.withArgs(1, propertyId, buyer.address);

			const request = await transfer.transferRequests(1);
			expect(request.executed).to.equal(true);

			expect(await registry.ownerOf(propertyId)).to.equal(buyer.address);
		});

		it("reverts when request is not approved", async function () {
			const { transfer, owner, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);

			await expect(transfer.connect(owner).executeTransfer(1)).to.be.revertedWithCustomError(
				transfer,
				"NotApproved"
			);
		});

		it("reverts for invalid request id", async function () {
			const { transfer, owner } = await deployFixture();

			await expect(transfer.connect(owner).executeTransfer(999)).to.be.revertedWithCustomError(
				transfer,
				"InvalidRequest"
			);
		});

		it("reverts when already executed", async function () {
			const { transfer, owner, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);
			await transfer.connect(buyer).approveTransfer(1);
			await transfer.connect(owner).executeTransfer(1);

			await expect(transfer.connect(owner).executeTransfer(1)).to.be.revertedWithCustomError(
				transfer,
				"AlreadyExecuted"
			);
		});
	});

	describe("cancelTransfer", function () {
		it("allows requester to cancel request", async function () {
			const { transfer, owner, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);

			await expect(transfer.connect(owner).cancelTransfer(1))
				.to.emit(transfer, "TransferCancelled")
				.withArgs(1);

			const request = await transfer.transferRequests(1);
			expect(request.requestId).to.equal(0);
		});

		it("reverts when non-requester tries to cancel", async function () {
			const { transfer, owner, buyer, outsider, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);

			await expect(transfer.connect(outsider).cancelTransfer(1)).to.be.revertedWithCustomError(
				transfer,
				"NotRequester"
			);
		});

		it("reverts for invalid request id", async function () {
			const { transfer, owner } = await deployFixture();

			await expect(transfer.connect(owner).cancelTransfer(999)).to.be.revertedWithCustomError(
				transfer,
				"InvalidRequest"
			);
		});

		it("reverts when request is already executed", async function () {
			const { transfer, owner, buyer, propertyId } = await deployFixture();

			await transfer.connect(owner).requestTransfer(propertyId, buyer.address);
			await transfer.connect(buyer).approveTransfer(1);
			await transfer.connect(owner).executeTransfer(1);

			await expect(transfer.connect(owner).cancelTransfer(1)).to.be.revertedWithCustomError(
				transfer,
				"AlreadyExecuted"
			);
		});
	});
});

