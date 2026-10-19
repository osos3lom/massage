import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector
} from '@powersync/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseConnector implements PowerSyncBackendConnector {
  readonly supabase: SupabaseClient;
  private readonly powerSyncEndpoint: string;

  constructor(supabaseUrl: string, supabasePublishableKey: string, powerSyncEndpoint: string) {
    this.powerSyncEndpoint = powerSyncEndpoint;
    this.supabase = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  }

  async fetchCredentials() {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error || !session) {
      return null;
    }
    return {
      endpoint: this.powerSyncEndpoint,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    try {
      // Send the entire local transaction batch to a single idempotent Postgres RPC
      const ops = transaction.crud.map((op) => ({
        op: op.op,
        table: op.table,
        id: op.id,
        data: op.opData ?? {}
      }));

      const { error } = await this.supabase.rpc('apply_powersync_crud_batch', {
        p_ops: ops
      });

      if (error) {
        // Permanent validation/constraint errors (4xx) -> quarantine & complete so queue never jams
        if (error.code && (error.code.startsWith('23') || error.code.startsWith('42') || error.code === 'PGRST')) {
          console.error('[PowerSync] Permanent batch error, logging to quarantine:', error);
          await this.supabase.from('sync_quarantine').insert({
            payload: ops,
            error_code: error.code,
            error_message: error.message
          });
          await transaction.complete();
          return;
        }
        // Network/5xx transient error -> throw so PowerSync backs off and retries when online
        throw error;
      }

      await transaction.complete();
    } catch (err) {
      console.warn('[PowerSync] Offline or transient upload error, will retry automatically:', err);
      throw err;
    }
  }
}
