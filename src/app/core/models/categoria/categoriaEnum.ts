export enum CategoriaEnum {
    CLEANING = 'Limpeza',
    FOOD = 'Alimento',
    UTILITIES = 'Utilitários',
    RENT = 'Aluguel',
    INTERNET = 'Internet',
    ENERGY = 'Energia',
    WATER = 'Água',
    GAS = 'Gás',
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
    OTHERS: 'category'
};

export function getCategoriaIcone(categoria: string | null | undefined): string {
    if (!categoria) {
        return CategoriaIcone.OTHERS;
    }

    return CategoriaIcone[categoria as keyof typeof CategoriaIcone] ?? CategoriaIcone.OTHERS;
}
