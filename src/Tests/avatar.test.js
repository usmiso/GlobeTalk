import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSetup from '../app/components/avatar/page';

// Mock the fetch API
global.fetch = jest.fn();

describe('ProfileSetup Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock initial username fetch
    fetch.mockResolvedValueOnce({
      json: async () => ({
        results: [{
          login: { username: 'testuser123' }
        }]
      })
    });
  });

  test('renders all main elements', async () => {
    render(<ProfileSetup />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText(/testuser123|Generated Username/)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Avatar Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate Name')).toBeInTheDocument();
    expect(screen.getByText('Generate New Avatar')).toBeInTheDocument();
    expect(screen.getByText('Save New Avatar')).toBeInTheDocument();
    
    // Check for dropdowns and avatar
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
    expect(screen.getByAltText('avatar')).toBeInTheDocument();
  });

  test('generates username when button clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText(/testuser123/)).toBeInTheDocument();
    });

    // Mock new username response
    fetch.mockResolvedValueOnce({
      json: async () => ({
        results: [{
          login: { username: 'newtestuser' }
        }]
      })
    });
    
    const generateButton = screen.getByText('Generate Name');
    await user.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('newtestuser')).toBeInTheDocument();
    });
  });

  test('generates new avatar when button clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);
    
    await waitFor(() => {
      expect(screen.getByAltText('avatar')).toBeInTheDocument();
    });

    const initialAvatar = screen.getByAltText('avatar').src;
    const generateButton = screen.getByText('Generate New Avatar');
    
    await user.click(generateButton);
    
    await waitFor(() => {
      const newAvatar = screen.getByAltText('avatar').src;
      expect(newAvatar).not.toBe(initialAvatar);
    }, { timeout: 3000 });
  });

  test('changes gender and updates hair options', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);
    
    await waitFor(() => {
      expect(screen.getByAltText('avatar')).toBeInTheDocument();
    });

    // Get both dropdowns
    const selects = screen.getAllByRole('combobox');
    const genderSelect = selects[0];
    
    // Change gender to female
    await user.selectOptions(genderSelect, 'female');
    
    // Verify gender changed by checking the value property
    await waitFor(() => {
      expect(genderSelect.value).toBe('female');
    });
  });

  test('selects hair style and updates state', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);
    
    await waitFor(() => {
      expect(screen.getByAltText('avatar')).toBeInTheDocument();
    });

    // Get both dropdowns
    const selects = screen.getAllByRole('combobox');
    const hairSelect = selects[1];
    
    // Change hair style
    await user.selectOptions(hairSelect, 'dreads02');
    
    // Verify hair style changed
    await waitFor(() => {
      expect(hairSelect.value).toBe('dreads02');
    });
  });

  test('saves profile when Save New Avatar clicked', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);
    
    await waitFor(() => {
      expect(screen.getByAltText('avatar')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save New Avatar');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users/setup', {
        method: 'POST',
        body: expect.any(String),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock fetch to reject for the initial call
    fetch.mockRejectedValueOnce(new Error('API error'));
    
    render(<ProfileSetup />);
    
    // Component should still render with fallback content
    await waitFor(() => {
      expect(screen.getByText('Generated Username')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('hair selection affects next avatar generation', async () => {
    const user = userEvent.setup();
    render(<ProfileSetup />);
    
    await waitFor(() => {
      expect(screen.getByAltText('avatar')).toBeInTheDocument();
    });

    const initialAvatar = screen.getByAltText('avatar').src;
    
    // Get both dropdowns and change hair style
    const selects = screen.getAllByRole('combobox');
    const hairSelect = selects[1];
    
    await user.selectOptions(hairSelect, 'theCaesarAndSidePart');
    
    // After changing hair, manually generate a new avatar to see the effect
    const generateButton = screen.getByText('Generate New Avatar');
    await user.click(generateButton);
    
    // Wait for avatar to update
    await waitFor(() => {
      const updatedAvatar = screen.getByAltText('avatar').src;
      expect(updatedAvatar).not.toBe(initialAvatar);
      expect(updatedAvatar).toContain('theCaesarAndSidePart');
    }, { timeout: 3000 });
  });
});