import { fetchGoals, filterAndPaginateGoals } from './api/goals';
import { GoalCategory } from './types/goals';
import { GoalsClient } from './components/GoalsClient';
import Hero from './components/Hero';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

interface SearchParams {
  page?: string;
  sort?: 'deadline_asc' | 'deadline_desc';
  category?: GoalCategory;
  network?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Fetch goals on the server
  const allGoals = await fetchGoals();

  // Apply initial filters and pagination on the server
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || 'deadline_desc';
  const category = searchParams.category;
  const network = searchParams.network;

  const { goals, totalPages } = filterAndPaginateGoals(allGoals, {
    page,
    sort,
    category: category || '',
    network: network || '',
    itemsPerPage: 10
  });

  return (
    <>
      <Hero />
      <GoalsClient 
        initialGoals={allGoals}
        initialFilteredGoals={goals}
        initialPage={page}
        initialSort={sort}
        initialCategory={category || ''}
        initialNetwork={network || ''}
        initialTotalPages={totalPages}
      />
    </>
  );
}
