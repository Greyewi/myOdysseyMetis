import React from 'react';
import { Providers } from './providers';
import styled from 'styled-components';
import { Route, Routes } from 'react-router-dom';
import NewGoal from '../pages/NewGoal';
import MyGoals from '../pages/MyGoals';
import Header from './components/Header';
import GoalDetails from '../pages/GoalDetails';
import Profile from '../pages/Profile';
import HowItWorks from '../pages/HowItWorks';
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import GoalDifficulty from '@/pages/GoalDifficulty';

const StyledApp = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
`;

const AppContainer = styled.div`
  flex: 1;
`;

const App: React.FC = () => {
  return (
    <Providers>
       <ThemeProvider theme={theme}> 
       <CssBaseline />
        <StyledApp>
          <Header />
          <AppContainer>
            <Routes>
              <Route
                path="/"
                element={<NewGoal/>}
              />
              <Route
                path="/my-goals"
                element={<MyGoals/>}
              />
              <Route
                path="/goals/:id"
                element={<GoalDetails/>}
              />
              <Route
                path="/goals/:id/difficulty"
                element={<GoalDifficulty/>}
              />
              <Route
                path="/goals/:id/:tab"
                element={<GoalDetails/>}
              />
              <Route
                path="/profile"
                element={<Profile/>}
              />
              <Route
                path="/how-it-works"
                element={<HowItWorks/>}
              />
            </Routes>
          </AppContainer>
          {/* <Footer /> */}
        </StyledApp>
      </ThemeProvider>
    </Providers>
  );
};

export default App;
