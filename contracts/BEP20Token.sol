// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BEP20Token is ERC20, ERC20Burnable, Pausable, Ownable {
    constructor() ERC20("BEP20Token", "BEP") {
        uint256 mintAmount = 10000000 * 10 ** decimals();

        _mint(msg.sender, mintAmount);
    }

    event EnabledAutoSwapAndLiquify();
    event DisabledAutoSwapAndLiquify();
    event MinTokensBeforeSwapUpdated(
        uint256 previousMinSwap,
        uint256 currentMinSwap
    );
    event SetRouterAddress(address _routerAddress);
    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 ethReceived,
        uint256 tokensIntoLiqudity
    );

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    //to recieve ETH from pancakeSwapV2Router when swaping
    receive() external payable {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function Withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Failed to send ETH");
    }
}
