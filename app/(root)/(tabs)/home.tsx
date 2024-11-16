// HomeScreen.tsx

import React, { FC } from 'react';
import Swiper from 'react-native-swiper';
import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';

import CommitPage from '@/components/CommitPage';
import RecallPage from '@/components/RecallPage';

const StyledLinearGradient = styled(LinearGradient);

const HomeScreen: FC = () => {
  return (
    <Swiper
      showsPagination={true}
      removeClippedSubviews={false}
      loadMinimal
      loadMinimalSize={1}
      dotStyle={{ backgroundColor: 'rgba(0,0,0,.2)', width: 8, height: 8 }}
      activeDotStyle={{ backgroundColor: '#000', width: 8, height: 8 }}
      loop={false}
    >
      {/* Commit to Memory Page */}
      <StyledLinearGradient
        colors={['#00c6ff', '#0072ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 px-5"
      >
        <CommitPage />
      </StyledLinearGradient>

      {/* Recall Anything Page */}
      <StyledLinearGradient
        colors={['#ff9966', '#ff5e62']} // Orange gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 px-5"
      >
        <RecallPage />
      </StyledLinearGradient>
    </Swiper>
  );
};

export default HomeScreen;
