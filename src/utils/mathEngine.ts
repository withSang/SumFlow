import { create, all, MathJsStatic } from 'mathjs';

// Create a custom mathjs instance
const math = create(all, {}) as MathJsStatic;

math.config({
  number: 'number',
  precision: 14,
});

// --- Custom Units Configuration ---
// Basic currencies (static rates for demo)
math.createUnit('USD', { aliases: ['dollar', 'dollars'] });
math.createUnit('EUR', { definition: '1.16 USD', aliases: ['euro', 'euros'] });
math.createUnit('GBP', { definition: '1.33 USD', aliases: ['pound', 'pounds'] });
math.createUnit('JPY', { definition: '0.0064 USD', aliases: ['yen'] });
math.createUnit('KRW', { definition: '0.00068 USD', aliases: ['won'] });
math.createUnit('CNY', { definition: '0.141 USD', aliases: ['yuan'] });
math.createUnit('BTC', { definition: '91539 USD', aliases: ['bitcoin'] });

// Ensure common time/mass/length aliases are supported if mathjs misses them
try {
    math.createUnit('lbs', { definition: '1 lb', aliases: ['lbs'] });
} catch (e) {
    // ignore
}

export interface LineResult {
  value: any;
  formatted: string;
  error?: string;
  variable?: string;
  isAssignment: boolean;
  scope?: Record<string, any>;
}

export const formatValue = (value: any): string => {
  if (value === undefined || value === null) return '';
  
  try {
    // Handle Units
    if (typeof value === 'object' && value.type === 'Unit') {
        return value.format({ precision: 4 });
    }
    
    // Handle Numbers
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { 
        maximumFractionDigits: 4 
      }).format(value);
    }

    // Handle Date (if we return date objects)
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return value.toString();
  } catch (e) {
    return String(value);
  }
};

// Currency Symbols Map
const CURRENCY_SYMBOLS: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY', // ¥ can be JPY or CNY, defaulting to JPY for now usually
    '₩': 'KRW',
    '₽': 'RUB',
    '₹': 'INR',
    '₿': 'BTC',
};

export const evaluateSheet = (lines: string[]): LineResult[] => {
  const scope: Record<string, any> = {};
  // Map formatted variable names (with spaces) to safe variable names (underscores)
  const varMap: Record<string, string> = {}; 
  
  // We need to keep track of the last valid result for 'prev'
  let lastResultValue: any = null;

  const results: LineResult[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      results.push({ value: null, formatted: '', isAssignment: false });
      return;
    }

    // 0. Setup Scope for this line
    // Add 'prev' and 'previous'
    if (lastResultValue !== null && lastResultValue !== undefined) {
        scope['prev'] = lastResultValue;
        scope['previous'] = lastResultValue;
    }
    
    // Add lineN variables (e.g. line1, line2)
    results.forEach((res, idx) => {
        if (res.value !== null && res.value !== undefined) {
            scope[`line${idx + 1}`] = res.value;
        }
    });

    // 1. Assignment with spaces allowed
    const assignmentMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_\s]*)\s*[:=]\s*(.*)$/);
    
    let expressionToEval = trimmed;
    let varNameOriginal = undefined;
    let varNameSafe = undefined;

    if (assignmentMatch) {
      varNameOriginal = assignmentMatch[1].trim();
      // Create safe name: replace spaces with underscores, remove non-alphanumeric if needed
      varNameSafe = varNameOriginal.replace(/\s+/g, '_');
      expressionToEval = assignmentMatch[2];
    }

    // 2. Pre-processing: Replace known variables with safe names
    // Sort by length descending to avoid partial replacement
    const knownVars = Object.keys(varMap).sort((a, b) => b.length - a.length);
    for (const v of knownVars) {
       // Use word boundary to match exact variable names
       // Escape regex special chars in variable name just in case
       const escapedV = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
       const regex = new RegExp(`\\b${escapedV}\\b`, 'g');
       expressionToEval = expressionToEval.replace(regex, varMap[v]);
    }

    // 3. Syntax Replacements
    
    // Handle Currency Symbols
    // Strategy: Replace symbol with unit code.
    // Issue: "$50" -> "USD 50" (mathjs expects "50 USD" or "USD 50"?)
    // mathjs supports "50 USD". It might also support "USD 50".
    // Let's normalize to "50 USD" for consistency if possible, but "USD 50" is often safer if it's valid.
    // Actually, mathjs `unit('50 USD')` works.
    // We need to handle:
    // "$50" -> "50 USD"
    // "50$" -> "50 USD"
    // "100 ₩" -> "100 KRW"
    // "₩100" -> "100 KRW"
    
    // Regex to find symbols
    for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
         const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         
         // 1. Symbol at start of number: $50 -> 50 USD
         // Matches: $50, $ 50, $50.5
         // We replace "$50" with "50 USD".
         // Use a regex that captures the number after the symbol
         const prefixRegex = new RegExp(`${escapedSymbol}\\s*([\\d\\.]+)`, 'g');
         expressionToEval = expressionToEval.replace(prefixRegex, `$1 ${code}`);
         
         // 2. Symbol at end of number: 50$ -> 50 USD
         const suffixRegex = new RegExp(`([\\d\\.]+)\\s*${escapedSymbol}`, 'g');
         expressionToEval = expressionToEval.replace(suffixRegex, `$1 ${code}`);
         
         // 3. Symbol standalone? Maybe just replace with code?
         // If we have "Price in $", we want "Price in USD"
         const standaloneRegex = new RegExp(`${escapedSymbol}`, 'g');
         expressionToEval = expressionToEval.replace(standaloneRegex, code);
    }

    // 'of' -> '*'
    expressionToEval = expressionToEval.replace(/\bof\b/gi, '*');
    
    // 'in', 'as' -> 'to' (Unit conversion)
    expressionToEval = expressionToEval.replace(/\s+as\s+/gi, ' to ');

    try {
      const compiled = math.compile(expressionToEval);
      const value = compiled.evaluate(scope);

      if (varNameOriginal && varNameSafe) {
        scope[varNameSafe] = value;
        varMap[varNameOriginal] = varNameSafe;
      }

      // Store result for next iterations
      lastResultValue = value;

      results.push({
        value,
        formatted: formatValue(value),
        variable: varNameOriginal, // Display original name
        isAssignment: !!varNameOriginal,
        scope: { ...scope } 
      });
    } catch (e: any) {
      results.push({
        value: null,
        formatted: '',
        error: 'Invalid expression', 
        isAssignment: false
      });
    }
  });

  return results;
};
