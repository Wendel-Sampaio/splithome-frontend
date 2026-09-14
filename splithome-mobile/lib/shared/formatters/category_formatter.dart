class CategoryFormatter {
  const CategoryFormatter._();

  static const _labels = {
    'CLEANING': 'Limpeza',
    'FOOD': 'Alimento',
    'UTILITIES': 'Utilitários',
    'RENT': 'Aluguel',
    'INTERNET': 'Internet',
    'ENERGY': 'Energia',
    'WATER': 'Água',
    'GAS': 'Gás',
    'OTHERS': 'Outros',
    'MERCADO': 'Mercado',
    'MORADIA': 'Moradia',
    'ALUGUEL': 'Aluguel',
  };

  static String label(String? category) {
    final value = category?.trim();
    if (value == null || value.isEmpty) {
      return '';
    }

    final normalized = value.toUpperCase();
    return _labels[normalized] ?? _humanize(value);
  }

  static String _humanize(String value) {
    return value
        .split(RegExp(r'[_\-\s]+'))
        .where((part) => part.isNotEmpty)
        .map((part) {
          final lower = part.toLowerCase();
          return '${lower[0].toUpperCase()}${lower.substring(1)}';
        })
        .join(' ');
  }
}
