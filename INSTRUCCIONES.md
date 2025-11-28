# Frontend Simulacion CASTEL - Instrucciones

## RESUMEN DE LO CONSTRUIDO

Se ha creado exitosamente el inicio del frontend Angular con:

1. **Dashboard Principal** - Vista principal con resumen y TOP10
2. **Nueva Simulacion** - Formulario para ejecutar simulaciones
3. **Servicios API** - Conexion completa con el backend
4. **Modelos TypeScript** - Interfaces tipadas
5. **Routing** - Navegacion configurada

## COMO EJECUTAR EL PROYECTO

### 1. Abrir terminal en la carpeta del proyecto

cd "C:\Users\Carlos Alvarado\Documents\CXP\SIMULACION CASTEL\frontend-simulacion"

### 2. Verificar que el backend este corriendo

El backend debe estar ejecutandose en http://localhost:3000

### 3. Ejecutar el frontend

npm start

O tambien:

ng serve

### 4. Abrir el navegador

http://localhost:4200

## RUTAS DISPONIBLES

- / (Dashboard principal)
- /nueva-simulacion (Formulario para ejecutar simulacion)

## PROXIMOS PASOS RECOMENDADOS

1. Probar la conexion con el backend
2. Ejecutar una simulacion desde el formulario
3. Ver los resultados en el dashboard
4. Agregar mas componentes:
   - Historial de simulaciones
   - Timeline de eventos
   - Graficas con Chart.js
   - Detalle de cuenta individual

## COMANDOS UTILES

npm start          - Inicia el servidor de desarrollo
ng serve --open    - Inicia y abre el navegador
ng build           - Compila para produccion
ng generate component nombre  - Crea un nuevo componente

## ESTRUCTURA CREADA

frontend-simulacion/
├── src/app/
│   ├── components/
│   │   ├── dashboard/
│   │   └── nueva-simulacion/
│   ├── models/
│   │   ├── simulacion.model.ts
│   │   ├── top10.model.ts
│   │   └── cuenta-cliente.model.ts
│   ├── services/
│   │   ├── simulacion.service.ts
│   │   ├── top10.service.ts
│   │   └── cuentas-clientes.service.ts
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts

## NOTAS IMPORTANTES

- El proyecto usa Angular 21 (standalone components)
- NO usa emojis en el codigo (segun requisito)
- Estilos con SCSS
- HttpClient configurado con provideHttpClient
- Routing con lazy loading

