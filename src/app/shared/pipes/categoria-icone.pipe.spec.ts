import { CategoriaIconePipe } from './categoria-icone.pipe';

describe('CategoriaIconePipe', () => {
  const pipe = new CategoriaIconePipe();

  it('retorna um ícone único para cada categoria conhecida', () => {
    const categorias = ['CLEANING', 'FOOD', 'UTILITIES', 'RENT', 'INTERNET', 'ENERGY', 'WATER', 'GAS', 'TRANSPORT', 'OTHERS'];
    const icones = categorias.map((categoria) => pipe.transform(categoria));

    expect(new Set(icones).size).toBe(categorias.length);
  });

  it('usa ícone de outros para categoria ausente ou desconhecida', () => {
    expect(pipe.transform(null)).toBe('category');
    expect(pipe.transform('UNKNOWN')).toBe('category');
  });
});
