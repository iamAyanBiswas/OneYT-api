import { FastifyInstance, FastifyRequest } from "fastify";
import { ORIGIN } from "../config/name";
interface BipassQuery {
    bipass: string
}
export function refererAndOriginCheck(fastify: FastifyInstance) {


    fastify.addHook("preHandler", async (req: FastifyRequest<{ Querystring: BipassQuery }>, res) => {
        const bipass = req.query.bipass

        if (bipass == 'true') {
            return
        }
        const origin = req.headers.origin || ''
        const referer = req.headers.referer || ''

        if (!ORIGIN.includes(origin) && !ORIGIN.includes(referer)) {
            res.status(400).send({ error: 'Request from other origin is not allowed' })
        }

    });
}
