export interface Categoria {
  id: string;
  name: string;
  systemDefault: boolean;
  custom: boolean;
}

export type CategoriaValor = Categoria | string | null | undefined;

/** Somente categorias padrão usam os códigos de tradução, cor e ícone do sistema. */
export function codigoCategoria(categoria: CategoriaValor): string | null {
  if (typeof categoria === 'string') return categoria;
  return categoria?.systemDefault ? categoria.name : null;
}
