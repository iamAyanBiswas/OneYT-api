import { FastifyInstance } from "fastify"
import fastifyCors from '@fastify/cors';
import { ORIGIN } from "./name";

export default async function cors(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
        origin: ORIGIN
    })
}