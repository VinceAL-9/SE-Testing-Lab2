import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test'});

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
// const serviceRoleKey = process.env.SERVICE_ROLE_KEY!;
export const testClient = createClient(supabaseUrl, supabaseKey)

export const clearDatabase = async () => {
    const { error } = await testClient
        .from('cart_items')
        .delete()
        .neq('id', 0)

    if (error) {
        throw new Error('Failed to clear database: ${error.messagae}')
    }
}

