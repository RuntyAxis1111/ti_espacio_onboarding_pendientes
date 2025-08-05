/*
  # Create equipos_depreciacion_v2 view

  1. New View
    - `equipos_depreciacion_v2`
      - Dynamic depreciation calculation based on actual purchase_cost
      - Model-specific rates: Mac Air 14%, Mac Pro 15%, Lenovo 18%
      - Model-specific residuals: Mac Air 30%, Mac Pro 25%, Lenovo 10%
      - Calculates depreciation_year and book_value_end_year for years 1-5

  2. Features
    - Uses actual purchase_cost from each equipment
    - Handles variable costs correctly
    - Maintains residual value floors
    - Cross joins with generate_series(1,5) for all years
*/

CREATE OR REPLACE VIEW public.equipos_depreciacion_v2 AS
SELECT
  e.serial_number,
  e.purchase_cost,
  e.purchase_date,
  e.model,
  gs.year_n AS year_number,
  /* Tasas por modelo */
  CASE
    WHEN e.model = 'mac_air' THEN 0.14
    WHEN e.model = 'mac_pro' THEN 0.15
    WHEN e.model = 'lenovo'  THEN 0.18
    ELSE 0.20
  END AS rate,
  CASE
    WHEN e.model = 'mac_air' THEN 0.30
    WHEN e.model = 'mac_pro' THEN 0.25
    WHEN e.model = 'lenovo'  THEN 0.10
    ELSE 0.10
  END AS residual_pct,
  /* Depreciación anual en $ */
  ROUND(e.purchase_cost *
        CASE
          WHEN e.model = 'mac_air' THEN 0.14
          WHEN e.model = 'mac_pro' THEN 0.15
          WHEN e.model = 'lenovo'  THEN 0.18
          ELSE 0.20
        END, 2) AS depreciation_year,
  /* Valor libro */
  GREATEST(
    ROUND(e.purchase_cost -
          e.purchase_cost *
          CASE
            WHEN e.model = 'mac_air' THEN 0.14
            WHEN e.model = 'mac_pro' THEN 0.15
            WHEN e.model = 'lenovo'  THEN 0.18
            ELSE 0.20
          END * gs.year_n, 2),
    ROUND(e.purchase_cost *
          CASE
            WHEN e.model = 'mac_air' THEN 0.30
            WHEN e.model = 'mac_pro' THEN 0.25
            WHEN e.model = 'lenovo'  THEN 0.10
            ELSE 0.10
          END, 2)
  ) AS book_value_end_year
FROM public.equipos_ti e
CROSS JOIN generate_series(1,5) AS gs(year_n);