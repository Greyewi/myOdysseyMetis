import { useQuery } from '@tanstack/react-query';
import { getAllCachedPrices, getCachedPrice, TokenPrice } from '../services/priceCache';
import { WalletNetwork } from '../types/goals';

export function usePrices() {
  const { data: prices, isLoading, error } = useQuery<TokenPrice[]>({
    queryKey: ['prices'],
    queryFn: getAllCachedPrices,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  const getPrice = (network: WalletNetwork): number | undefined => {
    return prices?.find(p => p.network === network)?.price;
  };

  const getPriceInUSD = (amount: string, network: WalletNetwork): number | undefined => {
    const price = getPrice(network);
    if (!price) return undefined;
    return parseFloat(amount) * price;
  };

  return {
    prices,
    isLoading,
    error,
    getPrice,
    getPriceInUSD,
  };
}

export function usePrice(network: WalletNetwork) {
  const { data: price, isLoading, error } = useQuery<TokenPrice>({
    queryKey: ['price', network],
    queryFn: () => getCachedPrice(network),
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  return {
    price: price?.price,
    isLoading,
    error,
  };
} 