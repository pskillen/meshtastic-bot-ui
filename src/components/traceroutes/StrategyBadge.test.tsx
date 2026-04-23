import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrategyBadge } from './StrategyBadge';

describe('StrategyBadge', () => {
  it('renders em dash for null', () => {
    render(<StrategyBadge value={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders em dash for empty string', () => {
    render(<StrategyBadge value="" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders intra-zone label', () => {
    render(<StrategyBadge value="intra_zone" />);
    expect(screen.getByText('Intra-zone')).toBeInTheDocument();
  });

  it('renders manual target label', () => {
    render(<StrategyBadge value="manual" />);
    expect(screen.getByText('Manual target')).toBeInTheDocument();
  });

  it('renders Legacy for explicit legacy value', () => {
    render(<StrategyBadge value="legacy" />);
    expect(screen.getByText('Legacy')).toBeInTheDocument();
  });
});
