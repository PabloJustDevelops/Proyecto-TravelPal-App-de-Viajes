
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '../Calendar';
import { format } from 'date-fns';

// Mock Heroicons to avoid rendering issues in tests
jest.mock('@heroicons/react/24/outline', () => ({
  ChevronLeftIcon: () => <div data-testid="chevron-left" />,
  ChevronRightIcon: () => <div data-testid="chevron-right" />,
  PlusIcon: () => <div data-testid="plus-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
}));

describe('Calendar Component', () => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const mockEvents = [
    {
      id: '1',
      title: 'Test Event',
      date: todayStr,
      type: 'booking' as const,
      color: 'bg-blue-500',
      description: 'Test Description',
      icon: <div data-testid="event-icon" />
    }
  ];

  it('renders correctly', () => {
    render(<Calendar events={mockEvents} />);
    expect(screen.getByText(/Test Event/i)).toBeInTheDocument();
    expect(screen.getByTestId('event-icon')).toBeInTheDocument();
  });

  it('calls onEventClick when an event is clicked', () => {
    const handleEventClick = jest.fn();
    render(<Calendar events={mockEvents} onEventClick={handleEventClick} />);
    
    const eventElement = screen.getByText(/Test Event/i);
    fireEvent.click(eventElement);
    
    expect(handleEventClick).toHaveBeenCalledTimes(1);
    expect(handleEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('shows delete option on right click', () => {
    const handleDeleteEvent = jest.fn();
    render(<Calendar events={mockEvents} onDeleteEvent={handleDeleteEvent} />);
    
    const eventElement = screen.getByText(/Test Event/i).closest('div');
    fireEvent.contextMenu(eventElement!);
    
    const deleteButton = screen.getByText('Eliminar');
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.click(deleteButton);
    expect(handleDeleteEvent).toHaveBeenCalledTimes(1);
    expect(handleDeleteEvent).toHaveBeenCalledWith(mockEvents[0]);
  });
  
  it('calls onAddEvent on double click in month view', () => {
    const handleAddEvent = jest.fn();
    render(<Calendar onAddEvent={handleAddEvent} />);
    
    // Get the cell for today
    const todayCell = screen.getByText(today.getDate().toString()).closest('div')?.parentElement;
    fireEvent.doubleClick(todayCell!);
    
    expect(handleAddEvent).toHaveBeenCalledTimes(1);
  });
});
