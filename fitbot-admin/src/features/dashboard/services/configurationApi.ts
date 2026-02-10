import api from '../../../services/api';
import { ConfigurationRequest, ConfigurationResponse } from '../../../types/configuration';

export const configurationApi = {
  getConfiguration: async (): Promise<ConfigurationResponse> => {
    const response = await api.get('/configurations/me');
    return response.data;
  },

  updateConfiguration: async (data: ConfigurationRequest): Promise<ConfigurationResponse> => {
    const response = await api.put('/configurations/me', data);
    return response.data;
  },
};