import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaleReportedTime } from './StaleReportedTime';

describe('StaleReportedTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('neutral variant does not apply stale border classes', () => {
    const { container } = render(
      <StaleReportedTime at={new Date('2026-06-01T12:00:00.000Z')} variant="neutral" />
    );
    const el = container.querySelector('time');
    expect(el).toBeTruthy();
    expect(el?.className).not.toContain('border-yellow');
    expect(el?.className).not.toContain('border-red');
  });

  it('stale variant applies warning styling in warning band', () => {
    const { container } = render(
      <StaleReportedTime at={new Date('2026-06-14T12:00:00.000Z')} variant="stale" />
    );
    const el = container.querySelector('time');
    expect(el?.className).toContain('border-yellow');
  });

  it('showDateTime adds en-GB style absolute segment', () => {
    render(<StaleReportedTime at={new Date('2026-06-15T10:00:00.000Z')} showDateTime />);
    const el = screen.getByText(/\(.*\)/);
    expect(el.textContent).toMatch(/\d{1,2}/);
  });
});
