import 'package:intl/intl.dart';

class CurrencyFormatter {
  CurrencyFormatter._();

  static final _brl = NumberFormat.currency(locale: 'pt_BR', symbol: r'R$');

  static String brl(num value) {
    return _brl.format(value);
  }
}
