import { en } from '../src/shared/i18n/locales/en.ts';
import { ptBR } from '../src/shared/i18n/locales/pt-BR.ts';
import { t, formatDate, formatNumber } from '../src/shared/i18n/index.ts';
import { DEFAULT_SETTINGS } from '../src/shared/types.ts';

function flattenObject(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(flattenObject(v, fullKey));
    } else {
      keys.push({ key: fullKey, value: v });
    }
  }
  return keys;
}

console.log('--- 1. Testing Locale Keys Completeness ---');
const enEntries = flattenObject(en);
const ptEntries = flattenObject(ptBR);

const enKeys = new Set(enEntries.map((e) => e.key));
const ptKeys = new Set(ptEntries.map((e) => e.key));

let errors = 0;

for (const k of enKeys) {
  if (!ptKeys.has(k)) {
    console.error(`MISSING IN pt-BR: ${k}`);
    errors++;
  }
}

for (const k of ptKeys) {
  if (!enKeys.has(k)) {
    console.error(`MISSING IN en: ${k}`);
    errors++;
  }
}

// Check for empty or non-string values
for (const entry of enEntries) {
  if (typeof entry.value !== 'string' || entry.value.trim().length === 0) {
    console.error(`EMPTY VALUE in en: ${entry.key}`);
    errors++;
  }
}
for (const entry of ptEntries) {
  if (typeof entry.value !== 'string' || entry.value.trim().length === 0) {
    console.error(`EMPTY VALUE in pt-BR: ${entry.key}`);
    errors++;
  }
}

console.log(`Total keys per locale: ${enKeys.size}`);
if (errors === 0) {
  console.log('✓ All keys match 100% symmetrically between en and pt-BR with non-empty values.');
} else {
  console.error(`Found ${errors} locale symmetry errors.`);
}

console.log('\n--- 2. Testing Translation Resolver & Fallback ---');
const enResolved = t('en', 'options.headerTitle');
const ptResolved = t('pt-BR', 'options.headerTitle');
console.log(`en: "${enResolved}"`);
console.log(`pt-BR: "${ptResolved}"`);

if (enResolved !== ptResolved && enResolved.length > 0 && ptResolved.length > 0) {
  console.log('✓ Translations resolve distinctly per locale.');
} else {
  console.error('Resolution failed or values are identical!');
  errors++;
}

// Placeholder replacement test
const interpResult = t('pt-BR', 'popup.errorInitFailed', { error: 'NetworkTimeout' });
console.log(`Interpolation: "${interpResult}"`);
if (interpResult.includes('NetworkTimeout')) {
  console.log('✓ Variable interpolation working correctly.');
} else {
  console.error('Variable interpolation failed!');
  errors++;
}

// Fallback test
const fallbackResult = t('pt-BR', 'non.existent.key');
if (fallbackResult === 'non.existent.key') {
  console.log('✓ Non-existent key gracefully returns key path.');
} else {
  console.error('Fallback failed');
  errors++;
}

console.log('\n--- 3. Testing Date & Number Formatting ---');
const testDate = new Date('2026-10-11T19:00:00Z');
const dateEn = formatDate(testDate, 'en');
const datePt = formatDate(testDate, 'pt-BR');
console.log(`Date en: ${dateEn}`);
console.log(`Date pt-BR: ${datePt}`);

const numEn = formatNumber(12345.67, 'en');
const numPt = formatNumber(12345.67, 'pt-BR');
console.log(`Number en: ${numEn}`);
console.log(`Number pt-BR: ${numPt}`);

console.log('\n--- 4. Testing Default Settings ---');
console.log(`DEFAULT_SETTINGS.language: ${DEFAULT_SETTINGS.language}`);
if (DEFAULT_SETTINGS.language === 'en') {
  console.log('✓ DEFAULT_SETTINGS has language set to "en" as required.');
} else {
  console.error(`Expected DEFAULT_SETTINGS.language to be "en", got ${DEFAULT_SETTINGS.language}`);
  errors++;
}

if (errors === 0) {
  console.log('\n========================================');
  console.log('ALL I18N VERIFICATION TESTS PASSED (100%)');
  console.log('========================================');
} else {
  process.exit(1);
}
