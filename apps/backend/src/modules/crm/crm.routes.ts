import { Router } from 'express';
import { CrmController } from './crm.controller';
import { crmService } from './crm.service';

const router = Router();
const controller = new CrmController(crmService);

// Endpoints específicos del dominio (van ANTES de :id)
router.get('/forecast', controller.forecast);
router.get('/contacts', controller.listContacts);

// CRUD deals
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
