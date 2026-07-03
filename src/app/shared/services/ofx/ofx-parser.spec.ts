import { parseOfxExpenses } from './ofx-parser';

describe('parseOfxExpenses', () => {
  it('extrai apenas transações de débito do OFX', () => {
    const despesas = parseOfxExpenses(`
      <OFX>
        <STMTTRN>
          <TRNTYPE>DEBIT
          <DTPOSTED>20260625120000[-3:BRT]
          <TRNAMT>-42.50
          <FITID>abc-1
          <NAME>Mercado
          <MEMO>Compra mercado
        </STMTTRN>
        <STMTTRN>
          <TRNTYPE>CREDIT
          <DTPOSTED>20260626120000[-3:BRT]
          <TRNAMT>100.00
          <FITID>abc-2
          <NAME>Salario
        </STMTTRN>
      </OFX>
    `);

    expect(despesas).toEqual([
      {
        title: 'Mercado',
        value: 42.5,
        paymentDate: '2026-06-25',
        fitId: 'abc-1'
      }
    ]);
  });

  it('usa memo ou fitId quando name não existe', () => {
    const despesas = parseOfxExpenses(`
      <STMTTRN>
        <DTPOSTED>20260701
        <TRNAMT>-10,25
        <FITID>fit-1
        <MEMO>Tarifa bancaria
      </STMTTRN>
      <STMTTRN>
        <DTPOSTED>20260702
        <TRNAMT>-12.00
        <FITID>fit-2
      </STMTTRN>
    `);

    expect(despesas[0].title).toBe('Tarifa bancaria');
    expect(despesas[0].value).toBe(10.25);
    expect(despesas[1].title).toBe('fit-2');
  });

  it('ignora transações sem valor ou data válidos', () => {
    const despesas = parseOfxExpenses(`
      <STMTTRN>
        <DTPOSTED>20260701
        <TRNAMT>abc
        <NAME>Invalida
      </STMTTRN>
      <STMTTRN>
        <DTPOSTED>data-invalida
        <TRNAMT>-20.00
        <NAME>Invalida
      </STMTTRN>
    `);

    expect(despesas).toEqual([]);
  });
});
