import React from 'react';
import { render, screen } from '@testing-library/react';
import SelectedCountryPanel from '@/app/pages/explore/components/SelectedCountryPanel';

const baseCountry = {
  name: 'Testland',
  region: 'Test Region',
  countryFlag: '/flag.png',
  coatOfArms: '/coa.png',
  population: '1,000,000',
  timezone: 'UTC+1',
  currency: 'TST',
  languages: ['Lang1', 'Lang2']
};

describe('SelectedCountryPanel', () => {
  it('returns null when no country', () => {
    const { container } = render(<SelectedCountryPanel country={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders country info without coat of arms', () => {
    const country = { ...baseCountry };
    delete country.coatOfArms;

    render(<SelectedCountryPanel country={country} />);

    expect(screen.getByAltText('Testland flag')).toBeInTheDocument();
    expect(screen.queryByAltText('Testland coat of arms')).not.toBeInTheDocument();
    expect(screen.getByText('Testland')).toBeInTheDocument();
    expect(screen.getByText('Test Region')).toBeInTheDocument();
    expect(screen.getByText('Population:')).toBeInTheDocument();
    expect(screen.getByText(country.population)).toBeInTheDocument();
  });

  it('renders coat of arms when present and language pills', () => {
    render(<SelectedCountryPanel country={baseCountry} />);

    expect(screen.getByAltText('Testland coat of arms')).toBeInTheDocument();
    expect(screen.getByText('Lang1')).toBeInTheDocument();
    expect(screen.getByText('Lang2')).toBeInTheDocument();
  });
});
