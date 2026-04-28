import app from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`Backend démarré sur http://localhost:${env.port}`);
});
