import { updatePaymentStatus } from '../payments/payments.service';

export const releaseEscrow = async (paymentId: number) => updatePaymentStatus(paymentId, 'RELEASED');
