/**
 * Clean customer-entered text before it is put into an enquiry.
 *
 * React already escapes everything it renders, so this is not about HTML:
 * it removes invisible and control characters that could disguise text in
 * the WhatsApp message (e.g. right-to-left overrides that make "£80" read
 * as "£08", or zero-width characters), and stops single-line fields from
 * adding extra lines to the message.
 */

// C0/C1 control characters except tab and newline.
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g
// Bidirectional overrides/isolates, zero-width characters, BOM, soft hyphen.
const INVISIBLE = /[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g

/** A single line: no line breaks, collapsed spaces, trimmed, length-capped. */
export function cleanLine(value: string, maxLength = 200): string {
  return value
    .normalize('NFC')
    .replace(INVISIBLE, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(CONTROL, '')
    .replace(/ {2,}/g, ' ')
    .trim()
    .slice(0, maxLength)
}

/** Multi-line text such as notes: keeps line breaks, at most one blank line in a row. */
export function cleanText(value: string, maxLength = 1000): string {
  return value
    .normalize('NFC')
    .replace(INVISIBLE, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROL, '')
    .replace(/[ ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength)
}
