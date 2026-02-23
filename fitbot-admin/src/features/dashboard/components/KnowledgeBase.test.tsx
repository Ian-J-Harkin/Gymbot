import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowledgeBase } from './KnowledgeBase';
import { knowledgeBaseApi, DocumentResponse } from '../services/knowledgeBaseApi';
import { configurationApi } from '../services/configurationApi';
import { ConfigurationResponse } from '../../../types/configuration';
import '@testing-library/jest-dom';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    FileText: () => <span data-testid="icon-file-text" />,
    Trash2: () => <span data-testid="icon-trash" />,
    Plus: () => <span data-testid="icon-plus" />,
    File: () => <span data-testid="icon-file" />,
    AlertCircle: () => <span data-testid="icon-alert" />,
    CheckCircle2: () => <span data-testid="icon-check" />,
    Loader2: () => <span data-testid="icon-loader" />,
    Database: () => <span data-testid="icon-database" />,
    Wand2: () => <span data-testid="icon-wand" />,
    Save: () => <span data-testid="icon-save" />,
    Info: () => <span data-testid="icon-info" />,
    ChevronDown: () => <span data-testid="icon-chevron-down" />,
    ChevronUp: () => <span data-testid="icon-chevron-up" />,
}));

// Mock API services
vi.mock('../services/knowledgeBaseApi');
vi.mock('../services/configurationApi');

describe('KnowledgeBase', () => {
    const mockConfig: Partial<ConfigurationResponse> = {
        faqText: 'Initial FAQ Content',
        widgetColor: '#000000',
        aiProvider: 'openai',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (configurationApi.getConfiguration as any).mockResolvedValue(mockConfig);
    });

    describe('Scenario A: No Documents Uploaded', () => {
        beforeEach(() => {
            (knowledgeBaseApi.getDocuments as any).mockResolvedValue([]);
        });

        it('renders with Quick Start section expanded and enabled', async () => {
            render(<KnowledgeBase />);

            // Wait for loading to finish
            await waitFor(() => {
                expect(screen.queryByText('Loading your knowledge base...')).not.toBeInTheDocument();
            });

            // Quick Start Header should be visible
            expect(screen.getByText('Quick Start Data')).toBeInTheDocument();

            // Since no docs, it should default to OPEN (expanded)
            const input = screen.getByPlaceholderText('Q: ... A: ...');
            expect(input).toBeVisible();
            expect(input).toBeEnabled();
            expect(input).toHaveValue('Initial FAQ Content');

            // Check header styling via class presence (optional, but good strictly)
            // We can check if the "Disabled (Files Uploaded)" badge is NOT present
            expect(screen.queryByText('Disabled (Files Uploaded)')).not.toBeInTheDocument();
        });

        it('allows editing and saving Quick Start Data', async () => {
            render(<KnowledgeBase />);
            await waitFor(() => expect(screen.getByPlaceholderText('Q: ... A: ...')).toBeVisible());

            const input = screen.getByPlaceholderText('Q: ... A: ...');
            fireEvent.change(input, { target: { value: 'Updated FAQ' } });
            expect(input).toHaveValue('Updated FAQ');

            const saveButton = screen.getByText('Save Text');
            expect(saveButton).toBeEnabled();

            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(configurationApi.updateConfiguration).toHaveBeenCalledWith(expect.objectContaining({
                    faqText: 'Updated FAQ'
                }));
            });

            expect(screen.getByText('Quick Start Data saved successfully!')).toBeInTheDocument();
        });
    });

    describe('Scenario B: Documents Exist', () => {
        const mockFiles: DocumentResponse[] = [
            {
                id: 'doc-1',
                fileName: 'gym-rules.pdf',
                fileType: 'pdf',
                createdAt: new Date().toISOString(),
                _count: { chunks: 5 }
            }
        ];

        beforeEach(() => {
            (knowledgeBaseApi.getDocuments as any).mockResolvedValue(mockFiles);
        });

        it('renders with Quick Start section collapsed and disabled', async () => {
            render(<KnowledgeBase />);

            await waitFor(() => {
                expect(screen.getByText('gym-rules.pdf')).toBeInTheDocument();
            });

            // Accordion header logic
            expect(screen.getByText('Disabled (Files Uploaded)')).toBeVisible();

            // Content should NOT be visible initially (collapsed by default when docs exist)
            expect(screen.queryByPlaceholderText('Q: ... A: ...')).not.toBeInTheDocument();
        });

        it('allows toggling to view disabled content', async () => {
            render(<KnowledgeBase />);
            await waitFor(() => expect(screen.getByText('gym-rules.pdf')).toBeInTheDocument());

            // Click header to expand
            const header = screen.getByText('Quick Start Data').closest('div');
            fireEvent.click(header!);

            // Now content should be visible but disabled
            await waitFor(() => {
                expect(screen.getByPlaceholderText('Q: ... A: ...')).toBeVisible();
            });

            const input = screen.getByPlaceholderText('Q: ... A: ...');
            expect(input).toBeDisabled();

            const saveButton = screen.getByText('Save Text');
            expect(saveButton).toBeDisabled();

            // Verify Info Banner
            expect(screen.getByText('Quick Start Disabled')).toBeVisible();
        });
    });
});
