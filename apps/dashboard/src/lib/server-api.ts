import { cookies } from 'next/headers';
import { buildApiClient } from './api';

export async function serverApi() {
  const store = await cookies();
  return buildApiClient(store.toString());
}
