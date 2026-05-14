import { Router } from 'express';
import { VoiceAiController } from './voice-ai.controller';
import { voiceAiService } from './voice-ai.service';

const router = Router();
const c = new VoiceAiController(voiceAiService);

router.get('/transcripts', c.transcripts);
router.post('/call/start', c.startCall);
router.get('/', c.list);
router.get('/:id', c.get);
router.post('/', c.create);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

export default router;
