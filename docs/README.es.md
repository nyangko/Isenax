<div align="center">

<img src="../assets/banner.png" alt="Isenax - Herramienta de Diagramas Isométricos" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## Nota:

Este repositorio (Isenax) es un derivado de [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW), que a su vez es un fork de stan-smith/FossFLOW (que a su vez era un fork de [markmanx/isoflow](https://github.com/markmanx/isoflow)), creado originalmente con el propósito de contribuir al repositorio original mediante PRs. Sin embargo, el nombre de usuario de GitHub del autor parece haber cambiado a [mug-book-droid](https://github.com/mug-book-droid) y su actividad se ha vuelto privada (¿quizás la cuenta fue suspendida?), lo que hace que el repositorio original sea inaccesible.

Por ahora, mi intención es hacer de este repositorio (ahora llamado Isenax) una continuación del desarrollo de FossFLOW, y cualquier contribución mediante PRs también es bienvenida.

Puedes consultar el último estado del repositorio original que obtuve en la rama `backup/stan-smith-FossFLOW`.

---

Isenax es una potente aplicación web progresiva (PWA) de código abierto para crear hermosos diagramas isométricos. Construido con React y la biblioteca <a href="https://github.com/markmanx/isoflow">Isoflow</a> (bifurcada y publicada en npm como fossflow, y como isenax en este fork), se ejecuta completamente en tu navegador con soporte sin conexión.

---
<p align="center">
<b>Pruébalo en línea --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Implementación Rápida con Docker

```bash
# Usando Docker Compose (recomendado - incluye almacenamiento persistente)
docker compose up

# O ejecutar directamente desde Docker Hub con almacenamiento persistente
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

El almacenamiento en servidor está habilitado por defecto en Docker. Tus diagramas se guardarán (por defecto como root) en `./diagrams` en el host. Para cambiar el usuario o el ID de grupo utilizado al guardar, establece las variables de entorno `PUID` y `PGID`.

Para deshabilitar el almacenamiento en servidor, establece `ENABLE_SERVER_STORAGE=false`:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### Autenticación Básica HTTP (Opcional)

Protege tu instancia de Isenax con HTTP Basic Auth:

```bash
# Con Docker Compose
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# O con docker run
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **Nota**: Ambas variables deben estar configuradas para habilitar la autenticación. Si alguna está vacía, la aplicación es accesible sin iniciar sesión.

## Inicio Rápido (Desarrollo Local)

```bash
# Clonar el repositorio
git clone https://github.com/nyangko/Isenax
cd Isenax

# Instalar dependencias
npm install

# Compilar la biblioteca (requerido la primera vez)
npm run build:lib

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Monorepo

Este es un monorepo que contiene cuatro paquetes:

- `packages/isenax-lib` - Biblioteca de componentes React para dibujar diagramas de red (construida con Rslib/Rspack)
- `packages/isenax-app` - Progressive Web App que envuelve y presenta la biblioteca (construida con RSBuild)
- `packages/isenax-backend` - Servidor Express que proporciona almacenamiento autoalojado opcional para los diagramas (usado en el despliegue con Docker)
- `packages/isenax-mcp` - Servidor MCP (Model Context Protocol) que permite a un agente de IA externo leer, crear y editar tus diagramas directamente (stdio o Streamable HTTP)

### Comandos de Desarrollo

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo de la aplicación
npm run dev:lib      # Modo watch para desarrollo de biblioteca

# Compilación
npm run build        # Compilar biblioteca y aplicación
npm run build:lib    # Compilar solo biblioteca
npm run build:app    # Compilar solo aplicación

# Pruebas y Linting
npm test             # Ejecutar pruebas unitarias
npm run lint         # Verificar errores de linting

# Pruebas E2E (Selenium)
cd e2e-tests
./run-tests.sh       # Ejecutar pruebas end-to-end (requiere Docker y Python)

# Publicación
npm run publish:lib  # Publicar biblioteca en npm
```

## Cómo Usar

### Crear Diagramas

1. **Agregar Elementos**:
   - Presiona el botón "+" en el menú superior derecho, la biblioteca de componentes aparecerá a la izquierda
   - Arrastra y suelta componentes de la biblioteca al lienzo
   - O haz clic derecho en la cuadrícula y selecciona "Agregar nodo"

2. **Conectar Elementos**:
   - Selecciona la herramienta Conector (presiona 'C' o haz clic en el icono del conector)
   - **Modo de clic** (predeterminado): Haz clic en el primer nodo, luego haz clic en el segundo nodo
   - **Modo de arrastre** (opcional): Haz clic y arrastra desde el primer nodo al segundo
   - Cambia de modo en Configuración → pestaña Conectores

3. **Guardar Tu Trabajo**:
   - **Guardado Rápido** - Guarda en la sesión del navegador
   - **Exportar** - Descargar como archivo JSON
   - **Importar** - Cargar desde archivo JSON

4. **Organizar con el panel de Capas**:
   - Abre Capas desde la barra de herramientas para ver todos los nodos, conectores, áreas y cuadros de texto en una sola lista
   - Selecciona un elemento allí para editarlo en la pestaña «Editar» del mismo panel
   - En pantallas estrechas se abre como panel inferior desde el botón de la esquina inferior derecha del lienzo

### Opciones de Almacenamiento

- **Almacenamiento de Sesión**: Guardados temporales eliminados cuando se cierra el navegador
- **Exportar/Importar**: Almacenamiento permanente como archivos JSON
- **Autoguardado**: Guarda automáticamente los cambios cada 5 segundos en la sesión

### Integración MCP (Agentes de IA)

Isenax incluye un servidor MCP para que un agente de IA externo (Claude, etc.) pueda leer, crear y editar tus diagramas directamente:

1. Abre **Configuración → MCP** y actívalo — se mostrarán una URL de conexión y un token Bearer.
2. Conecta tu cliente MCP a esa URL/token (`packages/isenax-mcp` admite tanto transporte stdio como Streamable HTTP).
3. Los cambios del agente aparecen en vivo en cualquier pestaña abierta que muestre ese diagrama, sin necesidad de recargar — mientras trabaja se muestra un indicador "MCP está escribiendo...".

Los iconos integrados viajan solo por id (no se envían datos base64 al agente), y `update_diagram_patch` permite que un agente envíe solo los campos que cambió en lugar de reenviar todo el modelo.

## Recientemente añadido

### Multiplexación de conectores
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### Copiar y pegar elementos
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## Contribuir

¡Damos la bienvenida a las contribuciones! Por favor consulta [CONTRIBUTING.md](../CONTRIBUTING.md) para las pautas.

## Documentación

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - Guía completa del código base
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Pautas de contribución

## Licencia

MIT
