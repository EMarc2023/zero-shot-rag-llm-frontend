import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from './ChatInterface';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom'; // Import this line

// Mock the fetch API
global.fetch = jest.fn();

// Helper function to simulate a successful fetch response
const mockFetchResponse = (data: any) => {
    (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(data),
        status: 200,
    });
};

// Helper function to simulate a failed fetch response
const mockFetchErrorResponse = (status: number, message: string) => {
    (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: () => Promise.resolve(`HTTP error! status: ${status}, message: ${message}`), // Changed to text
        status: status,
    });
};

// Mock URL.createObjectURL for the download chat test
global.URL.createObjectURL = jest.fn(() => 'blob-url');
global.URL.revokeObjectURL = jest.fn(); // Added revokeObjectURL mock

// Mock JSDOM's not implemented navigation
const mockJSDOMNavigation = () => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      assign: jest.fn(),
      href: ''
    },
  });
  jest.spyOn(window.location, 'assign').mockImplementation((newUrl) => {
    // Do nothing, or check the URL if needed
  });
};

describe('ChatInterface Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set up a basic mock for environment variable.
        process.env.REACT_APP_BACKEND_API_URL = 'http://localhost:8000';
        mockJSDOMNavigation(); // Apply the JSDOM mock before each test
    });

    it('should render the component', () => {
        render(<ChatInterface />);
        expect(screen.getByText('RAG-LLM chatbot UI')).toBeInTheDocument();
    });

    it('should update input values and display response', async () => {
        mockFetchResponse({ cleaned_response: 'This is a test response.' });
        render(<ChatInterface />);

        const keywordInput = screen.getByLabelText('RAG keyword(s):');
        const promptInput = screen.getByLabelText('User prompt:');
        const sendButton = screen.getByText('Send to chatbot');

        fireEvent.change(keywordInput, { target: { value: 'test keywords' } });
        fireEvent.change(promptInput, { target: { value: 'test prompt' } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(screen.getByText(/Bot:/i)).toBeInTheDocument();
            expect(screen.getByText('This is a test response.')).toBeInTheDocument();
        });
    });

    it('should handle fetch errors', async () => {
        mockFetchErrorResponse(500, 'Internal Server Error');
        render(<ChatInterface />);

        const keywordInput = screen.getByLabelText('RAG keyword(s):');
        const promptInput = screen.getByLabelText('User prompt:');
        const sendButton = screen.getByText('Send to chatbot');

        fireEvent.change(keywordInput, { target: { value: 'test keywords' } });
        fireEvent.change(promptInput, { target: { value: 'test prompt' } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(screen.getByText(/A JavaScript error occurred./i)).toBeInTheDocument(); // changed error message
        });
    });

    it('should clear forms and chat', () => {
        render(<ChatInterface />);
        const keywordInput = screen.getByLabelText('RAG keyword(s):');
        const promptInput = screen.getByLabelText('User prompt:');
        const methodSelect = screen.getByLabelText('Summarisation method:');
        const clearFormsButton = screen.getByText('Clear forms');
        const clearChatButton = screen.getByText('Clear chat');

        fireEvent.change(keywordInput, { target: { value: 'test keywords' } });
        fireEvent.change(promptInput, { target: { value: 'test prompt' } });
        fireEvent.change(methodSelect, { target: { value: 'truncate' } });

        fireEvent.click(clearFormsButton);
        expect(keywordInput).toHaveValue('');
        expect(promptInput).toHaveValue('');
        expect(methodSelect).toHaveValue('bart');

        // Added a message so we can check if Clear Chat works
        mockFetchResponse({ cleaned_response: 'Test response' });
        const sendButton = screen.getByText('Send to chatbot');
        fireEvent.change(keywordInput, { target: { value: 'test' } });
        fireEvent.change(promptInput, { target: { value: 'test' } });
        fireEvent.click(sendButton);
        waitFor(() => {
             expect(screen.getByText(/Bot:/i)).toBeInTheDocument();
        })

        fireEvent.click(clearChatButton);
        expect(screen.queryByText(/Bot:/i)).toBeNull();
    });

    it('should download chat history', async () => {
        render(<ChatInterface />);
        const keywordInput = screen.getByLabelText('RAG keyword(s):');
        const promptInput = screen.getByLabelText('User prompt:');
        const sendButton = screen.getByText('Send to chatbot');
        const downloadChatButton = screen.getByText('Download chat');

        // Populate chat history
        fireEvent.change(keywordInput, { target: { value: 'test keywords' } });
        fireEvent.change(promptInput, { target: { value: 'test prompt' } });
        fireEvent.click(sendButton);
        mockFetchResponse({ cleaned_response: 'bot response' });
        await waitFor(() => {}); // wait for the bot response

        // Simulate download button click
        fireEvent.click(downloadChatButton);

        // Check if createObjectURL was called
        expect(URL.createObjectURL).toHaveBeenCalled();
        
    });
});