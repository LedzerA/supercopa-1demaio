/* =====================================================================
   CONFIGURAÇÃO — SuperCopa 1º de Maio 2026
   ---------------------------------------------------------------------
   SUPABASE_URL / SUPABASE_ANON_KEY:
     Supabase -> seu projeto -> Project Settings -> API.
     A anon key é pública por design; a segurança vem das políticas
     RLS (supabase/schema.sql), que exigem `is_copa_admin()`.

   >>> AMBIENTES SEPARADOS <<<
     Este app usa a tabela `copa_admins`, que é INDEPENDENTE da tabela
     `admins` do statsproleta. Estar em uma não dá acesso à outra.
     Para liberar alguém, veja o final de supabase/schema.sql.

   Se um dia quiser um projeto Supabase só da Copa, é só trocar as
   duas constantes abaixo e rodar schema.sql + seed.sql lá.
   ===================================================================== */
export const SUPABASE_URL = "https://jycbewmizgwugoapbbzz.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5Y2Jld21pemd3dWdvYXBiYnp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MDY2MzcsImV4cCI6MjA5OTA4MjYzN30.R9jKcenGlt1crYABuHel4Cjz7l_3h8D4cgPc50Hq4Js";

export const COPA = {
  nome: "SuperCopa 1º de Maio",
  edicao: "2026",
  liga: "Liga Primeiro de Maio",
  /** Art. 3º — taxa por equipe, em 3 parcelas. */
  taxaPorEquipe: 300,
  parcelas: 3,
};

/** Chave do localStorage onde fica a sessão do Supabase.
 *  Diferente da usada pelo statsproleta, para que logar aqui não
 *  derrube (nem herde) a sessão do outro app no mesmo navegador. */
export const STORAGE_KEY = "supercopa1demaio.auth";
