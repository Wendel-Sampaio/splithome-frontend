import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../shared/formatters/category_formatter.dart';
import '../../home/data/home_repository.dart';
import '../data/purchase.dart';
import '../data/purchase_repository.dart';

class NewPurchasePage extends ConsumerStatefulWidget {
  const NewPurchasePage({super.key, this.purchase});

  final Purchase? purchase;

  @override
  ConsumerState<NewPurchasePage> createState() => _NewPurchasePageState();
}

class _NewPurchasePageState extends ConsumerState<NewPurchasePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _valueController = TextEditingController();
  DateTime _paymentDate = DateTime.now();
  String? _category;
  bool _isSubmitting = false;

  bool get _isEditing => widget.purchase != null;

  @override
  void initState() {
    super.initState();
    final purchase = widget.purchase;
    if (purchase != null) {
      _titleController.text = purchase.title;
      _valueController.text = purchase.value.toStringAsFixed(2);
      _category = purchase.category.isEmpty ? null : purchase.category;
      _paymentDate =
          DateTime.tryParse(purchase.paymentDate ?? '') ?? _paymentDate;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _valueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(purchaseCategoriesProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Editar compra' : 'Nova compra'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/purchases'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextFormField(
                      controller: _titleController,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Título',
                        prefixIcon: Icon(Icons.edit_note_outlined),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Informe o título da compra.';
                        }

                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    categories.when(
                      data: (items) => DropdownButtonFormField<String>(
                        initialValue: _category,
                        decoration: const InputDecoration(
                          labelText: 'Categoria',
                          prefixIcon: Icon(Icons.category_outlined),
                        ),
                        items: items
                            .map(
                              (category) => DropdownMenuItem(
                                value: category,
                                child: Text(CategoryFormatter.label(category)),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            _category = value;
                          });
                        },
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Selecione uma categoria.';
                          }

                          return null;
                        },
                      ),
                      error: (error, stackTrace) => _InlineError(
                        message: error.toString(),
                        onRetry: () =>
                            ref.invalidate(purchaseCategoriesProvider),
                      ),
                      loading: () => const LinearProgressIndicator(),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _valueController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'[0-9,.]')),
                      ],
                      decoration: const InputDecoration(
                        labelText: 'Valor',
                        prefixIcon: Icon(Icons.payments_outlined),
                      ),
                      validator: (value) {
                        final number = _parseMoney(value);
                        if (number == null || number <= 0) {
                          return 'Informe um valor maior que zero.';
                        }

                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: _pickPaymentDate,
                      icon: const Icon(Icons.event_outlined),
                      label: Text(
                        'Pagamento: ${DateFormat('dd/MM/yyyy').format(_paymentDate)}',
                      ),
                    ),
                    const SizedBox(height: 22),
                    FilledButton.icon(
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check),
                      label: Text(
                        _isEditing ? 'Salvar alterações' : 'Cadastrar compra',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickPaymentDate() async {
    final selected = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: _paymentDate,
    );

    if (selected == null || !mounted) {
      return;
    }

    setState(() {
      _paymentDate = selected;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final user = ref.read(authControllerProvider).asData?.value.user;
    if (user == null || user.id.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sessão inválida. Entre novamente.')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final dateFormatter = DateFormat('yyyy-MM-dd');
      final repository = ref.read(purchaseRepositoryProvider);
      final existing = widget.purchase;
      if (existing == null) {
        await repository.createPurchase(
          CreatePurchaseRequest(
            title: _titleController.text.trim(),
            category: _category!,
            value: _parseMoney(_valueController.text)!,
            paymentDate: dateFormatter.format(_paymentDate),
            purchaserId: user.id,
            purchaseDate: dateFormatter.format(DateTime.now()),
          ),
        );
      } else {
        await repository.updatePurchase(
          UpdatePurchaseRequest(
            id: existing.id,
            title: _titleController.text.trim(),
            category: _category!,
            value: _parseMoney(_valueController.text)!,
            paymentDate: dateFormatter.format(_paymentDate),
            purchaserId: existing.purchaserId ?? user.id,
            purchaseDate:
                existing.purchaseDate ?? dateFormatter.format(DateTime.now()),
            payers: existing.payers,
            remainingPayers: existing.remainingPayers,
          ),
        );
      }

      ref.invalidate(purchasesProvider);
      ref.invalidate(homeSummaryProvider);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isEditing
                ? 'Compra atualizada com sucesso.'
                : 'Compra cadastrada com sucesso.',
          ),
        ),
      );
      context.go('/purchases');
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  double? _parseMoney(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }

    return double.tryParse(value.trim().replaceAll(',', '.'));
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Recarregar categorias'),
            ),
          ],
        ),
      ),
    );
  }
}
