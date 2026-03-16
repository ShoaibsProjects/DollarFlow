import { useAccount, useBalance, useReadContract } from 'wagmi';
import { USDC_ADDRESS, ERC20_ABI } from '@/config/wagmi';
import { formatUnits } from 'viem';

export function useWallet() {
  const { address, isConnected } = useAccount();

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const { data: usdcRaw, refetch: refetchUsdc } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const usdcBalance = usdcRaw ? formatUnits(usdcRaw, 6) : '0';

  return {
    address,
    isConnected,
    ethBalance: ethBalance?.formatted || '0',
    usdcBalance,
    refetchUsdc,
  };
}
