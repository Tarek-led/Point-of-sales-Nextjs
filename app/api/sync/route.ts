// app/api/sync/route.ts
import { syncProductsToSupabase } from '../../services/sync';

export async function POST() {
  try {
    await syncProductsToSupabase();
    return new Response(JSON.stringify({ message: 'Data synced successfully to Supabase' }), { status: 200 });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
