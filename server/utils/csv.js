// A cell starting with = + - @ (or a tab/return) can run as a formula when the CSV is opened in Excel,
// so such cells are prefixed with an apostrophe.
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (value) => {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** columns: [{ header, value: (row) => any }]. Returns CSV text with a BOM so Excel reads UTF-8 correctly. */
const toCsv = (columns, rows) => {
  const lines = [columns.map((column) => cell(column.header)).join(',')];
  for (const row of rows) lines.push(columns.map((column) => cell(column.value(row))).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
};

module.exports = { toCsv };
