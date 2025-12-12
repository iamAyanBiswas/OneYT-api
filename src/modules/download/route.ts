import { FastifyInstance } from 'fastify';
import { downloadController } from '@/controllers/download/controller';


export default async function downloadRoute(fastify: FastifyInstance) {
    // GET /download?id=WY-GdTfu6tg&downloadType=video&quality=720p
    fastify.get('/download', {
        //preHandler hook
    }, downloadController);
}
