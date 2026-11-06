#!/usr/bin/env bash
# Uso: PGHOST=/tmp/pgtest PGPORT=54329 PGUSER=postgres ./run.sh
# Cria um banco descartável, aplica as migrações e roda os testes de acesso (RLS).
set -euo pipefail
cd "$(dirname "$0")"
DB=trancas_test
psql -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -q -v ON_ERROR_STOP=1 -d $DB -f 00_shim_supabase.sql
for f in ../migrations/*.sql; do echo "-- aplicando $f"; psql -q -v ON_ERROR_STOP=1 -d $DB -f "$f"; done
psql -v ON_ERROR_STOP=0 -d $DB -f 10_rls_tests.sql 2>&1
