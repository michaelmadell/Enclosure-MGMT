import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CmcSidebar } from '../CmcSidebar';

describe('CmcSidebar', () => {
  const mockCmcs = [
    {
      id: '1',
      name: 'CMC 1',
      address: 'https://10.0.0.1',
      username: 'admin',
      password: 'pass',
      notes: 'Test CMC 1',
    },
    {
      id: '2',
      name: 'CMC 2',
      address: 'https://10.0.0.2',
      username: 'admin',
      password: 'pass',
      notes: 'Test CMC 2',
    },
  ];

  it('should render empty state when no CMCs', () => {
    render(
      <CmcSidebar
        cmcs={[]}
        selectedCmc={null}
        onSelectCmc={vi.fn()}
        onDeleteCmc={vi.fn()}
        onEditCmc={vi.fn()}
      />
    );

    expect(screen.getByText('No CMCs added yet')).toBeInTheDocument();
    expect(screen.getByText('Click "Add CMC" to get started')).toBeInTheDocument();
  });

  it('should render list of CMCs', () => {
    render(
      <CmcSidebar
        cmcs={mockCmcs}
        selectedCmc={null}
        onSelectCmc={vi.fn()}
        onDeleteCmc={vi.fn()}
        onEditCmc={vi.fn()}
      />
    );

    expect(screen.getByText('CMC 1')).toBeInTheDocument();
    expect(screen.getByText('CMC 2')).toBeInTheDocument();
  });

  it('should call onSelectCmc when CMC is clicked', () => {
    const onSelectCmc = vi.fn();
    
    render(
      <CmcSidebar
        cmcs={mockCmcs}
        selectedCmc={null}
        onSelectCmc={onSelectCmc}
        onDeleteCmc={vi.fn()}
        onEditCmc={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('CMC 1'));
    expect(onSelectCmc).toHaveBeenCalledWith(mockCmcs[0]);
  });

  it('should highlight selected CMC', () => {
    render(
      <CmcSidebar
        cmcs={mockCmcs}
        selectedCmc={mockCmcs[0]}
        onSelectCmc={vi.fn()}
        onDeleteCmc={vi.fn()}
        onEditCmc={vi.fn()}
      />
    );

    const selectedCard = screen.getByText('CMC 1').closest('div');
    expect(selectedCard).toHaveClass('ring-2');
  });
});