import { Router } from 'express';

import UserController from './controllers/UserController';
import JsonConverterController from './controllers/json-converter-controller';

const routes = Router();

routes.get('/users', UserController.index);
routes.post('/users', UserController.store);
routes.post('/converter', JsonConverterController.jsonConvert.bind(JsonConverterController));

export default routes;
