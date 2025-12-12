# Fastify Project with TypeScript

A Fastify server project built with TypeScript, featuring type-safe routes and examples.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Running the Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`.

## Available Routes

- **GET /**: Welcome message
  ```
  GET http://localhost:3000/
  ```

- **GET /hello/:name**: Personalized greeting (typed parameters)
  ```
  GET http://localhost:3000/hello/John
  ```

- **POST /data**: Echo back JSON data (typed body)
  ```
  POST http://localhost:3000/data
  Content-Type: application/json
  
  {
    "key": "value"
  }
  ```

## Project Structure

```
.
├── src/
│   └── server.ts       # Main Fastify server file (TypeScript)
├── dist/               # Compiled JavaScript output
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies and scripts
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## Scripts

- `npm run dev` - Start development server with hot reload using tsx
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled production server

## TypeScript Features

- ✅ Full type safety with strict mode enabled
- ✅ Typed route parameters and request bodies
- ✅ Fastify type definitions included
- ✅ Source maps for easier debugging
- ✅ Hot reload in development

## Next Steps

- Add more typed routes in `src/server.ts`
- Set up environment variables with `dotenv` and typed config
- Add request validation with Fastify schemas and TypeBox
- Implement error handling with typed error responses
- Add database connectivity with TypeORM or Prisma
- Set up testing with Jest or Vitest

## Documentation

- [Fastify Documentation](https://www.fastify.io/)
- [Fastify TypeScript Documentation](https://www.fastify.io/docs/latest/Reference/TypeScript/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

