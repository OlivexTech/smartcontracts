// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OliveXToken is ERC20, ERC20Burnable, Pausable, Ownable {
    uint256 constant DAY_IN_SECONDS = 86400;

    uint256 public maxSupply = 1000000000 * 10 ** decimals(); // max supply 1 billion
    uint256 public minSupply = 21000000 * 10 ** decimals(); // min supply 21 million
    uint256 public stopDate = getDateTime(1988150400); // 1 January 2033 00:00:00

	address private _destroyAddress = address(0x0000000000000000000000000000000000000001);

    struct User {
        uint256 time;
        uint256 prev_balance;
    }

    struct Pool {
        uint256 time;
        uint256 whitelist;
        uint256 circulate;
    }

    mapping(address => User) private userLast;
	mapping(address => uint256) public userLastBalance;
	mapping(address => bool) private whitelist;

    Pool public ovePool;

    constructor() ERC20("OliveX Token", "OVE") {
        whitelist[msg.sender] = true;

        _mint(msg.sender, maxSupply);
        
        ovePool = Pool({
            time: getDateTime(block.timestamp),
            whitelist: maxSupply,
            circulate: 0
        });
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function resetStopDate(uint256 dateTime) public onlyOwner {
		require(dateTime > block.timestamp, "ERC20: invalid stoptime");
        
        stopDate = getDateTime(dateTime);
    }

    function addWhitelist(address account) public onlyOwner {
		require(!whitelist[account], "ERC20: whitelist exist");
        
        whitelist[account] = true;

        if(balanceOf(account) > 0) {
            uint256 diffDay = getDateDiff(ovePool.time);

            ovePool.time = getDateTime(block.timestamp);
            ovePool.circulate = calcBalance(ovePool.circulate, diffDay) - balanceMask(account);
            ovePool.whitelist += balanceMask(account);
        }
    }

    function removeWhitelist(address account) public onlyOwner {
		require(whitelist[account], "ERC20: whitelist not exist");

        whitelist[account] = false;

        if(balanceOf(account) > 0) {
            uint256 diffDay = getDateDiff(ovePool.time);

            ovePool.time = getDateTime(block.timestamp);
            ovePool.circulate = calcBalance(ovePool.circulate, diffDay) + super.balanceOf(account);
            ovePool.whitelist -= super.balanceOf(account);
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    function getDateDiff(uint256 start) public view returns (uint256){
        uint256 end = getDateTime(block.timestamp);
        
        if(end > stopDate) {
            end = stopDate;
        } else if (start > end) {
            return 0;
        }

        return (end - start) / DAY_IN_SECONDS;
    }

    function getDateTime(uint256 dateTime) public pure returns (uint256) {
        return dateTime / DAY_IN_SECONDS * DAY_IN_SECONDS;
    }

    function calcBalance(uint256 amount, uint256 diffDay) public pure returns (uint256) {
        uint256 calc = amount;

        if(calc > 0) {
            for (uint256 i = 0; i < diffDay; i++) {
                calc = calc * 999 / 1000;
            }
        }

        return calc;
    }

	function updateAccount(address account) private {
        if(!whitelist[account]) {
            uint256 diffQty = super.balanceOf(account) - balanceMask(account);

            if(diffQty > 0) {
                super._transfer(account, _destroyAddress, diffQty);
            }
        }

        userLast[account].time = getDateTime(block.timestamp);
        userLast[account].prev_balance = balanceOf(account);        
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        require(from != address(0), "ERC20: from zero address");
		require(to != from, "ERC20: same address");
		require(amount>0, "ERC20: zero amount");
		require(balanceOf(from) >= amount, "ERC20: not enough amount");

        updateAccount(from);
        updateAccount(to);

        super._transfer(from, to, amount);

        updateTotalSupply(from, to, amount);

        emit Transfer(from, to, amount);
    }

	function updateTotalSupply(address from, address to, uint256 amount) private {
        uint256 diffDay = getDateDiff(ovePool.time);
        uint256 currentSupply = 0;

        ovePool.time = getDateTime(block.timestamp);

        if(ovePool.circulate > 0) {
            currentSupply = calcBalance(ovePool.circulate, diffDay);
        }

        if(whitelist[from] && !whitelist[to]) {
            ovePool.circulate = currentSupply + amount;
            ovePool.whitelist -= amount;
        }

        if(!whitelist[from] && whitelist[to]) {
            ovePool.circulate = currentSupply - amount;
            ovePool.whitelist += amount;
        }
    }

    function balanceMask(address account) private view returns (uint256) {
        uint256 diffDay = getDateDiff(userLast[account].time);

        if(super.balanceOf(account) == 0) {
            return 0;
        }

        if(diffDay > 0) {
            return calcBalance(super.balanceOf(account), diffDay);
        } else {
            return super.balanceOf(account);
        }
    }

    function balanceOf(address account) public view override returns (uint256) {
        if(whitelist[account]) {
            return super.balanceOf(account);
        } else {
            return balanceMask(account);
        }
    }

    function totalSupply() public view override returns (uint256) {
        return super.totalSupply() - super.balanceOf(_destroyAddress);
    }

}
