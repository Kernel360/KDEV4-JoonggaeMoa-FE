import api from './api';
import {ApiResponse} from '../types/api';
import {ExpiredContractResponse} from '../types/contract';

export const getExpiredContracts = async (): Promise<ExpiredContractResponse> => {
    const response = await api.get<ApiResponse<ExpiredContractResponse>>('/api/dashboard/expired-contract');
    return response.data.data;
}; 