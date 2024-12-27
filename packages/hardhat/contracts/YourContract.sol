// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HotelBooking is Ownable, ReentrancyGuard {
    error RoomNotExists();
    error RoomNotAvailable();
    error InvalidPayment();
    error InvalidDays();
    
    enum RoomLevel { NORMAL, GOLD, PLATINUM, DIAMOND }
    
    enum RoomStatus { AVAILABLE, BOOKED }
    
    struct Room {
        uint256 price;
        RoomLevel level; 
        RoomStatus status;
        string name;
        string description;
    }
    
    Room[] public rooms;
    
    event RoomCreated(uint256 indexed roomId, string name, uint256 price, RoomLevel level);
    event RoomBooked(uint256 indexed roomId, address indexed booker, uint256 numDays);
    event CreateRoomAttempt(
        address indexed creator,
        string name,
        string description,
        uint256 price,
        RoomLevel level
    );
    
    constructor() Ownable(msg.sender) {}
    
    function createRoom(
        string memory _name,
        string memory _description,
        uint256 _price,
        RoomLevel _level
    ) external onlyOwner {
        emit CreateRoomAttempt(msg.sender, _name, _description, _price, _level);
        
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        
        require(owner() == msg.sender, "Caller is not the owner");
        
        rooms.push(Room({
            price: _price,
            level: _level,
            status: RoomStatus.AVAILABLE,
            name: _name,
            description: _description
        }));
        
        emit RoomCreated(rooms.length - 1, _name, _price, _level);
    }
    
    function bookRoom(uint256 _roomId, uint256 _numDays) external payable nonReentrant {
        if(_roomId >= rooms.length) revert RoomNotExists();
        if(_numDays == 0) revert InvalidDays();
        
        Room storage room = rooms[_roomId];
        if(room.status != RoomStatus.AVAILABLE) revert RoomNotAvailable();
        
        uint256 totalPrice = room.price * _numDays;
        if(msg.value < totalPrice) revert InvalidPayment();
        
        room.status = RoomStatus.BOOKED;
        
        if(msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit RoomBooked(_roomId, msg.sender, _numDays);
    }
    
    function getAvailableRooms() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        for(uint256 i = 0; i < rooms.length; i++) {
            if(rooms[i].status == RoomStatus.AVAILABLE) {
                count++;
            }
        }
        
        uint256[] memory availableRooms = new uint256[](count);
        uint256 index = 0;
        
        for(uint256 i = 0; i < rooms.length; i++) {
            if(rooms[i].status == RoomStatus.AVAILABLE) {
                availableRooms[index] = i;
                index++;
            }
        }
        
        return availableRooms;
    }

    function getRoom(uint256 _roomId) external view returns (Room memory) {
        if(_roomId >= rooms.length) revert RoomNotExists();
        return rooms[_roomId];
    }

    function getRoomCount() external view returns (uint256) {
        return rooms.length;
    }
} 