/*
  # Crear vista equipos_depreciacion_live

  1. Nueva Vista
    - `equipos_depreciacion_live`
      - Calcula valor libro en tiempo real usando fracción exacta de año
      - Incluye tasa de depreciación por modelo
      - Mantiene depreciación anual fija para referencia

  2. Cálculos
    - `years_exact`: Fracción exacta de años transcurridos desde purchase_date
    - `book_value_today`: Valor libro actual con depreciación diaria
    - `rate`: Tasa de depreciación según modelo
    - `depreciation_year`: Depreciación anual fija

  3. Tasas por modelo
    - Mac Air: 14% anual, residual 30%
    - Mac Pro: 15% anual, residual 25%
    - Lenovo: 18% anual, residual 10%
    - Default: 20% anual, residual 10%
*/

create or replace view public.equipos_depreciacion_live as
with base as (
  select
    e.serial_number,
    e.purchase_date,
    e.purchase_cost,
    e.model,
    -- tasa y residual por modelo
    case
      when e.model = 'mac_air' then 0.14
      when e.model = 'mac_pro' then 0.15
      when e.model = 'lenovo'  then 0.18
      else 0.20
    end as rate,
    case
      when e.model = 'mac_air' then 0.30
      when e.model = 'mac_pro' then 0.25
      when e.model = 'lenovo'  then 0.10
      else 0.10
    end as residual_pct,
    -- fracción exacta de años transcurridos
    extract(epoch from (current_date - e.purchase_date))/86400.0/365.0 as years_exact
  from public.equipos_ti e
  where e.purchase_date is not null
    and e.purchase_cost is not null
)
select
  b.*,
  -- depreciación anual fija (para columnas Año 1-5)
  round(b.purchase_cost * b.rate, 2) as depreciation_year,
  -- valor libro hoy con fracción de año
  greatest(
    round(b.purchase_cost - (b.purchase_cost * b.rate * b.years_exact), 2),
    round(b.purchase_cost * b.residual_pct, 2)
  ) as book_value_today
from base b;