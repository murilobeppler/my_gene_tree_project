import axios from 'axios';
import { Person } from '@/types/family';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
});

export const updatePerson = async (id: string, data: Partial<Person>) => {
    const response = await api.patch(`/people/${id}`, data);
    return response.data;
};

export const uploadMedia = async (personId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('person_id', personId);

    const response = await api.post('/upload/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
