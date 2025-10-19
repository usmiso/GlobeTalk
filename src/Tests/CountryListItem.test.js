import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CountryListItem from '@/app/pages/explore/components/CountryListItem';

describe('CountryListItem', () => {
  const country = { name: 'Testland', region: 'TR', countryFlag: '/flag.png' };

  it('renders and is clickable', () => {
    const onClick = jest.fn();
    render(<CountryListItem country={country} isSelected={false} onClick={onClick} />);

    expect(screen.getByText('Testland')).toBeInTheDocument();
    const item = screen.getByRole('img', { name: /Testland flag/i }).closest('div');
    fireEvent.click(item);
    expect(onClick).toHaveBeenCalled();
  });

  it('applies selected styles when isSelected', () => {
    const { container } = render(<CountryListItem country={country} isSelected={true} onClick={() => {}} />);
    expect(container.firstChild).toHaveClass('bg-muted');
  });
});
