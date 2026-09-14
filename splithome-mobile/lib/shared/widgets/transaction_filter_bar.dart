import 'package:flutter/material.dart';

import '../../core/theme/app_tokens.dart';
import '../formatters/category_formatter.dart';

class TransactionFilterBar extends StatefulWidget {
  const TransactionFilterBar({
    required this.searchText,
    required this.selectedCategory,
    required this.categories,
    required this.onSearchChanged,
    required this.onCategoryChanged,
    required this.onClear,
    super.key,
  });

  final String searchText;
  final String? selectedCategory;
  final List<String> categories;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String?> onCategoryChanged;
  final VoidCallback onClear;

  bool get _hasFilters =>
      searchText.trim().isNotEmpty || selectedCategory != null;

  @override
  State<TransactionFilterBar> createState() => _TransactionFilterBarState();
}

class _TransactionFilterBarState extends State<TransactionFilterBar> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.searchText);
  }

  @override
  void didUpdateWidget(covariant TransactionFilterBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.searchText != _searchController.text) {
      _searchController.text = widget.searchText;
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: ShInsets.card,
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              onChanged: widget.onSearchChanged,
              decoration: InputDecoration(
                labelText: 'Buscar',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: widget._hasFilters
                    ? IconButton(
                        tooltip: 'Limpar filtros',
                        onPressed: widget.onClear,
                        icon: const Icon(Icons.close),
                      )
                    : null,
              ),
            ),
            const SizedBox(height: ShSpacing.sm),
            DropdownButtonFormField<String>(
              key: ValueKey(widget.selectedCategory),
              initialValue: widget.selectedCategory,
              decoration: const InputDecoration(
                labelText: 'Categoria',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('Todas as categorias'),
                ),
                ...widget.categories.map(
                  (category) => DropdownMenuItem(
                    value: category,
                    child: Text(CategoryFormatter.label(category)),
                  ),
                ),
              ],
              onChanged: widget.onCategoryChanged,
            ),
          ],
        ),
      ),
    );
  }
}
