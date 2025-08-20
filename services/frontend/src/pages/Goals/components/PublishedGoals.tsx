import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { GoalWithWallet, GoalCategory, WalletNetwork } from '../../../types/goals';
import { useGoals } from '../../../provider/goalProvider';
import { Select, MenuItem, TextField } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { getAddress } from 'ethers';
import * as ethers from 'ethers';
import GoalCard from '../../../app/components/GoalCard';

const Container = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #1a1a1a;
  text-align: center;
  font-weight: 700;
  background: linear-gradient(45deg, #2196F3, #00BCD4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`;

const CopyNotification = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(45deg, #2196F3, #00BCD4);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.2rem;
`;

const ErrorAlert = styled.div`
  background: linear-gradient(45deg, #ff5252, #ff1744);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(255, 82, 82, 0.2);
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
`;

interface SortOption {
  field: 'balance' | 'deadline' | 'createdAt';
  direction: 'asc' | 'desc';
}

const PublishedGoals: React.FC = () => {
  const navigate = useNavigate();
  const { allGoals, convertBalanceToUSD, getTotalBalanceInUSD, tokenPrices } = useGoals();
  const [goals, setGoals] = useState<GoalWithWallet[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);
  const [usdBalances, setUsdBalances] = useState<{[goalId: string]: string}>({});
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string>('');
  
  const [filters, setFilters] = useState({
    category: '',
    network: '',
    userAddress: ''
  });

  const [sorting] = useState<SortOption>({
    field: 'createdAt',
    direction: 'desc'
  });

  // Get unique categories from current goals
  const uniqueCategories = React.useMemo(() => {
    if (!allGoals) return [];
    const categories = new Set(allGoals.map(goal => goal.category));
    return Array.from(categories);
  }, [allGoals]);

  // Get unique networks from current goals
  const uniqueNetworks = React.useMemo(() => {
    if (!allGoals) return [];
    const networks = new Set(
      allGoals.flatMap(goal => 
        goal.wallets?.map(wallet => wallet.network) || 
        (goal.wallet?.network ? [goal.wallet.network] : [])
      )
    );
    return Array.from(networks);
  }, [allGoals]);

  useEffect(() => {
    if (allGoals) {
      const filteredGoals = allGoals.filter(goal => {
        const matchesSearch = !filters.userAddress || 
          goal.title.toLowerCase().includes(filters.userAddress.toLowerCase()) ||
          goal.description.toLowerCase().includes(filters.userAddress.toLowerCase());
          
        const matchesCategory = !filters.category || goal.category === filters.category;
        
        // Check if any wallet in the goal matches the selected network
        const matchesNetwork = !filters.network || 
          goal.wallet?.network === filters.network || 
          (goal.wallets && goal.wallets.some(wallet => wallet.network === filters.network));
        
        return matchesSearch && matchesCategory && matchesNetwork;
      });
      
      setGoals(filteredGoals);
      
      // Calculate total USD values for all wallets in each goal
      const balances: {[goalId: string]: string} = {};
      
      filteredGoals.forEach(goal => {
        // Check if goal has wallets array
        if (goal.wallets && goal.wallets.length > 0) {
          // Calculate total USD value across all wallets for this goal
          const totalUsd = getTotalBalanceInUSD(goal.wallets);
          balances[goal.id] = totalUsd.toFixed(2);
        } else if (goal.wallet?.lastBalance && goal.wallet?.network) {
          // Fallback to single wallet if wallets array is not available
          const usdValue = convertBalanceToUSD(goal.wallet.lastBalance, goal.wallet.network);
          balances[goal.id] = usdValue.toFixed(2);
        } else {
          balances[goal.id] = "0.00";
        }
      });
      
      setUsdBalances(balances);
    }
  }, [allGoals, filters.userAddress, filters.category, filters.network, convertBalanceToUSD, getTotalBalanceInUSD, tokenPrices]);

  const formatWalletAddress = (publicKey: string) => {
    if (!publicKey || publicKey.length <= 10) return publicKey;
    
    try {
      // Convert public key to address
      const cleanPublicKey = publicKey.startsWith('04') ? publicKey.slice(2) : publicKey;
      const publicKeyHash = ethers.keccak256('0x' + cleanPublicKey);
      const address = '0x' + publicKeyHash.slice(-40);
      
      // Convert to checksum address
      const checksumAddress = getAddress(address);
      // Show 8 characters from start and 6 from end
      return `${checksumAddress.slice(0, 8)}...${checksumAddress.slice(-6)}`;
    } catch (e) {
      // If the address is invalid, return the original formatted address
      return `${publicKey.slice(0, 8)}...${publicKey.slice(-6)}`;
    }
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setShowCopyNotification(true);
      
      // Hide the notification after 2 seconds
      setTimeout(() => {
        setShowCopyNotification(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleViewGoalDetails = (goalId: number) => {
    navigate(`/published-goal/${goalId}`);
  };

  if (loading) {
    return <Loading>Loading goals...</Loading>;
  }

  // Sort goals based on current sort option
  const sortedGoals = [...goals].sort((a, b) => {
    if (sorting.field === 'deadline') {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return sorting.direction === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sorting.field === 'balance') {
      const balanceA = parseFloat(usdBalances[a.id] || '0');
      const balanceB = parseFloat(usdBalances[b.id] || '0');
      return sorting.direction === 'asc' ? balanceA - balanceB : balanceB - balanceA;
    }
    
    // Default to deadline sorting instead of createdAt
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    return sorting.direction === 'asc' ? dateA - dateB : dateB - dateA;
  });

  return (
    <Container>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      
      <FiltersContainer>
        <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            labelId="category-label"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            label="Category"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
              },
              '& .MuiSelect-select': {
                padding: '8px 14px',
              }
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {uniqueCategories.map(category => (
              <MenuItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: 1, minWidth: 200 }}>
          <InputLabel id="network-label">Network</InputLabel>
          <Select
            labelId="network-label"
            value={filters.network}
            onChange={(e) => handleFilterChange('network', e.target.value)}
            label="Network"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
              },
              '& .MuiSelect-select': {
                padding: '8px 14px',
              }
            }}
          >
            <MenuItem value="">All Networks</MenuItem>
            {uniqueNetworks.map(network => (
              <MenuItem key={network} value={network}>{network}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </FiltersContainer>

      <CardsGrid>
        {sortedGoals.map(goal => {
          const userAddress = goal.user?.address || '';
          const formattedAddress = formatWalletAddress(userAddress);
          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              usdBalance={usdBalances[goal.id] || '0.00'}
              formattedAddress={formattedAddress}
              copiedAddress={copiedAddress}
              onCopy={copyToClipboard}
              onViewDetails={handleViewGoalDetails}
            />
          );
        })}
      </CardsGrid>
      
      {showCopyNotification && (
        <CopyNotification>
          Address copied to clipboard!
        </CopyNotification>
      )}
    </Container>
  );
};

export default PublishedGoals;