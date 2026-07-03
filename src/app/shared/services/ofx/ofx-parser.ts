export interface OfxTransaction {
  title: string;
  value: number;
  paymentDate: string;
  fitId?: string;
}

const STMTTRN_REGEX = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;

export function parseOfxExpenses(content: string): OfxTransaction[] {
  return Array.from(content.matchAll(STMTTRN_REGEX))
    .map(match => parseStmtTrn(match[1] ?? ''))
    .filter((transaction): transaction is OfxTransaction => transaction !== null);
}

function parseStmtTrn(block: string): OfxTransaction | null {
  const amount = parseAmount(readOfxTag(block, 'TRNAMT'));
  const paymentDate = parseOfxDate(readOfxTag(block, 'DTPOSTED'));

  if (amount === null || amount >= 0 || !paymentDate) {
    return null;
  }

  return {
    title: getTransactionTitle(block),
    value: Math.abs(amount),
    paymentDate,
    fitId: readOfxTag(block, 'FITID') || undefined
  };
}

function readOfxTag(block: string, tag: string): string {
  const match = new RegExp(`<${tag}>([^\\r\\n<]*)`, 'i').exec(block);
  return match?.[1]?.trim() ?? '';
}

function parseAmount(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsedValue = Number(value.replace(',', '.'));
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseOfxDate(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value);

  if (!match) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function getTransactionTitle(block: string): string {
  const title = readOfxTag(block, 'NAME') || readOfxTag(block, 'MEMO') || readOfxTag(block, 'FITID');
  return title || 'Despesa importada OFX';
}
