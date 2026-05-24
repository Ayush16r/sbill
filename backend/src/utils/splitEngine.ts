export type SplitType = 'EQUAL' | 'PERCENTAGE' | 'CUSTOM' | 'SHARES';

export interface SplitResult {
  userId: string;
  amount: number;
  percentage: number;
  shares?: number;
}

/**
 * Calculates expense splits for group members based on SplitType and inputs.
 * Ensures total splits perfectly sum to total expense amount using a residual rounding adjustment.
 */
export function calculateSplits(
  total: number,
  members: string[],
  type: SplitType,
  customValues?: Record<string, number> // amounts, %, or shares depending on SplitType
): SplitResult[] {
  if (members.length === 0) {
    throw new Error('Split must include at least one member');
  }

  if (total <= 0) {
    throw new Error('Total must be greater than zero');
  }

  switch (type) {
    case 'EQUAL': {
      const equal = +(total / members.length).toFixed(2);
      // To prevent fractional losses (e.g. $10.00 split 3 ways), add the remainder to the first member
      const results = members.map((id, i) => ({
        userId: id,
        amount: equal,
        percentage: +(100 / members.length).toFixed(2),
      }));
      
      const calculatedSum = results.reduce((sum, item) => sum + item.amount, 0);
      const difference = +(total - calculatedSum).toFixed(2);
      
      if (difference !== 0 && results.length > 0) {
        results[0].amount = +(results[0].amount + difference).toFixed(2);
      }
      return results;
    }

    case 'PERCENTAGE': {
      if (!customValues) {
        throw new Error('Percentage split requires individual percentage values');
      }
      // Validate percentages sum up to 100%
      const percentageSum = Object.values(customValues).reduce((a, b) => a + b, 0);
      if (Math.abs(percentageSum - 100) > 1) {
        throw new Error(`Percentages must sum to 100 (got ${percentageSum.toFixed(1)})`);
      }

      const results = members.map(id => {
        const pct = customValues[id] || 0;
        return {
          userId: id,
          amount: +(total * (pct / 100)).toFixed(2),
          percentage: pct,
        };
      });

      const calculatedSum = results.reduce((sum, item) => sum + item.amount, 0);
      const difference = +(total - calculatedSum).toFixed(2);
      if (difference !== 0 && results.length > 0) {
        // Adjust the person with highest percentage to absorb standard decimal rounding
        results[0].amount = +(results[0].amount + difference).toFixed(2);
      }
      return results;
    }

    case 'CUSTOM': {
      if (!customValues) {
        throw new Error('Custom split requires individual amount values');
      }
      const customTotal = Object.values(customValues).reduce((a, b) => a + b, 0);
      if (Math.abs(customTotal - total) > 2) {
        throw new Error(`Custom amounts must sum to total expense: ${total} (got ${customTotal.toFixed(2)})`);
      }

      return members.map(id => {
        const amt = customValues[id] || 0;
        return {
          userId: id,
          amount: amt,
          percentage: total > 0 ? +(amt / total * 100).toFixed(2) : 0,
        };
      });
    }

    case 'SHARES': {
      if (!customValues) {
        throw new Error('Shares split requires individual share counts');
      }
      const totalShares = Object.values(customValues).reduce((a, b) => a + b, 0);
      if (totalShares <= 0) {
        throw new Error('Total shares count must be greater than zero');
      }

      const results = members.map(id => {
        const shares = customValues[id] || 0;
        return {
          userId: id,
          amount: +(total * (shares / totalShares)).toFixed(2),
          percentage: +(shares / totalShares * 100).toFixed(2),
          shares: shares,
        };
      });

      const calculatedSum = results.reduce((sum, item) => sum + item.amount, 0);
      const difference = +(total - calculatedSum).toFixed(2);
      if (difference !== 0 && results.length > 0) {
        results[0].amount = +(results[0].amount + difference).toFixed(2);
      }
      return results;
    }

    default:
      throw new Error(`Invalid split type: ${type}`);
  }
}
