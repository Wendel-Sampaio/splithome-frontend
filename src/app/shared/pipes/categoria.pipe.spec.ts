import { CategoriaPipe } from './categoria.pipe';
import { CategoriaIconePipe } from './categoria-icone.pipe';
import { CategoriaCorPipe } from './categoria-cor.pipe';
import { Categoria } from '../../core/models/categoria/categoria';

describe('Categorias persistidas nas telas', () => {
  const custom: Categoria = { id: 'custom', name: 'FOOD', systemDefault: false, custom: true };
  const standard: Categoria = { ...custom, id: 'standard', systemDefault: true, custom: false };
  it('traduz os padrões e mantém o nome livre mesmo se coincidir com um código do enum', () => {
    const pipe = new CategoriaPipe();
    expect(pipe.transform(standard)).toBe('Alimento');
    expect(pipe.transform(custom)).toBe('FOOD');
    expect(pipe.transform('FOOD')).toBe('Alimento');
    expect(pipe.transform({ ...custom, name: 'Veterinário' })).toBe('Veterinário');
  });
  it('usa ícone e cor de fallback para categorias customizadas', () => {
    expect(new CategoriaIconePipe().transform(custom)).toBe('category');
    expect(new CategoriaCorPipe().transform(custom)).toBe('#64748b');
    expect(new CategoriaIconePipe().transform(standard)).toBe('restaurant');
  });
});
