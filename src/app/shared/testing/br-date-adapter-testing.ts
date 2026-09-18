import { Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { BR_DATE_FORMATS, BrDateAdapter } from '../date/br-date-adapter';

export function provideBrDateAdapterTesting(): Provider[] {
  return [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS },
    { provide: DateAdapter, useClass: BrDateAdapter }
  ];
}
