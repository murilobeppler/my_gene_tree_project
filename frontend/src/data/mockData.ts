import { FamilyTreeData } from '../types/family';

export const mockFamilyData: FamilyTreeData = {
    rootId: '1', // Murilo (Foco)
    people: {
        '1': {
            id: '1',
            firstName: 'Murilo',
            lastName: 'Beppler',
            gender: 'male',
            birthDate: '1995-01-01', // Data fictícia
            fatherId: '2',
            motherId: '3',
        },
        '2': {
            id: '2',
            firstName: 'João',
            lastName: 'Beppler',
            gender: 'male',
            birthDate: '1965-05-20',
            spouses: ['3'],
            children: ['1'],
        },
        '3': {
            id: '3',
            firstName: 'Maria',
            lastName: 'Silva',
            gender: 'female',
            birthDate: '1968-08-15',
            spouses: ['2'],
            children: ['1'],
        },
        '4': {
            id: '4',
            firstName: 'Antônio',
            lastName: 'Beppler',
            gender: 'male',
            birthDate: '1940-02-10',
            deathDate: '2010-11-05',
            children: ['2'],
        },
        '5': {
            id: '5',
            firstName: 'Ana',
            lastName: 'Souza',
            gender: 'female',
            birthDate: '1942-07-22',
            children: ['2'],
        },
    },
};
