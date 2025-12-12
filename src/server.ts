import Fastify from 'fastify';
import 'dotenv/config'

import cors from './config/cors';
import { refererAndOriginCheck } from './hooks/originValidation';

import infoRoute from './modules/info/route';
import downloadRoute from './modules/download/route';


// Create Fastify instance
const app = Fastify({ trustProxy: true });



// Define a simple root route
app.get('/', async (request, reply) => {
    return reply.send({ message: 'sever is running ...' })
});

const start = async () => {
    try {
        //cors
        await cors(app)

        //rete-limiting
        await app.register(import('@fastify/rate-limit'), {
            max: 1,
            timeWindow: '1 second'
        })

        //global hooks
        refererAndOriginCheck(app)

        // Register API routes
        await app.register(infoRoute);
        await app.register(downloadRoute);

        // Start listening
        await app.listen({ port: 5000, host: '0.0.0.0' });
        console.log('Server is running on http://localhost:5000');
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();



