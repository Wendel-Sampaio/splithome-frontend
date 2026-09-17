import { CategoriaCorPipe } from './categoria-cor.pipe';

describe('CategoriaCorPipe', () => {
  const pipe = new CategoriaCorPipe();

  it('retorna uma cor única para cada categoria conhecida', () => {
    const categorias = ['CLEANING', 'FOOD', 'UTILITIES', 'RENT', 'INTERNET', 'ENERGY', 'WATER', 'GAS', 'OTHERS'];
    const cores = categorias.map((categoria) => pipe.transform(categoria));

    expect(new Set(cores).size).toBe(categorias.length);
  });

  it('usa cor de outros para categoria ausente ou desconhecida', () => {
    expect(pipe.transform(null)).toBe('#64748b');
    expect(pipe.transform('UNKNOWN')).toBe('#64748b');
  });
});
