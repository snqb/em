import emojiRegex from 'emoji-regex'
import moize from 'moize'
import * as pluralize from 'pluralize'

// TODO: Should we be using the internal emojiRegex.ts?
const REGEXP_EMOJI = emojiRegex()

// store all the replacements in a single regex for performance
const REGEXP_NORMALIZE = new RegExp(
  [
    /** Removes HTML tags. Same as REGEXP_TAGS. */
    '<([^>]+)>',
    /** Remove diacritics (e.g. accents, umlauts, etc). */
    // Borrowed from modern-diacritics package.
    // modern-diacritics does not currently import so it is copied here.
    // See: https://github.com/Mitsunee/modern-diacritics/blob/master/src/removeDiacritics.ts
    '\\p{Diacritic}',
    /** Removes all punctuation (except hyphens, which are selectively removed by removeHyphens. */
    // [-–—] is a character class that matches hyphens and dashes.
    // Use unicode character class escape.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape
    '(?![-–—/:&|!#@])[\\p{P}$+<>^`|~]',
    /** Removes hyphens and dashes in the middle of a word, unless it is a number range. */
    '\\b[-–—/]\\b(?![0-9])',
    /** Removes punctuation from the end of words. */
    '[:;!?](?=\\s|$)',
    /** Removes whitespace.  */
    '\\s',
  ].join('|'),
  'gu',
)

/**
 * Converts a thought value into a canonical form that is stored in Lexeme.lemma.
 * Not idempotent (singularize may return a different string after whitespace is removed).
 */
const normalizeThought = moize(
  s => {
    const stripped =
      // always distinguish single characters from each other
      s.length <= 1
        ? s
        : s
            // needed to remove diacritics
            .normalize('NFD')
            .replace(REGEXP_NORMALIZE, '')
            /** Change ampersand to 'and'. */
            .replace(/&/g, 'and')

    const strippedLowerCase = stripped.toLowerCase()

    // preserve lone 's', even though singularize would return ''
    // preserve lone emoji (Note: single emoji characters can have length > 1)
    return pluralize.singular(strippedLowerCase.replace(REGEXP_EMOJI, '')) || strippedLowerCase
  },
  { maxSize: 1000 },
)

export default normalizeThought
