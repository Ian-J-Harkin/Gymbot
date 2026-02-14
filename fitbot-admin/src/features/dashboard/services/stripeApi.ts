import api from '../../../services/api';

export const stripeApi = {
    async createCheckoutSession() {
        const response = await api.post('/stripe/create-checkout-session');
        return response.data; // returns { url: "..." }
    },
};
