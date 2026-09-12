const { categorizeTransaction } = require('../services/categorizer');

describe('categorizeTransaction', () => {
  it('categorizes by keyword match', () => {
    expect(categorizeTransaction('Starbucks cappuccino')).toBe('food');
    expect(categorizeTransaction('Netflix subscription')).toBe('subscription');
    expect(categorizeTransaction('Uber ride to airport')).toBe('transport');
  });

  it('is case-insensitive', () => {
    expect(categorizeTransaction('NETFLIX')).toBe('subscription');
    expect(categorizeTransaction('starbucks')).toBe('food');
  });

  it('returns "other" when no keyword matches', () => {
    expect(categorizeTransaction('Random expense')).toBe('other');
  });

  it('returns "other" for empty or missing description', () => {
    expect(categorizeTransaction('')).toBe('other');
    expect(categorizeTransaction(undefined)).toBe('other');
  });
});