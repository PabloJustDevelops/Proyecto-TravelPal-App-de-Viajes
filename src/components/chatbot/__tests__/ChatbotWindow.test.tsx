
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatbotWindow from '../ChatbotWindow'

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ content: 'Respuesta del bot' }),
  })
) as jest.Mock;

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('ChatbotWindow', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders correctly', () => {
    render(<ChatbotWindow onClose={() => {}} />);
    expect(screen.getByText('Asistente de Viajes')).toBeInTheDocument();
    expect(screen.getByText('En línea')).toBeInTheDocument();
  });

  it('sends a message and displays response', async () => {
    render(<ChatbotWindow onClose={() => {}} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByLabelText('Enviar mensaje');

    fireEvent.change(input, { target: { value: 'Hola bot' } });
    fireEvent.click(sendButton);

    // Verify user message appears
    expect(await screen.findByText('Hola bot')).toBeInTheDocument();

    // Verify fetch call
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('Hola bot'),
    }));

    // Verify bot response appears
    expect(await screen.findByText('Respuesta del bot')).toBeInTheDocument();
  });

  it('handles errors', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Error simulado' }),
      })
    );

    render(<ChatbotWindow onClose={() => {}} />);
    
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    const sendButton = screen.getByLabelText('Enviar mensaje');

    fireEvent.change(input, { target: { value: 'Error test' } });
    fireEvent.click(sendButton);

    expect(await screen.findByText('Error simulado')).toBeInTheDocument();
  });
});
