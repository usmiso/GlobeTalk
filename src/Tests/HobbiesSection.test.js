/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import HobbiesSection from '../app/pages/userprofile/components/HobbiesSection';

describe('HobbiesSection', () => {
  function setup(overrides = {}) {
    const props = {
      hobbies: ['Reading'],
      setHobbies: jest.fn(),
      allHobbies: ['Reading', 'Music', 'Hiking'],
      customHobby: '',
      setCustomHobby: jest.fn(),
      ...overrides,
    };
    render(<HobbiesSection {...props} />);
    return props;
  }

  test('adds hobby from select when not already present', () => {
    const props = setup();
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Music' } });
    expect(props.setHobbies).toHaveBeenCalledWith(['Reading', 'Music']);
  });

  test('adds custom hobby on Enter and clears input', () => {
    const props = setup({ customHobby: 'Chess' });
    const input = screen.getByPlaceholderText(/type your own/i);
    // simulate typing is handled by parent via setCustomHobby, we only trigger Enter behavior
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(props.setHobbies).toHaveBeenCalledWith(['Reading', 'Chess']);
    expect(props.setCustomHobby).toHaveBeenCalledWith('');
  });

  test('removes hobby when clicking ×', () => {
    const props = setup();
    // the remove button is the × inside the chip
    const removeBtn = screen.getByText('✕');
    fireEvent.click(removeBtn);
    expect(props.setHobbies).toHaveBeenCalledWith([]);
  });
});
