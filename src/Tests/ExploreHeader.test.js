import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExploreHeader from '@/app/pages/explore/components/ExploreHeader';

describe('ExploreHeader', () => {
  it('renders and switches tabs', () => {
    const setSelectedTab = jest.fn();

    render(<ExploreHeader selectedTab="facts" setSelectedTab={setSelectedTab} />);

    // Buttons present
    const factsBtn = screen.getByRole('tab', { name: /Cultural Facts/i });
    const profilesBtn = screen.getByRole('tab', { name: /Country Profiles/i });
    expect(factsBtn).toBeInTheDocument();
    expect(profilesBtn).toBeInTheDocument();

    // Click both
    fireEvent.click(factsBtn);
    expect(setSelectedTab).toHaveBeenCalledWith('facts');

    fireEvent.click(profilesBtn);
    expect(setSelectedTab).toHaveBeenCalledWith('profiles');
  });
});
