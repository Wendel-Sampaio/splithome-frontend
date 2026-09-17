import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/auth/auth_controller.dart';
import '../../../shared/formatters/category_formatter.dart';
import '../../../shared/widgets/premium_feature_gate.dart';
import '../../family/presentation/family_payer_selector.dart';
import '../../home/data/financial_summary_repository.dart';
import '../../home/data/home_repository.dart';
import '../../purchases/data/purchase_repository.dart';
import '../data/fixed_expense.dart';
import '../data/fixed_expense_repository.dart';

class NewFixedExpensePage extends ConsumerStatefulWidget {
  const NewFixedExpensePage({super.key, this.expense});

  final FixedExpense? expense;

  @override
  ConsumerState<NewFixedExpensePage> createState() =>
      _NewFixedExpensePageState();
}

class _NewFixedExpensePageState extends ConsumerState<NewFixedExpensePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _totalValueController = TextEditingController();
  final _installmentsController = TextEditingController(text: '1');
  final _dueDayController = TextEditingController(text: '10');
  DateTime _startDate = DateTime.now();
  String? _category;
  List<String> _selectedPayers = [];
  bool _isRecurring = true;
  bool _isSubmitting = false;

  bool get _isEditing => widget.expense != null;

  @override
  void initState() {
    super.initState();
    final expense = widget.expense;
    if (expense != null) {
      _titleController.text = expense.title;
      _totalValueController.text = expense.totalValue.toStringAsFixed(2);
      _isRecurring = expense.isRecurring;
      _installmentsController.text = (expense.installmentsCount ?? 1)
          .toString();
      _dueDayController.text = expense.dueDay.toString();
      _category = expense.category.isEmpty ? null : expense.category;
      _selectedPayers = [...expense.payers];
      _startDate = DateTime.tryParse(expense.startDate ?? '') ?? _startDate;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _totalValueController.dispose();
    _installmentsController.dispose();
    _dueDayController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(purchaseCategoriesProvider);
    final user = ref.watch(authControllerProvider).asData?.value.user;
    final isFree = user?.isPremium == false;
    final canChoosePayers = user?.isPremium == true;

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Editar despesa fixa' : 'Nova despesa fixa'),
        leading: IconButton(
          tooltip: 'Voltar',
          onPressed: () => context.go('/fixed-expenses'),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: isFree
          ? const PremiumFeatureGate(
              title: 'Despesa fixa é Premium',
              message:
                  'Assine o Premium para cadastrar despesas fixas e dividir com a família.',
              actionLabel: 'Voltar para despesas',
              actionRoute: '/fixed-expenses',
            )
          : SafeArea(
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
                                return 'Informe o título da despesa.';
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
                                      child: Text(
                                        CategoryFormatter.label(category),
                                      ),
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
                            controller: _totalValueController,
                            keyboardType: const TextInputType.numberWithOptions(
                              decimal: true,
                            ),
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(
                                RegExp(r'[0-9,.]'),
                              ),
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
                          SegmentedButton<bool>(
                            segments: const [
                              ButtonSegment(
                                value: true,
                                icon: Icon(Icons.autorenew),
                                label: Text('Mensal'),
                              ),
                              ButtonSegment(
                                value: false,
                                icon: Icon(Icons.format_list_numbered),
                                label: Text('Parcelada'),
                              ),
                            ],
                            selected: {_isRecurring},
                            onSelectionChanged: (values) {
                              setState(() {
                                _isRecurring = values.first;
                              });
                            },
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              if (!_isRecurring) ...[
                                Expanded(
                                  child: TextFormField(
                                    controller: _installmentsController,
                                    keyboardType: TextInputType.number,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly,
                                    ],
                                    decoration: const InputDecoration(
                                      labelText: 'Parcelas',
                                      prefixIcon: Icon(
                                        Icons.format_list_numbered,
                                      ),
                                    ),
                                    validator: (value) =>
                                        _validateIntRange(value, 1, 240),
                                  ),
                                ),
                                const SizedBox(width: 12),
                              ],
                              Expanded(
                                child: TextFormField(
                                  controller: _dueDayController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                  ],
                                  decoration: const InputDecoration(
                                    labelText: 'Vencimento',
                                    prefixIcon: Icon(
                                      Icons.event_available_outlined,
                                    ),
                                  ),
                                  validator: (value) =>
                                      _validateIntRange(value, 1, 31),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          OutlinedButton.icon(
                            onPressed: _pickStartDate,
                            icon: const Icon(Icons.event_outlined),
                            label: Text(
                              '${_isRecurring ? 'Cobrar a partir de' : 'Início'}: ${DateFormat('dd/MM/yyyy').format(_startDate)}',
                            ),
                          ),
                          if (canChoosePayers) ...[
                            const SizedBox(height: 14),
                            FamilyPayerSelector(
                              selectedPayers: _selectedPayers,
                              onChanged: (payers) {
                                setState(() {
                                  _selectedPayers = payers;
                                });
                              },
                            ),
                          ],
                          const SizedBox(height: 22),
                          FilledButton.icon(
                            onPressed: _isSubmitting ? null : _submit,
                            icon: _isSubmitting
                                ? const SizedBox.square(
                                    dimension: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.check),
                            label: Text(
                              _isEditing
                                  ? 'Salvar alterações'
                                  : 'Cadastrar despesa fixa',
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

  Future<void> _pickStartDate() async {
    final selected = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: _startDate,
    );

    if (selected == null || !mounted) {
      return;
    }

    setState(() {
      _startDate = selected;
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
      final existing = widget.expense;
      final request = CreateFixedExpenseRequest(
        title: _titleController.text.trim(),
        category: _category!,
        totalValue: _parseMoney(_totalValueController.text)!,
        installmentsCount: _isRecurring
            ? null
            : int.parse(_installmentsController.text),
        dueDay: int.parse(_dueDayController.text),
        startDate: DateFormat('yyyy-MM-dd').format(_startDate),
        responsibleId: existing?.responsibleId ?? user.id,
        creditCardId: existing?.creditCardId,
        payers: _selectedPayers,
        remainingPayers: existing == null
            ? _selectedPayers
            : _remainingPayersForUpdate(
                oldPayers: existing.payers,
                oldRemainingPayers: existing.remainingPayers,
                nextPayers: _selectedPayers,
              ),
      );

      final repository = ref.read(fixedExpenseRepositoryProvider);
      if (existing == null) {
        await repository.createFixedExpense(request);
      } else {
        await repository.updateFixedExpense(existing.id, request);
      }

      ref.invalidate(fixedExpensesProvider);
      ref.invalidate(homeSummaryProvider);
      ref.invalidate(financialSummaryProvider);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isEditing
                ? 'Despesa fixa atualizada com sucesso.'
                : 'Despesa fixa cadastrada com sucesso.',
          ),
        ),
      );
      context.go('/fixed-expenses');
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

  String? _validateIntRange(String? value, int min, int max) {
    final number = int.tryParse(value ?? '');
    if (number == null || number < min || number > max) {
      return 'Use $min a $max.';
    }

    return null;
  }

  double? _parseMoney(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }

    return double.tryParse(value.trim().replaceAll(',', '.'));
  }

  List<String> _remainingPayersForUpdate({
    required List<String> oldPayers,
    required List<String> oldRemainingPayers,
    required List<String> nextPayers,
  }) {
    final newPayers = nextPayers.where((payer) => !oldPayers.contains(payer));
    final keptPending = oldRemainingPayers.where(nextPayers.contains);
    return {...keptPending, ...newPayers}.toList();
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
