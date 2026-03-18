const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyRegistry", function () {
	async function deployFixture() {
		const [admin, owner, buyer, outsider, transferOperator] = await ethers.getSigners();

		const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
		const registry = await PropertyRegistry.connect(admin).deploy();
		await registry.waitForDeployment();

		return { admin, owner, buyer, outsider, transferOperator, registry };
	}

	async function registerDefaultProperty(registry, ownerSigner) {
		await registry.registerProperty(
			"KH-101",
			"SV-202",
			"PL-303",
			"Noida Sector 12",
			1200,
			ownerSigner.address
		);

		return 1;
	}

	describe("deployment", function () {
		it("sets deployer as admin", async function () {
			const { admin, registry } = await deployFixture();
			expect(await registry.admin()).to.equal(admin.address);
			expect(await registry.nextPropertyId()).to.equal(1);
		});
	});

	describe("setTransferContract", function () {
		it("allows admin to set transfer contract", async function () {
			const { admin, transferOperator, registry } = await deployFixture();

			await expect(registry.connect(admin).setTransferContract(transferOperator.address))
				.to.emit(registry, "TransferContractUpdated")
				.withArgs(transferOperator.address);

			expect(await registry.transferContract()).to.equal(transferOperator.address);
		});

		it("reverts for non-admin caller", async function () {
			const { outsider, transferOperator, registry } = await deployFixture();

			await expect(
				registry.connect(outsider).setTransferContract(transferOperator.address)
			).to.be.revertedWithCustomError(registry, "NotAdmin");
		});

		it("reverts for zero address", async function () {
			const { admin, registry } = await deployFixture();

			await expect(registry.connect(admin).setTransferContract(ethers.ZeroAddress)).to.be.revertedWithCustomError(
				registry,
				"InvalidAddress"
			);
		});
	});

	describe("registerProperty", function () {
		it("registers property and stores all fields", async function () {
			const { registry, owner } = await deployFixture();

			await expect(
				registerDefaultProperty(registry, owner)
			).to.emit(registry, "PropertyRegistered").withArgs(1, owner.address, "KH-101", "SV-202", "PL-303");

			const property = await registry.getProperty(1);
			expect(property.propertyId).to.equal(1);
			expect(property.khasraNumber).to.equal("KH-101");
			expect(property.surveyNumber).to.equal("SV-202");
			expect(property.plotNumber).to.equal("PL-303");
			expect(property.location).to.equal("Noida Sector 12");
			expect(property.area).to.equal(1200);
			expect(property.currentOwner).to.equal(owner.address);
			expect(property.exists).to.equal(true);
			expect(property.registeredAt).to.be.gt(0);
			expect(property.updatedAt).to.be.gt(0);

			expect(await registry.nextPropertyId()).to.equal(2);
			expect(await registry.exists(1)).to.equal(true);
		});

		it("reverts for duplicate khasra+survey+plot fingerprint", async function () {
			const { registry, owner, buyer } = await deployFixture();
			await registerDefaultProperty(registry, owner);

			await expect(
				registry.registerProperty("KH-101", "SV-202", "PL-303", "Delhi", 1500, buyer.address)
			).to.be.revertedWithCustomError(registry, "DuplicateProperty");
		});

		it("reverts for invalid owner", async function () {
			const { registry } = await deployFixture();

			await expect(
				registry.registerProperty("KH-101", "SV-202", "PL-303", "Delhi", 1500, ethers.ZeroAddress)
			).to.be.revertedWithCustomError(registry, "InvalidAddress");
		});

		it("reverts for invalid area", async function () {
			const { registry, owner } = await deployFixture();

			await expect(
				registry.registerProperty("KH-101", "SV-202", "PL-303", "Delhi", 0, owner.address)
			).to.be.revertedWithCustomError(registry, "InvalidData");
		});

		it("reverts for missing text fields", async function () {
			const { registry, owner } = await deployFixture();

			await expect(
				registry.registerProperty("", "SV-202", "PL-303", "Delhi", 1500, owner.address)
			).to.be.revertedWithCustomError(registry, "InvalidData");

			await expect(
				registry.registerProperty("KH-101", "", "PL-303", "Delhi", 1500, owner.address)
			).to.be.revertedWithCustomError(registry, "InvalidData");

			await expect(
				registry.registerProperty("KH-101", "SV-202", "", "Delhi", 1500, owner.address)
			).to.be.revertedWithCustomError(registry, "InvalidData");

			await expect(
				registry.registerProperty("KH-101", "SV-202", "PL-303", "", 1500, owner.address)
			).to.be.revertedWithCustomError(registry, "InvalidData");
		});
	});

	describe("updatePropertyMetadata", function () {
		it("allows owner to update location and area", async function () {
			const { registry, owner } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await expect(
				registry.connect(owner).updatePropertyMetadata(propertyId, "Greater Noida", 1800)
			).to.emit(registry, "PropertyUpdated").withArgs(propertyId, "Greater Noida", 1800);

			const property = await registry.getProperty(propertyId);
			expect(property.location).to.equal("Greater Noida");
			expect(property.area).to.equal(1800);
		});

		it("reverts when caller is not owner", async function () {
			const { registry, owner, outsider } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await expect(
				registry.connect(outsider).updatePropertyMetadata(propertyId, "Ghaziabad", 1600)
			).to.be.revertedWithCustomError(registry, "NotPropertyOwner");
		});

		it("reverts for invalid metadata values", async function () {
			const { registry, owner } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await expect(
				registry.connect(owner).updatePropertyMetadata(propertyId, "", 1600)
			).to.be.revertedWithCustomError(registry, "InvalidData");

			await expect(
				registry.connect(owner).updatePropertyMetadata(propertyId, "Ghaziabad", 0)
			).to.be.revertedWithCustomError(registry, "InvalidData");
		});

		it("reverts for non-existent property", async function () {
			const { registry, owner } = await deployFixture();

			await expect(
				registry.connect(owner).updatePropertyMetadata(999, "Ghaziabad", 1600)
			).to.be.revertedWithCustomError(registry, "InvalidProperty");
		});
	});

	describe("transferOwnership", function () {
		it("allows owner to transfer ownership", async function () {
			const { registry, owner, buyer } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await expect(registry.connect(owner).transferOwnership(propertyId, buyer.address))
				.to.emit(registry, "PropertyOwnershipTransferred")
				.withArgs(propertyId, owner.address, buyer.address);

			expect(await registry.ownerOf(propertyId)).to.equal(buyer.address);
		});

		it("reverts when caller is not owner", async function () {
			const { registry, owner, buyer, outsider } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await expect(
				registry.connect(outsider).transferOwnership(propertyId, buyer.address)
			).to.be.revertedWithCustomError(registry, "NotPropertyOwner");
		});

		it("reverts for invalid target owner", async function () {
			const { registry, owner } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await expect(
				registry.connect(owner).transferOwnership(propertyId, ethers.ZeroAddress)
			).to.be.revertedWithCustomError(registry, "InvalidAddress");

			await expect(
				registry.connect(owner).transferOwnership(propertyId, owner.address)
			).to.be.revertedWithCustomError(registry, "InvalidAddress");
		});
	});

	describe("transferOwnershipByContract", function () {
		it("allows configured transfer contract to transfer ownership", async function () {
			const { registry, admin, owner, buyer, transferOperator } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await registry.connect(admin).setTransferContract(transferOperator.address);

			await expect(
				registry.connect(transferOperator).transferOwnershipByContract(propertyId, owner.address, buyer.address)
			)
				.to.emit(registry, "PropertyOwnershipTransferred")
				.withArgs(propertyId, owner.address, buyer.address);

			expect(await registry.ownerOf(propertyId)).to.equal(buyer.address);
		});

		it("reverts when caller is not configured transfer contract", async function () {
			const { registry, owner, buyer, outsider } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await expect(
				registry.connect(outsider).transferOwnershipByContract(propertyId, owner.address, buyer.address)
			).to.be.revertedWithCustomError(registry, "UnauthorizedTransferContract");
		});

		it("reverts when expected owner does not match current owner", async function () {
			const { registry, admin, owner, buyer, outsider, transferOperator } = await deployFixture();
			const propertyId = await registerDefaultProperty(registry, owner);

			await registry.connect(admin).setTransferContract(transferOperator.address);

			await expect(
				registry.connect(transferOperator).transferOwnershipByContract(propertyId, outsider.address, buyer.address)
			).to.be.revertedWithCustomError(registry, "NotPropertyOwner");
		});

		it("reverts for non-existent property", async function () {
			const { registry, admin, owner, transferOperator } = await deployFixture();
			await registry.connect(admin).setTransferContract(transferOperator.address);

			await expect(
				registry.connect(transferOperator).transferOwnershipByContract(999, owner.address, transferOperator.address)
			).to.be.revertedWithCustomError(registry, "InvalidProperty");
		});
	});

	describe("read helpers", function () {
		it("ownerOf and getProperty revert for non-existent property", async function () {
			const { registry } = await deployFixture();

			await expect(registry.ownerOf(999)).to.be.revertedWithCustomError(registry, "InvalidProperty");
			await expect(registry.getProperty(999)).to.be.revertedWithCustomError(registry, "InvalidProperty");
			expect(await registry.exists(999)).to.equal(false);
		});
	});
});

