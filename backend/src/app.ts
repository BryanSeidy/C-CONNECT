import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import productsRoutes from './modules/products/products.routes';
import ordersRoutes from './modules/orders/orders.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import escrowRoutes from './modules/escrow/escrow.routes';
import matchingRoutes from './modules/matching/matching.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API CEMAC Connect OK' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/matching', matchingRoutes);

app.use(errorHandler);

export default app;
