# Práctica 2 — Actividad 2: Inclinación (shear)

Adaptación del programa de **Diego Balderas**, integrante del equipo, para mostrar el modelo `modelos/barrel.obj` de `JED-01/Practica2` en vez de la columna de demostración.

Programa original: https://codepen.io/editor/DIEGO-BALDERAS-the-encoder/pen/01a1614a-19cc-72c2-97ca-f2fc150b3deb

## Instrucciones para CodePen

1. Crea **un Pen nuevo** para la Actividad 2 (no reemplaces la Actividad 1).
2. Copia `index.html` a `index.html` de CodePen.
3. Copia `style.css` a `style.css` de CodePen.
4. Copia `script.js` a `script.js` de CodePen.
5. Guarda el Pen y copia su enlace al reporte.

El HTML ya enlaza el CSS y el JavaScript mediante rutas relativas. No requiere Three.js ni paquetes, porque el motor del programa dibuja en un Canvas 2D.

## Funciones

- Carga automática del barril original desde GitHub.
- Comparación gráfica **Original** y **Resultado**.
- Inclinación (shear) a lo largo de X, Y o Z, usando un eje de referencia distinto.
- Ángulo entre -60° y 60° y progreso de la transformación de 0 a 100%.
- Controles de cámara (azimut, elevación y zoom).
- **Restablecer** valores y **Modelo original** para volver a cargar el barril.
- Opción para cargar manualmente otro OBJ si se necesita.

## Modelo y fórmula

El modelo se descarga de:

`https://cdn.jsdelivr.net/gh/JED-01/Practica2@main/modelos/barrel.obj`

En la transformación shear, una coordenada desplazada depende linealmente de otra. Por ejemplo, para mover X usando Y:

`x' = x + k*y`, `y' = y`, `z' = z`, donde `k = tan(ángulo)`.

## Capturas para el reporte

1. Original (ángulo = 0°).
2. Eje X, referencia Y, ángulo = 25°, progreso 100%.
3. Eje Y, referencia Z, ángulo = -25°, progreso 100%.
4. Eje Z, referencia X, ángulo = 35°, progreso 50%.

Mantén el mismo azimut y elevación al comparar las figuras.
