---
name: nightflow-design
description: Reglas de diseño para la landing y el frontend de NIGHTFLOW VIP (React 19 + Vanilla CSS). Úsala al diseñar, rediseñar o revisar cualquier pantalla. Fuerza un resultado simple, con identidad propia y sin elementos genéricos.
---

# Diseño NIGHTFLOW VIP

## Antes de tocar nada
1. Lee AGENTS.md, `src/styles/saas-landing/` y los tokens existentes. No asumas el estado del código.
2. Restricciones fijas: React 19 + TypeScript + Vite, Vanilla CSS modular con variables, **sin Tailwind**, `npm run lint` (check-design-invariants.mjs) sin regresiones. No se cambia de framework.
3. Público: dueños y gerentes de clubes. Piensan en mesas vendidas, puerta y dinero, no en criptografía.

## Dirección visual (fija)
Consola nocturna: base obsidiana `--bg-void` (#08080c), un solo acento oro champán `--gold` (#e5b54f), hairlines de 1px. Estados funcionales: esmeralda (puerta OK), ámbar (hold), rubí (incidente). Nada más de color.

## Principio rector
Simple pero atractivo: cada elemento debe justificar su lugar. Si se puede quitar sin perder claridad, se quita.

## Reglas
| Área | Regla |
|---|---|
| Tipografía | Display con carácter (Outfit) + lectura (Plus Jakarta Sans). Mono solo para cifras y timers. Cinzel solo en el wordmark/sello, no en titulares. |
| Color | Base + 1 acento + 3 estados. Prohibido añadir más. |
| Superficies | Sin vidrio ni sombras difusas por defecto. Separar con espacio, alineación y hairlines. |
| Layout | Una idea por pantalla. Ritmo variable; nunca rejillas de tarjetas idénticas. |
| Movimiento | Máximo 1 interacción memorable por sección. `prefers-reduced-motion` obligatorio. 60 fps en móvil. |
| Copy | Resultado concreto en lenguaje del dueño. Sin jerga (Ed25519, JWS, hold atómico) en titulares ni telemetría visible. |
| Cifras | Solo mostrar métricas medidas o verificables. Si no, no se muestran. |

## Prohibido
- Degradados morados, ilustraciones 3D caricaturescas, iconos decorativos sin función.
- Inter, Arial, Roboto.
- Efectos por moda apilados: border beam + spotlight + tilt giroscópico + halos a la vez. Se elige uno por sección y solo si explica algo.
- Tarjetas borde + icono + título + texto repetidas.
- Etiquetas de "telemetría" decorativas con datos no demostrables.

## Entrega
1. Tabla de decisiones: qué cambia y por qué.
2. CSS modular con tokens, sin valores sueltos.
3. Ejecutar `npm run lint`; revisar a 375 px y 1440 px.
4. Listar qué se eliminó, no solo qué se agregó.
