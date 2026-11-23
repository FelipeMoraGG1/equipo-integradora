# Gestión del proceso de liberación y despliegue continuo de Tinehnemi

**Universidad Tecnológica de Tehuacán**  
**Materia:** 10B Gest. Proc. de Des SW  
**Cuatrimestre y grupo:** 10 B  
**Alumno:** Felipe Mora López  
**Docente:** Julieta E. H. Guzmán  
**Proyecto:** Tinehnemi  
**Fecha:** 22 de noviembre de 2026

---

## 1. Introducción

Este caso de estudio define un proceso de integración, liberación y despliegue continuo para Tinehnemi, una aplicación móvil educativa desarrollada con React Native y Expo. Su propósito es facilitar el aprendizaje del náhuatl de la Sierra Negra de Puebla mediante lecciones organizadas por niveles, vocabulario, historias tradicionales, exámenes y minijuegos.

El repositorio utiliza Expo Router para la navegación, componentes funcionales de React, TypeScript y archivos JSON para almacenar el contenido didáctico. El contexto global administra los perfiles y el progreso del estudiante, que se guardan localmente mediante AsyncStorage. El proyecto ya cuenta con configuración de Expo Application Services (EAS), un identificador de proyecto remoto, perfiles de compilación y un identificador Android.

El alcance de esta implementación se centra en Android. La compilación se ejecuta en EAS Build y la publicación en Google Play se plantea como una acción controlada hacia la pista de pruebas internas. No se publicará automáticamente en producción.

## 2. Justificación del flujo de trabajo (pipeline)

Se seleccionó GitHub Actions como herramienta de integración continua y Expo Application Services (EAS) para compilar y entregar la aplicación móvil. Esta combinación es adecuada porque el código está alojado en GitHub y la aplicación utiliza Expo. Así se aprovecha la infraestructura remota de compilación de EAS y se evita mantener un servidor propio para generar paquetes Android.

El pipeline está compuesto por dos flujos complementarios:

### 2.1 Integración continua (CI)

El workflow ubicado en .github/workflows/ci.yml se ejecuta cuando se abre o actualiza un pull request hacia main, cuando se hacen cambios en main o cuando se inicia manualmente. Sus etapas son:

1. Descargar el código fuente.
2. Configurar Node.js 22.
3. Instalar dependencias de forma reproducible con npm ci.
4. Ejecutar ESLint mediante npm run lint.
5. Preparar metadatos del entorno con npm run release:prepare.
6. Ejecutar las pruebas de liberación con npm run release:test.
7. Ejecutar Expo Doctor para revisar la configuración y compatibilidad del proyecto.

Si una etapa falla, el workflow termina con error. El equipo debe corregir el problema antes de integrar o liberar el cambio.

### 2.2 Liberación y despliegue continuo (CD)

El workflow .github/workflows/release-android.yml puede iniciarse al crear una etiqueta Git que comience con v, por ejemplo v1.0.1, o mediante una ejecución manual desde GitHub Actions. El flujo repite las comprobaciones de calidad, verifica que exista el secreto EXPO_TOKEN y ejecuta el script de despliegue.

El script utiliza EAS CLI para construir el paquete Android con el perfil production y espera a que finalice la compilación. Por seguridad, crear una etiqueta genera el build, pero no publica automáticamente en la tienda. Para enviar la versión a Google Play se debe iniciar el workflow manualmente y activar la opción submit_to_play_store. El destino está configurado como pista internal.

### 2.3 Justificación de la secuencia

Primero se comprueba el estilo y la estructura; después se valida la configuración, la integridad de los recursos y la compatibilidad Expo; finalmente se genera el artefacto Android. Separar la compilación de la publicación reduce el riesgo de distribuir una versión sin revisión. La publicación en una tienda puede afectar a usuarios reales y requiere credenciales y controles adicionales.

## 3. Entorno requerido para la liberación y despliegue continuo

### 3.1 Entorno de desarrollo

- Windows 10/11, macOS o Linux.
- Node.js 22 LTS y npm.
- Git y acceso al repositorio.
- Cuenta GitHub con permisos de escritura.
- Cuenta Expo con acceso al proyecto EAS.
- Conexión a internet para instalar dependencias y comunicarse con EAS.

No es necesario instalar Android Studio para que GitHub Actions produzca un build remoto mediante EAS. Android Studio, un emulador o un dispositivo físico son recomendables para realizar pruebas funcionales locales.

### 3.2 Entorno de integración continua

GitHub Actions utiliza un runner administrado ubuntu-latest, Node.js 22 y npm. Las dependencias se instalan con npm ci, respetando package-lock.json. ESLint y Node Test Runner validan el código y el entorno. Expo Doctor revisa la compatibilidad de dependencias y configuración.

### 3.3 Entorno de distribución

- Proyecto EAS identificado en app.json.
- Identificador Android definido en expo.android.package.
- Perfil production configurado en eas.json.
- Credenciales de firma Android administradas por EAS.
- Para enviar a Google Play: aplicación registrada en Play Console y credencial de cuenta de servicio de Google registrada en Expo.

### 3.4 Seguridad de credenciales

El token de Expo se almacena en GitHub Actions como secreto del repositorio llamado EXPO_TOKEN. No debe escribirse en package.json, app.json, eas.json, workflows ni en archivos versionados. Las credenciales de Google Play tampoco deben subirse al repositorio; deben registrarse en el administrador de credenciales de Expo.

## 4. Niveles de servicio acordados (SLA)

Los valores siguientes son objetivos propuestos para el proyecto académico. No representan mediciones históricas ni un contrato comercial vigente.

| Indicador | Objetivo propuesto | Medición |
|---|---:|---|
| Disponibilidad de CI/CD | 99.0% mensual, excluyendo mantenimiento de proveedores | Historial de ejecuciones |
| Retroalimentación de CI | 10 minutos o menos para cambios ordinarios | Duración del workflow |
| Preparación del build Android | 30 minutos o menos, sujeto a cola y servicio EAS | Duración de compilación |
| Validaciones obligatorias previas a liberar | 100% aprobadas | Resultado del workflow |
| Recuperación ante error del pipeline | 1 día hábil como meta académica | Tiempo de detección y corrección |
| Revisión antes de publicación pública | 100% de versiones pasan por prueba interna | Registro de aprobación |

Los objetivos deberán revisarse cuando existan ejecuciones suficientes para calcular promedios reales.

## 5. Métricas para el monitoreo de la aplicación

Actualmente el repositorio no incorpora una plataforma de telemetría remota ni un backend de usuarios. Por ello, se distinguen las métricas que pueden consultarse en GitHub Actions/EAS de las métricas de producto que deberán instrumentarse en una fase posterior.

### 5.1 Métricas del pipeline

| Métrica | Definición | Objetivo |
|---|---|---:|
| Tasa de éxito CI | Ejecuciones aprobadas / total de ejecuciones × 100 | ≥ 95% |
| Duración media CI | Tiempo desde inicio hasta finalización del workflow | ≤ 10 min |
| Tasa de éxito de builds | Builds EAS exitosos / builds iniciados × 100 | ≥ 95% |
| Lead time de liberación | Tiempo desde merge a main hasta build disponible | ≤ 1 día |
| Frecuencia de liberación | Número de builds de producción por periodo | Reporte mensual |
| Tasa de fallos posteriores | Versiones con corrección urgente / versiones publicadas | Tendencia decreciente |

### 5.2 Métricas de la aplicación móvil

- Tasa de sesiones sin cierre inesperado (crash-free sessions).
- Tiempo de inicio hasta que la pantalla principal esté disponible.
- Tiempo de carga de lecciones y vocabulario.
- Intentos fallidos de reproducción de audio.
- Porcentaje de operaciones correctas de guardado y recuperación del progreso en AsyncStorage.
- Lecciones completadas, exámenes aprobados y usuarios activos, mediante instrumentación futura y datos agregados.

Para recolectar métricas de usuarios se requerirá una solución de telemetría, aviso de privacidad, minimización de datos y las autorizaciones que correspondan. No se deben recopilar nombres ni información sensible sin necesidad.

## 6. Parámetros de configuración de las herramientas

### 6.1 GitHub Actions

- Workflows ubicados en .github/workflows/.
- Runner ubuntu-latest.
- Node.js 22.
- Instalación reproducible con npm ci.
- Permiso mínimo de repositorio: contents: read.
- Eventos CI: pull_request hacia main, push a main y workflow_dispatch.
- Eventos de liberación: etiquetas v* y workflow_dispatch.
- Secreto requerido: EXPO_TOKEN.
- Entrada manual opcional: submit_to_play_store.

### 6.2 Expo Application Services

app.json define el nombre, versión, identificador Android y EAS projectId. eas.json define tres perfiles:

- development: cliente de desarrollo y distribución interna.
- preview: distribución interna para pruebas.
- production: build de producción con incremento automático de versión.

El envío production.android.track está configurado en internal para que la primera distribución sea limitada.

### 6.3 ESLint, Node Test Runner y Expo Doctor

ESLint se ejecuta mediante npm run lint. Node Test Runner ejecuta el archivo scripts/release/tests/release-config.test.mjs. Expo Doctor revisa la configuración y compatibilidad del proyecto Expo. Las pruebas adicionales verifican los manifiestos de configuración, los perfiles EAS, la sintaxis de los JSON didácticos y la existencia de recursos importados estáticamente.

### 6.4 Scripts npm

| Comando | Propósito |
|---|---|
| npm run release:prepare | Verifica archivos requeridos y genera metadatos en .release/ |
| npm run release:test | Ejecuta las pruebas automatizadas de liberación |
| npm run release:deploy | Construye Android con EAS y permite envío opcional |

## 7. Herramienta de liberación continua y vinculación con el entorno

GitHub Actions orquesta el flujo desde el repositorio. EAS Build recibe la configuración del proyecto y genera el paquete Android. EAS Submit utiliza la credencial de cuenta de servicio de Google registrada en Expo para transferir el paquete a la pista interna de Play Console.

Para habilitar el proceso real:

1. En Expo, generar un Access Token desde la configuración de la cuenta.
2. En GitHub, abrir Settings → Secrets and variables → Actions y crear el secreto EXPO_TOKEN.
3. Verificar que la cuenta Expo tenga acceso al proyecto EAS vinculado en app.json.
4. Configurar las credenciales Android de firma en EAS.
5. Para el envío, registrar la aplicación en Google Play Console y cargar la clave JSON de la cuenta de servicio en las credenciales de Expo Submit.
6. Ejecutar manualmente Release Android - Tinehnemi y activar submit_to_play_store solo cuando el build esté aprobado.

Los archivos del workflow y la referencia al proyecto EAS quedan preparados en el repositorio. La ejecución real y el envío a Play Store dependen de configurar los secretos y credenciales privados de las cuentas responsables.

## 8. Scripts entregados en el repositorio

| Ruta | Función |
|---|---|
| .github/workflows/ci.yml | Pipeline de integración continua |
| .github/workflows/release-android.yml | Pipeline de liberación Android |
| scripts/release/prepare-release.mjs | Preparación del entorno y metadatos |
| scripts/release/tests/release-config.test.mjs | Pruebas del entorno de liberación |
| scripts/release/deploy-android.mjs | Generación del build y envío opcional |
| docs/CI_CD_TINEHNEMI.md | Guía técnica de configuración y ejecución |
| package.json | Comandos npm de liberación |
| eas.json | Perfiles de compilación y pista interna |

## 9. Procedimiento de ejecución

### 9.1 Validación local

Desde la raíz del proyecto ejecutar:

    npm ci
    npm run lint
    npm run release:prepare
    npm run release:test
    npx expo-doctor

### 9.2 Liberación

1. Integrar los cambios validados a main.
2. Crear una etiqueta de versión, por ejemplo git tag v1.0.1.
3. Subir la etiqueta mediante git push origin v1.0.1.
4. Revisar el workflow Release Android en GitHub Actions.
5. Consultar el artefacto y los logs de compilación desde EAS.
6. Probar la versión en dispositivos Android del equipo.

### 9.3 Publicación de pruebas internas

Cuando Google Play y Expo Submit estén configurados, ejecutar manualmente el workflow y marcar submit_to_play_store. Confirmar que el destino sea la pista internal. Después, validar instalación, navegación, lecciones, audio, progreso y exámenes antes de promover la versión.

## 10. Pruebas del entorno de liberación

Las pruebas automatizadas incluidas comprueban la presencia de comandos npm y el entry point de Expo Router; la vinculación de EAS y el identificador Android; los perfiles de build y la pista interna; la validez sintáctica de todos los JSON bajo data/; la existencia de JSON importados por utils/contenido.js; y que .env y .release/ estén excluidos de Git.

Estas pruebas son verificaciones de humo para la liberación. No sustituyen pruebas funcionales de pantallas, pruebas en dispositivos reales ni pruebas de aceptación con estudiantes. Se recomienda añadir pruebas de creación y selección de perfiles, persistencia, exámenes, minijuegos y reproducción de audio.

## 11. Plan de reversión y gestión de incidentes

Si CI falla, no se continúa con la compilación. Se revisan los logs, se corrige el código y se ejecuta nuevamente el pipeline. Si EAS Build falla, se conservan el commit y los logs para diagnosticar dependencias, configuración o credenciales.

Si una versión interna presenta fallas, se detiene su promoción y se distribuye un nuevo build corregido. En una aplicación instalada desde tienda no se debe asumir una reversión instantánea al binario previo; la corrección se gestiona desde Google Play Console conforme a sus mecanismos de publicación y revisión.

## 12. Conclusión

La propuesta establece un proceso reproducible para verificar el código de Tinehnemi, preparar el entorno de liberación y generar una versión Android mediante EAS. La automatización reduce tareas manuales y facilita detectar problemas antes de entregar una nueva versión. La publicación a Google Play se mantiene controlada para validar primero en una pista interna.

El pipeline implementado constituye una base funcional de CI/CD. Para completar su operación real se deben incorporar el token de Expo, las credenciales de firma y las credenciales de Google Play. También se deben ejecutar los workflows y registrar resultados reales para evaluar los niveles de servicio propuestos.

## 13. Referencias

- Expo Documentation. Build on CI. https://docs.expo.dev/build/building-on-ci/
- Expo Documentation. Programmatic access. https://docs.expo.dev/accounts/programmatic-access/
- Expo Documentation. Submit to Google Play Store. https://docs.expo.dev/submit/android/
- Expo Documentation. EAS JSON configuration. https://docs.expo.dev/eas/json/
- GitHub Docs. GitHub Actions. https://docs.github.com/actions
- Repositorio Tinehnemi. https://github.com/FelipeMoraGG1/equipo-integradora
