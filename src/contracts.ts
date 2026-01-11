export const ERC20_ABI = [
    "function decimals() view returns (uint8)",
    "function balanceOf(address owner) view returns (uint256)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

export const TIP20_FACTORY_ABI = [
    "function createToken(string name, string symbol, string currency, address quoteToken, address admin, bytes32 salt) returns (address)",
    "event TokenCreated(address indexed token, string name, string symbol, string currency, address quoteToken, address admin, bytes32 salt)"
];

export const STABLECOIN_DEX_ABI = [
    "function swapExactAmountIn(address tokenIn, address tokenOut, uint128 amountIn, uint128 minAmountOut) returns (uint128 amountOut)",
    "function quoteSwapExactAmountIn(address tokenIn, address tokenOut, uint128 amountIn) view returns (uint128 amountOut)",
    "function place(address token, uint128 amount, bool isBid, int16 tick) returns (uint128 orderId)"
];

export const FEE_MANAGER_ABI = [
    "function mintWithValidatorToken(address userToken, address validatorToken, uint256 amountValidatorToken, address to) returns (uint256 liquidity)"
];
