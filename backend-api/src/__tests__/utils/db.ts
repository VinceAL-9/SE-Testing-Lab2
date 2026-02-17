import { supabase } from "../../supabaseClient";

export const clearDatabase = async () => {
  const { error } = await supabase.from("users").delete().neq("id", 0);

  if (error) {
    throw new Error(`Failed to clear database: ${error.message}`);
  }
};
