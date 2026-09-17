import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/shared/formatters/category_formatter.dart';

void main() {
  test('formats backend category codes using friendly labels', () {
    expect(CategoryFormatter.label('FOOD'), 'Alimento');
    expect(CategoryFormatter.label('RENT'), 'Aluguel');
    expect(CategoryFormatter.label('TRANSPORT'), 'Transporte');
    expect(CategoryFormatter.label('MERCADO'), 'Mercado');
  });

  test('humanizes unknown category codes', () {
    expect(CategoryFormatter.label('HOME_SUPPLIES'), 'Home Supplies');
    expect(CategoryFormatter.label(''), '');
    expect(CategoryFormatter.label(null), '');
  });
}
