import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:splithome_mobile/shared/widgets/transaction_filter_bar.dart';

void main() {
  testWidgets('emits search, category and clear changes', (tester) async {
    var search = '';
    String? category;
    var cleared = false;

    await tester.pumpWidget(
      MaterialApp(
        home: TransactionFilterBar(
          searchText: 'abc',
          selectedCategory: null,
          categories: const ['FOOD', 'RENT'],
          onSearchChanged: (value) {
            search = value;
          },
          onCategoryChanged: (value) {
            category = value;
          },
          onClear: () {
            cleared = true;
          },
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), 'mercado');
    expect(search, 'mercado');

    await tester.tap(find.text('Todas as categorias'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Alimento').last);
    await tester.pumpAndSettle();
    expect(category, 'FOOD');

    await tester.tap(find.byTooltip('Limpar filtros'));
    expect(cleared, isTrue);
  });
}
