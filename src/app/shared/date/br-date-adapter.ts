import { Injectable } from '@angular/core';
import { MatDateFormats, NativeDateAdapter } from '@angular/material/core';

export const BR_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'input',
    timeInput: null
  },
  display: {
    dateInput: 'input',
    timeInput: { hour: 'numeric', minute: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { day: '2-digit', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
    timeOptionLabel: { hour: 'numeric', minute: 'numeric' }
  }
};

@Injectable()
export class BrDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (typeof value !== 'string') {
      return super.parse(value);
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const brDateMatch = trimmedValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

    if (!brDateMatch) {
      return super.parse(trimmedValue);
    }

    const day = Number(brDateMatch[1]);
    const month = Number(brDateMatch[2]) - 1;
    const year = Number(brDateMatch[3]);

    if (month < 0 || month > 11 || day < 1) {
      return this.invalid();
    }

    const date = new Date(year, month, day);

    if (
      this.getYear(date) !== year
      || this.getMonth(date) !== month
      || this.getDate(date) !== day
    ) {
      return this.invalid();
    }

    return date;
  }

  override format(date: Date, displayFormat: object): string {
    if ((displayFormat as unknown) === 'input') {
      return [
        String(this.getDate(date)).padStart(2, '0'),
        String(this.getMonth(date) + 1).padStart(2, '0'),
        this.getYear(date)
      ].join('/');
    }

    return super.format(date, displayFormat);
  }
}
