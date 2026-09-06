begin;
-- Application revisions are terminal conflicts, not retryable database
-- serialization failures. Some PostgREST/hasql versions repeatedly retry 40001.
-- Change only explicitly raised codes in these three reviewed command bodies;
-- genuine PostgreSQL serialization errors are not caught or reclassified.
do $$
declare target regprocedure; definition text; revised text;
begin
  foreach target in array array[
    'public.gymaf_command(text,uuid,jsonb)'::regprocedure,
    'public.gymaf_member_command(text,uuid,jsonb)'::regprocedure,
    'public.gymaf_training_command(text,uuid,jsonb)'::regprocedure
  ] loop
    definition:=pg_get_functiondef(target);
    revised:=replace(definition,'errcode=''40001''','errcode=''GY409''');
    if revised=definition then raise exception 'Expected application conflict code absent in %',target; end if;
    execute revised;
  end loop;
end $$;
commit;
