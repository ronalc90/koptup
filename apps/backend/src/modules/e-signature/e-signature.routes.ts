import { Router } from 'express';
import { ESignatureController } from './e-signature.controller';
import { eSignatureService } from './e-signature.service';

const router = Router();
const c = new ESignatureController(eSignatureService);

router.get('/:id/signers', c.signers);
router.post('/signers/:signerId/sign', c.sign);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
