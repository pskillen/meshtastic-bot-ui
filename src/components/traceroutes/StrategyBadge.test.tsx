import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StrategyBadge } from './StrategyBadge';

describe('StrategyBadge', () => {
  it('renders Legacy for null', () => {
    render(<StrategyBadge value={null} />);
    expect(screen.getByText('Legacy')).toBeInTheDocument();
  });

  it('renders intra-zone label', () => {
    render(<StrategyBadge value="intra_zone" />);
    expect(screen.getByText('Intra-zone')).toBeInTheDocument();
  });
});
