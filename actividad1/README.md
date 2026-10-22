# Práctica 2 — Actividad 1: Transformaciones afines

Programa 3D interactivo con Three.js que carga `modelos/barrel.obj` del repositorio `JED-01/Practica2`.

## Ejecutar en CodePen

1. Entra en https://codepen.io/pen/ y crea un Pen nuevo.
2. Copia todo `codepen.html` al panel **HTML**.
3. Copia todo `style.css` al panel **CSS**.
4. Copia todo `script.js` al panel **JS**.
5. Usa JavaScript normal, **sin preprocesador**. No necesitas instalar paquetes ni agregar recursos externos en las opciones: el mapa de importación del panel HTML carga Three.js 0.181.0 y sus complementos.
6. Guarda el Pen para obtener el enlace que debe incluirse en el reporte.

> El archivo `codepen.html` es un fragmento para pegar en el panel HTML de CodePen, no una página independiente. En CodePen los tres paneles se combinan automáticamente.

## Funciones

- Traslación independiente en X, Y y Z, rango -3 a 3 unidades.
- Rotación independiente en X, Y y Z, rango -180° a 180°.
- Escala independiente en X, Y y Z, factores de 0.25 a 2.5.
- Controles de cámara con el mouse, cuadrícula y ejes opcionales.
- Restablecer los nueve parámetros y la cámara.
- Modo de malla para visualizar la triangulación.

## Archivo 3D

Modelo original: `modelos/barrel.obj`, de Kenney (CC0). Se carga desde:

`https://cdn.jsdelivr.net/gh/JED-01/Practica2@main/modelos/barrel.obj`

La geometría se centra y se normaliza a 2.5 unidades sin alterar sus proporciones. Los cambios hechos por el usuario se aplican después al grupo padre, por lo que la transformación inicial de normalización no afecta los valores mostrados en los controles.

El OBJ referencia `barrel.mtl`, pero no es necesario subir ese archivo: el programa asigna materiales de iluminación propios a las secciones `cloth` y `metal`.

## Capturas sugeridas para el reporte

1. Figura original (todos los controles en sus valores iniciales).
2. Traslación: X = 1.5, Y = 0.5, Z = -1.
3. Rotación: X = 30°, Y = 45°, Z = 15°.
4. Escalamiento: X = 1.5, Y = 0.8, Z = 1.2.

Después de cada captura, presiona **Restablecer transformaciones** para aislar los resultados de la siguiente operación.
