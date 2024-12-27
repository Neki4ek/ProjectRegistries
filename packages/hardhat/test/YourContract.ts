import { expect } from "chai";
import { ethers } from "hardhat";
import { HotelBooking } from "../typechain-types";

describe("HotelBooking Contract", function () {
  let hotelBooking: HotelBooking;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const HotelBookingFactory = await ethers.getContractFactory("HotelBooking");
    hotelBooking = (await HotelBookingFactory.deploy(owner.address)) as HotelBooking;
    await hotelBooking.waitForDeployment();;
  });

  describe("Deployment", function () {
    it("Should deploy with the owner set", async function () {
      expect(await hotelBooking.owner()).to.equal(owner.address);
    });
  });

  describe("Room Management", function () {
    it("Should allow the owner to create a room", async function () {
      await hotelBooking.createRoom("Room A", "A beautiful room", ethers.parseEther("0.1"), 0); // NORMAL level
      const room = await hotelBooking.getRoom(0);

      expect(room.name).to.equal("Room A");
      expect(room.price).to.equal(ethers.parseEther("0.1"));
      expect(room.status).to.equal(0); // AVAILABLE
    });

    it("Should not allow non-owner to create a room", async function () {
      await expect(
        hotelBooking.connect(user).createRoom("Room B", "Another room", ethers.parseEther("0.2"), 1)
      ).to.be.revertedWith("Caller is not the owner");
    });
  });

  describe("Booking", function () {
    beforeEach(async () => {
      await hotelBooking.createRoom("Room A", "A beautiful room", ethers.parseEther("0.1"), 0); // NORMAL level
    });

    it("Should allow a user to book an available room", async function () {
      await hotelBooking.connect(user).bookRoom(0, 3, { value: ethers.parseEther("0.3") });

      const room = await hotelBooking.getRoom(0);
      expect(room.status).to.equal(1); // BOOKED
    });

    it("Should revert if the room does not exist", async function () {
      await expect(hotelBooking.connect(user).bookRoom(99, 2, { value: ethers.parseEther("0.2") }))
        .to.be.revertedWithCustomError(hotelBooking, "RoomNotExists");
    });

    it("Should revert if the room is already booked", async function () {
      await hotelBooking.connect(user).bookRoom(0, 1, { value: ethers.parseEther("0.1") });

      await expect(hotelBooking.connect(user).bookRoom(0, 1, { value: ethers.parseEther("0.1") }))
        .to.be.revertedWithCustomError(hotelBooking, "RoomNotAvailable");
    });

    it("Should revert if payment is insufficient", async function () {
      await expect(hotelBooking.connect(user).bookRoom(0, 3, { value: ethers.parseEther("0.2") }))
        .to.be.revertedWithCustomError(hotelBooking, "InvalidPayment");
    });

    it("Should refund excess payment", async function () {
      const initialBalance = await ethers.provider.getBalance(user.address);

      const tx = await hotelBooking.connect(user).bookRoom(0, 3, { value: ethers.parseEther("0.5") });
      const receipt = await tx.wait();

      const finalBalance = await ethers.provider.getBalance(user.address);
      const gasCost = receipt.gasUsed * receipt.effectiveGasPrice;

      expect(finalBalance.add(gasCost)).to.equal(initialBalance.sub(ethers.parseEther("0.3")));
    });
  });

  describe("Utility Functions", function () {
    beforeEach(async () => {
      await hotelBooking.createRoom("Room A", "A beautiful room", ethers.parseEther("0.1"), 0); // NORMAL level
      await hotelBooking.createRoom("Room B", "Another room", ethers.parseEther("0.2"), 0); // NORMAL level
    });

    it("Should return the total number of rooms", async function () {
      const roomCount = await hotelBooking.getRoomCount();
      expect(roomCount).to.equal(2);
    });

    it("Should return only available rooms", async function () {
      await hotelBooking.connect(user).bookRoom(0, 1, { value: ethers.parseEther("0.1") });

      const availableRooms = await hotelBooking.getAvailableRooms();
      expect(availableRooms.length).to.equal(1);
      expect(availableRooms[0]).to.equal(1);
    });
  });
});
