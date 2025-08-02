
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createEvSpecInputSchema, 
  updateEvSpecInputSchema,
  createMarketPriceInputSchema,
  getMarketPricesInputSchema,
  estimateEvValueInputSchema 
} from './schema';

// Import handlers
import { createEvSpec } from './handlers/create_ev_spec';
import { getEvSpecs } from './handlers/get_ev_specs';
import { updateEvSpec } from './handlers/update_ev_spec';
import { createMarketPrice } from './handlers/create_market_price';
import { getMarketPrices } from './handlers/get_market_prices';
import { estimateEvValue } from './handlers/estimate_ev_value';
import { getEvValueEstimations } from './handlers/get_ev_value_estimations';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // EV Specification endpoints
  createEvSpec: publicProcedure
    .input(createEvSpecInputSchema)
    .mutation(({ input }) => createEvSpec(input)),
  
  getEvSpecs: publicProcedure
    .query(() => getEvSpecs()),
  
  updateEvSpec: publicProcedure
    .input(updateEvSpecInputSchema)
    .mutation(({ input }) => updateEvSpec(input)),
  
  // Market Price endpoints
  createMarketPrice: publicProcedure
    .input(createMarketPriceInputSchema)
    .mutation(({ input }) => createMarketPrice(input)),
  
  getMarketPrices: publicProcedure
    .input(getMarketPricesInputSchema)
    .query(({ input }) => getMarketPrices(input)),
  
  // EV Value Estimation endpoints
  estimateEvValue: publicProcedure
    .input(estimateEvValueInputSchema)
    .mutation(({ input }) => estimateEvValue(input)),
  
  getEvValueEstimations: publicProcedure
    .query(() => getEvValueEstimations()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`EV Value Estimation TRPC server listening at port: ${port}`);
}

start();
