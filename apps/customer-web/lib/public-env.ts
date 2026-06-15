import { z } from 'zod';

const publicEnvSchema = z.object({
  googleMapsApiKey: z.string().trim().default(''),
});

export const publicEnv = publicEnvSchema.parse({
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
});
