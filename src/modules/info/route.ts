import { FastifyInstance } from 'fastify';
import { infoController } from '@/controllers/info/controller';

/**
 * Info Route
 * Registers the /info endpoint with middleware and controller
 */
export default async function infoRoute(fastify: FastifyInstance) {

    fastify.get('/info', {
        // preHandler: [validateQueryParams]
    }, infoController);
}
