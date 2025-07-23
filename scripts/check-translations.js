#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const LOCALES_DIR = path.join(SRC_DIR, 'locales');
const LANGUAGES = ['en', 'pt'];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

// Load translation files
function loadTranslations() {
  const translations = {};
  
  for (const lang of LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      translations[lang] = JSON.parse(content);
      log(colors.green, `✓ Loaded ${lang}.json`);
    } catch (error) {
      log(colors.red, `✗ Failed to load ${lang}.json:`, error.message);
      translations[lang] = {};
    }
  }
  
  return translations;
}

// Extract all translation keys from an object (handles nested objects)
function extractKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

// Find all t('...') calls in a file
function findTranslationCalls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to match t('key') or t("key") calls
    const regex = /\bt\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        key: match[1],
        line: content.substring(0, match.index).split('\n').length,
        context: getLineContext(content, match.index)
      });
    }
    
    return matches;
  } catch (error) {
    log(colors.red, `Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Get line context for better debugging
function getLineContext(content, index) {
  const lines = content.substring(0, index).split('\n');
  const currentLine = lines[lines.length - 1];
  const nextPart = content.substring(index).split('\n')[0];
  return (currentLine + nextPart).trim();
}

// Recursively find all files with specific extensions
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...findFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    log(colors.red, `Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Check if a key exists in nested object
function hasKey(obj, key) {
  const parts = key.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return false;
    }
  }
  
  return true;
}

// Get value from nested object
function getValue(obj, key) {
  const parts = key.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// Main function
function checkTranslations() {
  console.log('🔍 Starting translation check...');
  log(colors.bright + colors.blue, '\n🔍 Translation Checker');
  log(colors.blue, '='.repeat(50));
  
  // Load translations
  log(colors.cyan, '\n📁 Loading translation files...');
  const translations = loadTranslations();
  
  // Find all source files
  log(colors.cyan, '\n📂 Scanning source files...');
  const sourceFiles = findFiles(SRC_DIR);
  log(colors.green, `Found ${sourceFiles.length} source files`);
  
  // Extract all translation calls
  const allCalls = [];
  const fileStats = {};
  
  for (const file of sourceFiles) {
    const relativePath = path.relative(SRC_DIR, file);
    const calls = findTranslationCalls(file);
    
    if (calls.length > 0) {
      allCalls.push(...calls.map(call => ({ ...call, file: relativePath })));
      fileStats[relativePath] = calls.length;
    }
  }
  
  log(colors.green, `Found ${allCalls.length} translation calls in ${Object.keys(fileStats).length} files`);
  
  // Get all unique keys (filter out dynamic template literals)
  const uniqueKeys = [...new Set(allCalls.map(call => call.key))]
    .filter(key => !key.includes('${'))  // Filter out template literals
    .sort();
  
  // Get all available keys from translation files
  const availableKeys = {};
  for (const lang of LANGUAGES) {
    availableKeys[lang] = extractKeys(translations[lang]);
  }
  
  // Check for missing translations
  log(colors.cyan, '\n🔍 Checking for missing translations...');
  
  const missing = {};
  const inconsistent = [];
  
  for (const lang of LANGUAGES) {
    missing[lang] = [];
    
    for (const key of uniqueKeys) {
      if (!hasKey(translations[lang], key)) {
        missing[lang].push(key);
      }
    }
  }
  
  // Check for inconsistencies between languages
  for (const key of uniqueKeys) {
    const availability = LANGUAGES.map(lang => hasKey(translations[lang], key));
    const hasAny = availability.some(Boolean);
    const hasAll = availability.every(Boolean);
    
    if (hasAny && !hasAll) {
      inconsistent.push({
        key,
        availability: LANGUAGES.reduce((acc, lang, index) => {
          acc[lang] = availability[index];
          return acc;
        }, {})
      });
    }
  }
  
  // Report results
  log(colors.bright + colors.blue, '\n📊 RESULTS');
  log(colors.blue, '='.repeat(50));
  
  // Summary
  log(colors.cyan, `\n📈 Summary:`);
  log(colors.green, `  • Total translation calls: ${allCalls.length}`);
  log(colors.green, `  • Unique keys used: ${uniqueKeys.length}`);
  log(colors.green, `  • Files with translations: ${Object.keys(fileStats).length}`);
  
  // Missing translations
  let hasMissing = false;
  for (const lang of LANGUAGES) {
    if (missing[lang].length > 0) {
      hasMissing = true;
      log(colors.red, `\n❌ Missing in ${lang}.json (${missing[lang].length} keys):`);
      for (const key of missing[lang]) {
        const usageCount = allCalls.filter(call => call.key === key).length;
        log(colors.yellow, `  • ${key} (used ${usageCount} time${usageCount > 1 ? 's' : ''})`);
      }
    }
  }
  
  // Inconsistent translations
  if (inconsistent.length > 0) {
    log(colors.red, `\n⚠️  Inconsistent translations (${inconsistent.length} keys):`);
    for (const item of inconsistent) {
      const statusStr = LANGUAGES.map(lang => 
        item.availability[lang] ? colors.green + '✓' : colors.red + '✗'
      ).join(' ') + colors.reset;
      log(colors.yellow, `  • ${item.key} [${statusStr}]`);
    }
  }
  
  // Unused translations (keys in translation files but not used in code)
  log(colors.cyan, '\n🧹 Checking for unused translations...');
  const unused = {};
  for (const lang of LANGUAGES) {
    unused[lang] = availableKeys[lang].filter(key => !uniqueKeys.includes(key));
  }
  
  for (const lang of LANGUAGES) {
    if (unused[lang].length > 0) {
      log(colors.magenta, `\n🗑️  Unused in ${lang}.json (${unused[lang].length} keys):`);
      unused[lang].slice(0, 10).forEach(key => {
        log(colors.yellow, `  • ${key}`);
      });
      if (unused[lang].length > 10) {
        log(colors.yellow, `  ... and ${unused[lang].length - 10} more`);
      }
    }
  }
  
  // File usage stats
  log(colors.cyan, '\n📁 Files with most translation calls:');
  const sortedFiles = Object.entries(fileStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  for (const [file, count] of sortedFiles) {
    log(colors.green, `  • ${file}: ${count} calls`);
  }

  // Scan for hardcoded JSX strings that could use translations
  function findHardcodedStrings(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const candidates = [];

    // Enhanced regex patterns for different types of hardcoded strings
    const patterns = [
      // JSX text content: >text<
      {
        regex: />\s*([^<{][^<>{}]*[a-zA-Z][^<>{}]*)\s*</g,
        type: 'jsx-text'
      },
      // String literals in JSX attributes: prop="text"
      {
        regex: /(?:placeholder|title|alt|aria-label|label)\s*=\s*["']([^"']*[a-zA-Z][^"']*)["']/g,
        type: 'jsx-attribute'
      },
      // Object property strings: { text: "string" }
      {
        regex: /["']([A-Z][a-zA-Z\s]{2,})["']\s*:/g,
        type: 'object-key'
      },
      // Array string literals: ["string"]
      {
        regex: /\[\s*["']([A-Z][a-zA-Z\s]{2,})["']/g,
        type: 'array-string'
      },
      // Function call arguments: func("string")
      {
        regex: /(?:console\.log|alert|confirm|prompt|throw new Error)\s*\(\s*["']([^"']*[a-zA-Z][^"']*)["']/g,
        type: 'function-arg'
      }
    ];

    lines.forEach((line, idx) => {
      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('import') || line.trim().startsWith('*')) {
        return;
      }

      patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
        
        while ((match = regex.exec(line)) !== null) {
          const text = match[1].trim();
          
          // Enhanced filtering
          if (
            text &&
            text.length > 2 &&
            !isExcludedString(text, line) &&
            containsEnglishWords(text)
          ) {
            candidates.push({
              file: filePath,
              line: idx + 1,
              text,
              type: pattern.type,
              code: line.trim(),
              severity: getSeverity(text, pattern.type)
            });
          }
        }
      });
    });

    return candidates;
  }

  // Check if string should be excluded from translation
  function isExcludedString(text, line) {
    const exclusions = [
      // TypeScript/JavaScript keywords
      /^(Promise|Error|Function|Object|Array|String|Number|Boolean|Date|RegExp)$/,
      // HTML/CSS values
      /^(px|em|rem|vh|vw|%|auto|none|block|inline|flex|grid)$/,
      // Numbers and IDs
      /^\d+$/,
      /^[a-f0-9-]{8,}$/i, // UUIDs, hashes
      // File extensions and paths
      /^\.[a-z]+$/,
      /^\/|\\|\./,
      // URLs and protocols
      /^https?:\/\/|^mailto:|^tel:/,
      // CSS classes (if in className context)
      /^[a-z-]+$/,
      // Already using translation function
      /t\s*\(/,
      // Environment variables or constants
      /^[A-Z_]+$/,
      // Single characters or very short strings
      /^.{1,2}$/,
      // Variable names in code
      /^[a-z][a-zA-Z0-9]*$/
    ];

    return exclusions.some(pattern => pattern.test(text)) ||
           line.includes('t(') ||
           line.includes('import') ||
           line.includes('export') ||
           line.includes('const ') ||
           line.includes('let ') ||
           line.includes('var ');
  }

  // Check if text contains English words
  function containsEnglishWords(text) {
    const englishWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
      'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
      'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
      'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
      // Common UI words
      'add', 'edit', 'delete', 'save', 'cancel', 'confirm', 'loading', 'error', 'success', 'total', 'amount', 'date',
      'name', 'type', 'category', 'description', 'income', 'expense', 'goal', 'loan', 'payment', 'transaction',
      'dashboard', 'summary', 'filter', 'search', 'menu', 'settings', 'profile', 'logout', 'login', 'register'
    ];
    
    const lowerText = text.toLowerCase();
    return englishWords.some(word => {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      return wordRegex.test(lowerText);
    }) || /[A-Z]/.test(text); // Capitalized words are likely English
  }

  // Get severity level for hardcoded string
  function getSeverity(text, type) {
    if (type === 'jsx-text') return 'high';
    if (type === 'jsx-attribute' && text.length > 5) return 'high';
    if (type === 'function-arg') return 'medium';
    return 'low';
  }

  log(colors.cyan, '\n🔎 Comprehensive hardcoded string detection...');
  const hardcodedCandidates = [];
  const severityCount = { high: 0, medium: 0, low: 0 };
  
  for (const file of sourceFiles) {
    if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const candidates = findHardcodedStrings(file);
      hardcodedCandidates.push(...candidates);
      candidates.forEach(c => severityCount[c.severity]++);
    }
  }

  // Group by severity and type
  const groupedCandidates = {
    high: hardcodedCandidates.filter(c => c.severity === 'high'),
    medium: hardcodedCandidates.filter(c => c.severity === 'medium'),
    low: hardcodedCandidates.filter(c => c.severity === 'low')
  };

  if (hardcodedCandidates.length > 0) {
    log(colors.red, `\n❌ Found ${hardcodedCandidates.length} hardcoded strings requiring translation:`);
    log(colors.yellow, `   🔴 High priority: ${severityCount.high} | 🟡 Medium: ${severityCount.medium} | 🟢 Low: ${severityCount.low}`);
    
    // Show high priority first
    if (groupedCandidates.high.length > 0) {
      log(colors.red, '\n🔴 HIGH PRIORITY - Visible user-facing text:');
      groupedCandidates.high.slice(0, 15).forEach(c =>
        log(colors.red, `  • ${path.relative(SRC_DIR, c.file)}:${c.line} [${c.type}] — "${c.text}"`)
      );
      if (groupedCandidates.high.length > 15) {
        log(colors.red, `  ... and ${groupedCandidates.high.length - 15} more high priority items`);
      }
    }

    // Show medium priority
    if (groupedCandidates.medium.length > 0) {
      log(colors.yellow, '\n🟡 MEDIUM PRIORITY - Error messages, logs:');
      groupedCandidates.medium.slice(0, 10).forEach(c =>
        log(colors.yellow, `  • ${path.relative(SRC_DIR, c.file)}:${c.line} [${c.type}] — "${c.text}"`)
      );
      if (groupedCandidates.medium.length > 10) {
        log(colors.yellow, `  ... and ${groupedCandidates.medium.length - 10} more medium priority items`);
      }
    }

    // Show low priority (limited)
    if (groupedCandidates.low.length > 0) {
      log(colors.green, '\n🟢 LOW PRIORITY - Consider for translation:');
      groupedCandidates.low.slice(0, 5).forEach(c =>
        log(colors.green, `  • ${path.relative(SRC_DIR, c.file)}:${c.line} [${c.type}] — "${c.text}"`)
      );
      if (groupedCandidates.low.length > 5) {
        log(colors.green, `  ... and ${groupedCandidates.low.length - 5} more low priority items`);
      }
    }

    // File breakdown
    const fileBreakdown = {};
    hardcodedCandidates.forEach(c => {
      const file = path.relative(SRC_DIR, c.file);
      fileBreakdown[file] = (fileBreakdown[file] || 0) + 1;
    });
    
    const topFiles = Object.entries(fileBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (topFiles.length > 0) {
      log(colors.cyan, '\n📁 Files with most hardcoded strings:');
      topFiles.forEach(([file, count]) => {
        const severity = hardcodedCandidates
          .filter(c => path.relative(SRC_DIR, c.file) === file)
          .reduce((acc, c) => Math.max(acc, c.severity === 'high' ? 3 : c.severity === 'medium' ? 2 : 1), 0);
        const icon = severity === 3 ? '🔴' : severity === 2 ? '🟡' : '🟢';
        log(colors.cyan, `  ${icon} ${file}: ${count} strings`);
      });
    }
  } else {
    log(colors.bright + colors.green, '\n🎉 No hardcoded strings found! Perfect translation coverage!');
  }

  // Enhanced translation completeness check
  log(colors.cyan, '\n🔍 Enhanced translation completeness analysis...');
  
  // Check for inconsistent key usage patterns
  const keyPatterns = {};
  uniqueKeys.forEach(key => {
    const parts = key.split('.');
    if (parts.length > 1) {
      const namespace = parts[0];
      keyPatterns[namespace] = (keyPatterns[namespace] || 0) + 1;
    }
  });

  if (Object.keys(keyPatterns).length > 0) {
    log(colors.cyan, '\n📊 Translation key distribution by namespace:');
    Object.entries(keyPatterns)
      .sort(([,a], [,b]) => b - a)
      .forEach(([namespace, count]) => {
        log(colors.green, `  • ${namespace}: ${count} keys`);
      });
  }

  // Check for potential missing common patterns
  const commonPatterns = [
    { pattern: /button|btn/i, suggestion: 'Consider common.button, common.submit, etc.' },
    { pattern: /form|input|field/i, suggestion: 'Consider common.form, common.required, etc.' },
    { pattern: /error|fail|invalid/i, suggestion: 'Consider errors.validation, errors.network, etc.' },
    { pattern: /loading|wait|pending/i, suggestion: 'Consider common.loading, common.processing, etc.' },
    { pattern: /success|complete|done/i, suggestion: 'Consider common.success, common.saved, etc.' }
  ];

  const suggestions = [];
  hardcodedCandidates.forEach(candidate => {
    commonPatterns.forEach(({ pattern, suggestion }) => {
      if (pattern.test(candidate.text) && !suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    });
  });

  if (suggestions.length > 0) {
    log(colors.yellow, '\n💡 Translation structure suggestions:');
    suggestions.forEach(suggestion => {
      log(colors.yellow, `  • ${suggestion}`);
    });
  }
  
  // Final status
  if (!hasMissing && inconsistent.length === 0) {
    log(colors.bright + colors.green, '\n🎉 All translations are complete and consistent!');
  } else {
    log(colors.bright + colors.red, '\n❌ Translation issues found. Please review the missing keys above.');
  }
  
  log(colors.blue, '\n' + '='.repeat(50));
  
  return {
    total: allCalls.length,
    unique: uniqueKeys.length,
    missing,
    inconsistent,
    unused
  };
}

// Export for use as module or run directly
const isMainModule = process.argv[1]?.endsWith('check-translations.js');
if (isMainModule) {
  try {
    checkTranslations();
  } catch (error) {
    console.error('Error running translation checker:', error);
    process.exit(1);
  }
}

export { checkTranslations };
