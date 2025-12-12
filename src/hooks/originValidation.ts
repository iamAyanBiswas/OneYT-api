import { FastifyInstance } from "fastify";
import { ORIGIN } from "@/config/name";
export function refererAndOriginCheck(fastify: FastifyInstance) {
    fastify.addHook("preHandler", async (req, res) => {
        const origin = req.headers.origin || ''
        const referer = req.headers.referer || ''

        if (!ORIGIN.includes(origin) && !ORIGIN.includes(referer)) {
            res.status(400).send({ error: 'Request from other origin is not allowed' })
        }

    });
}
