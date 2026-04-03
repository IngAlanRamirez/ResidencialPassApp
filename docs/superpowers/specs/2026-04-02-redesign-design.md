# Rediseño UI/UX — ResidencialPassApp

**Fecha:** 2026-04-02
**App:** Residencial Villa María — Control de acceso por QR
**Stack:** Angular 20 + Ionic 8 + Capacitor 8

---

## Decisiones de diseño aprobadas

### 1. Dirección visual
- **Estilo:** Cálido & Confiable — cercano, humano, transmite seguridad sin ser frío
- **Modo:** Claro como primario, oscuro como secundario (ambos aprobados)
- **Fuente:** Plus Jakarta Sans (Google Fonts) — geométrica, legible en móvil

### 2. Paleta — Terracota

| Token | Valor | Uso |
|-------|-------|-----|
| `--rp-stone-950` | `#1c1917` | Header, texto principal, fondo dark mode |
| `--rp-stone-700` | `#44403c` | Texto secundario |
| `--rp-primary` | `#ea580c` | CTA, acento, naranja teja |
| `--rp-primary-dark` | `#c2410c` | Pressed state, badges de alerta |
| `--rp-primary-tint` | `#fff7ed` | Fondos de iconos primarios |
| `--rp-bg` | `#fafaf9` | Fondo de página |
| `--rp-surface` | `#ffffff` | Cards e inputs |
| `--rp-success` | `#16a34a` | Estado completado |
| `--rp-danger` | `#dc2626` | Errores, cancelar |

**Dark mode:** `@media (prefers-color-scheme: dark)` en `global.scss` redefine `--rp-bg: #111110` y `--rp-surface: #1c1917`. Un solo token por concepto, el valor cambia con el tema. El acento `#ea580c` es idéntico en ambos modos.

### 3. Tipografía

| Nivel | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| Display | 26px | 800 ExtraBold | Títulos hero (Welcome) |
| Heading | 18px | 700 Bold | Títulos de sección |
| Label | 14px | 600 SemiBold | Etiquetas de acción |
| Body | 13px | 400 Regular | Contenido principal |
| Caption | 11px | 400 Regular | Metadatos, fechas |

### 4. Radios y espaciado

| Token | Valor | Uso |
|-------|-------|-----|
| `--rp-radius-sm` | `6px` | Badges, chips pequeños |
| `--rp-radius-md` | `10px` | Inputs internos, items secundarios |
| `--rp-radius-lg` | `14px` | Cards principales |
| `--rp-radius-xl` | `18px` | Cards hero, modals |
| `--rp-radius-full` | `9999px` | Badges de estado, pills |

- **Touch targets mínimos:** 48px de altura
- **Padding horizontal de página:** 20px
- **Sombra de card:** `0 2px 12px rgba(0,0,0,0.08)`

---

## Componentes base (shared)

Ubicación: `src/app/shared/components/`

### RpButtonComponent
```
Variantes: primary | secondary | danger
Estados: default | loading | disabled
Height: 48px
Border-radius: 12px
Font-weight: 700
```

| Variante | Background | Color |
|----------|-----------|-------|
| primary | `#ea580c` | white |
| secondary | white | `#1c1917`, borde `#e7e5e4` |
| danger | `#fef2f2` | `#dc2626`, borde `#fecaca` |

### RpInputComponent
- Label flotante encima del valor
- Borde default: `1.5px solid #e7e5e4`
- Borde focused: `1.5px solid #ea580c` + ring `0 0 0 3px #fff7ed`
- Borde error: `1.5px solid #dc2626` + ring `0 0 0 3px #fef2f2`
- Mensaje de error debajo en `#dc2626`
- Min-height: 56px

### RpCardComponent
```
Variantes: action | list-item
```
- **action:** `border-radius: 16px`, `padding: 20px 16px`, icono centrado arriba, CTA abajo
- **list-item:** `border-radius: 12px`, icono a la izquierda, contenido, flecha derecha

### RpBadgeComponent
Input: `status: 'pending' | 'used' | 'finished' | 'expired' | 'cancelled'` o `role: 'vecino' | 'admin' | 'vigilancia'`

| Status | Background | Borde | Color texto |
|--------|-----------|-------|-------------|
| pending | `#fff7ed` | `#fed7aa` | `#c2410c` |
| finished | `#f0fdf4` | `#bbf7d0` | `#15803d` |
| cancelled | `#fef2f2` | `#fecaca` | `#dc2626` |
| expired | `#f8fafc` | `#e2e8f0` | `#64748b` |
| used | `#fff7ed` | `#fed7aa` | `#c2410c` | entrada registrada, salida pendiente |
| active | `#f0fdf4` | `#bbf7d0` | `#15803d` |
| suspended | `#fafaf9` | `#e7e5e4` | `#78716c` |

---

## Patrones de navegación

### Patrón general: Action-First
La acción principal de cada rol ocupa el protagonismo visual (hero card). Las secundarias son compactas debajo.

### Por rol

**Vecino:**
- Hero: Nueva Visita (card grande con CTA)
- Secundarias: Historial, Mi Perfil (2 cards compactas)
- Pie: Próxima visita (preview del siguiente evento)

**Vigilancia:**
- Hero: Escanear QR (card oscura prominente, cámara)
- Secundaria: Mi Bitácora con contador de escaneos del turno
- Pie: Último escaneo registrado

**Admin (también vecino):**
- Header: Mini stats (Vecinos activos / Pendientes / Vigilantes)
- Zona "Mis visitas": Nueva Visita + Historial (2 cards lado a lado)
- Divider con label "ADMINISTRACIÓN"
- Zona Admin: Lista priorizada (Registros pendientes con badge, Vecinos, Vigilantes, Registrar vigilante)

---

## Pantallas — Diseño detallado

### Auth Welcome
- Hero oscuro con gradiente (`#1c1917` → `#3c2415`)
- Logo cuadrado naranja con `border-radius: 20px` y sombra naranja
- Nombre de la app en blanco, tagline en gris
- Dos botones: "Iniciar sesión" (primary) y "Registrarme" (secondary)
- Marca AR Solutions MX al pie

### Login
- Header `#1c1917` con back button + título
- Inputs con label flotante: Teléfono y Contraseña
- Toggle de visibilidad en contraseña
- Checkbox "Recordar contraseña" (ya implementado, mantener)
- Link "Olvidé mi contraseña" visible en naranja (actualmente stub — se implementa en features)
- CTA primary "Ingresar"

### Register — 3 pasos con progress bar
- Progress bar de 3 segmentos en el header
- **Paso 1:** Domicilio (calle select, número, letra opcional en fila)
- **Paso 2:** Acceso (teléfono, contraseña, confirmar contraseña)
- **Paso 3:** Confirmación / revisión
- CTA "Siguiente →" en cada paso

### Home (ver sección "Patrones de navegación")

### Nueva Visita
- Header con back button y domicilio del vecino
- Toggle chips para horario: **"Abierto" | "Fecha/hora"** (reemplaza el checkbox actual)
  - Si "Abierto": no se muestra el picker de fecha
  - Si "Fecha/hora": aparece el datetime-picker
- Campos: Nombre visitante, Motivo (select), Entrada, Salida, Nota (opcional)
- CTA "Generar código QR →"

### Detalle Visita / QR
- Header con badge de estado de la visita
- Card central con QR grande (mínimo 200px × 200px)
- Nombre del visitante y datos clave bajo el QR
- Advertencia `⚠️ Se requiere INE, Licencia o Pasaporte` en tint naranja
- CTA primary "↗️ Compartir QR"
- Acción secundaria "Cancelar visita" en rojo (solo si status === 'pending')

### Escanear Visita (Vigilancia)
- Pantalla oscura (`#111110`)
- Viewfinder con esquinas en `#ea580c` y línea de escaneo animada
- Al detectar QR: panel inferior muestra datos de la visita
- Chips para tipo de identificación: INE | Pasaporte | Licencia (reemplaza select actual)
- Toggle "¿Con vehículo?" → campo de placa condicional
- CTA "✓ Registrar entrada" o "✓ Registrar salida" según estado

### Historial
- Filtro segmentado en header: Todas | Pendientes | Pasadas
- Items de visita con borde lateral de color semántico (naranja=pendiente, verde=completada, gris=cancelada/vencida)
- Cada item muestra: nombre, fecha/hora, motivo, identificación (si aplica), badge de estado
- Pull-to-refresh nativo
- Acción "Cancelar visita" como botón inline dentro del item expandido al tocar (solo si status === 'pending', solo para rol vecino/admin). Sin swipe — interfiere con el scroll nativo en móvil.

---

## Archivos a crear/modificar

### Nuevos
```
src/theme/variables.scss          — CSS custom properties (tokens)
src/theme/typography.scss         — Plus Jakarta Sans + escala
src/app/shared/components/
  rp-button/
    rp-button.component.ts
    rp-button.component.html
    rp-button.component.scss
  rp-input/
    rp-input.component.ts
    rp-input.component.html
    rp-input.component.scss
  rp-card/
    rp-card.component.ts
    rp-card.component.html
    rp-card.component.scss
  rp-badge/
    rp-badge.component.ts
    rp-badge.component.html
    rp-badge.component.scss
```

### Modificados
```
src/index.html                    — Google Fonts import (Plus Jakarta Sans)
src/global.scss                   — Import tokens + dark mode media query
src/app/features/auth/auth-welcome/
src/app/features/auth/login/
src/app/features/auth/register/   — Dividir en 3 pasos
src/app/features/home/home.page.* — Lógica dual zone admin
src/app/features/home/nueva-visita/
src/app/features/home/detalle-visita/
src/app/features/home/escanear-visita/
src/app/features/home/historial-visitas/
```

---

## Restricciones técnicas

- **Ionic como shell únicamente:** IonContent, IonPage, IonHeader/Toolbar para safe areas y navegación. Todos los componentes visuales son custom.
- **Mobile-first:** touch targets ≥ 48px, sin hover states, bottom sheets en lugar de modals donde sea posible
- **Sin romper funcionalidad existente:** solo cambios de presentación en esta fase. La lógica de servicios, guards e interceptores no se toca.
- **Angular standalone components:** mantener el patrón actual, los nuevos componentes shared son standalone.
- **Dark mode vía CSS:** `@media (prefers-color-scheme: dark)` en `global.scss`, sin lógica de Angular.
