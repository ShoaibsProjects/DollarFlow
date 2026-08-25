import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi';
import { USDC_ADDRESS, ERC20_ABI } from '@/shared/config/wagmi';
import { formatUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const ethBalanceQuery = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address },
  });

  const { data: usdcRaw, refetch: refetchUsdc } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address },
  });

  const usdcBalance = usdcRaw && typeof usdcRaw === 'bigint' ? formatUnits(usdcRaw, 6) : '0';

  const formattedEth = ethBalanceQuery.data?.value !== undefined
    ? formatUnits(ethBalanceQuery.data.value, 18)
    : '0';

  const ensureBaseSepolia = async () => {
    if (chainId !== baseSepolia.id) {
      try {
        await switchChain({ chainId: baseSepolia.id });
      } catch {
        // User rejected
      }
    }
  };

  return {
    address,
    isConnected,
    chainId,
    ethBalance: formattedEth,
    usdcBalance,
    refetchUsdc,
    ensureBaseSepolia,
    isCorrectChain: chainId === baseSepolia.id,
  };
}