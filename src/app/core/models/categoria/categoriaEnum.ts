import { CategoriaValor, codigoCategoria } from './categoria';

export enum CategoriaEnum {
    CLEANING = 'Limpeza',
    FOOD = 'Alimento',
    UTILITIES = 'Utilitários',
    RENT = 'Aluguel',
    INTERNET = 'Internet',
    ENERGY = 'Energia',
    WATER = 'Água',
    GAS = 'Gás',
    TRANSPORT = 'Transporte',
    SUBSCRIPTION = 'Assinatura',
    OTHERS = 'Outros'
}

export const CategoriaIcone: Record<keyof typeof CategoriaEnum, string> = {
    CLEANING: 'cleaning_services',
    FOOD: 'restaurant',
    UTILITIES: 'handyman',
    RENT: 'home_work',
    INTERNET: 'wifi',
    ENERGY: 'bolt',
    WATER: 'water_drop',
    GAS: 'local_gas_station',
    TRANSPORT: 'directions_car',
    SUBSCRIPTION: 'subscriptions',
    OTHERS: 'category'
};

export const CategoriaCor: Record<keyof typeof CategoriaEnum, string> = {
    CLEANING: '#0ea5e9',
    FOOD: '#f97316',
    UTILITIES: '#16a34a',
    RENT: '#7c3aed',
    INTERNET: '#2563eb',
    ENERGY: '#eab308',
    WATER: '#0891b2',
    GAS: '#dc2626',
    TRANSPORT: '#9333ea',
    SUBSCRIPTION: '#db2777',
    OTHERS: '#64748b'
};

export function getCategoriaIcone(categoria: CategoriaValor): string {
    const codigo = codigoCategoria(categoria);
    if (!codigo) {
        return CategoriaIcone.OTHERS;
    }

    return CategoriaIcone[codigo as keyof typeof CategoriaIcone] ?? CategoriaIcone.OTHERS;
}

export function getCategoriaCor(categoria: CategoriaValor): string {
    const codigo = codigoCategoria(categoria);
    if (!codigo) {
        return CategoriaCor.OTHERS;
    }

    return CategoriaCor[codigo as keyof typeof CategoriaCor] ?? CategoriaCor.OTHERS;
}
