# Práctica 2 — Actividad 3: Deformaciones

Código en JavaScript y Canvas 2D, con el mismo diseño y método de dibujo del programa de Diego Balderas usado en la Actividad 2. El modelo es `modelos/barrel.obj` del repositorio `JED-01/Practica2`.

## Ejecutar en CodePen

**Lo más fácil:** abre el Pen de Diego, selecciona **Fork** para crear una copia en tu cuenta y reemplaza solamente el contenido de `script.js` con el nuestro. El script detecta los mismos elementos HTML de Diego, cambia el título y sustituye el enlace a Drive por el de tu GitHub. Cambia también el nombre del Pen a `Actividad 3 - Deformaciones` y guárdalo.

**Alternativa:** crea un Pen nuevo, copia `index.html`, `style.css` y `script.js` de esta carpeta a los archivos correspondientes y guarda el enlace para el reporte.

El HTML ya enlaza correctamente los archivos CSS y JavaScript. **No agregues Three.js ni dependencias adicionales**, porque la proyección se dibuja directamente con Canvas 2D.

## Transformaciones disponibles

Se ofrecen tres modos seleccionables:

| Tipo | Efecto | Máxima magnitud cuando Cantidad = 1 |
| --- | --- | --- |
| Bend (doblado) | Curva progresivamente el barril | 90 grados |
| Twist (torsión) | Gira secciones alrededor del eje Y | 180 grados |
| Taper (afilado) | Estrecha un extremo y ensancha el otro | factor normalizado 1.6 |

La cantidad puede variar de `-1` a `1`, y el control **Progreso (%)** permite observar posiciones intermedias de 0 a 100%.

Las dos vistas comparten los controles de azimut, elevación y zoom. La vista izquierda siempre muestra el modelo original y la derecha muestra la deformación aplicada.

## Capturas sugeridas para el reporte

1. Barril original: cantidad 0.
2. Bend: cantidad 0.8, progreso 100%.
3. Twist: cantidad 0.8, progreso 100%.
4. Taper: cantidad 0.8, progreso 100%.
5. Progreso intermedio: Twist, cantidad 0.8, progreso 50%.

El botón **Restablecer** pone la cantidad en cero; **Modelo original** también vuelve a descargar `barrel.obj` desde GitHub.

Fuente del diseño/representación: [programa de Diego Balderas (Actividad 2)](https://codepen.io/editor/DIEGO-BALDERAS-the-encoder/pen/01a1614a-19cc-72c2-97ca-f2fc150b3deb).
