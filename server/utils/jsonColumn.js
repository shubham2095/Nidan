/**
 * TEXT column that transparently stores JSON. Plain TEXT is used instead of the
 * JSON type because MariaDB (XAMPP) aliases JSON to LONGTEXT with different
 * behaviour than MySQL, and migrations must run identically on both.
 */
const jsonColumn = (DataTypes, field, fallback) => ({
  type: DataTypes.TEXT('long'),
  get() {
    const raw = this.getDataValue(field);
    if (!raw) return structuredClone(fallback);
    try {
      return JSON.parse(raw);
    } catch {
      return structuredClone(fallback);
    }
  },
  set(value) {
    this.setDataValue(field, value === null || value === undefined ? null : JSON.stringify(value));
  },
});

module.exports = jsonColumn;
