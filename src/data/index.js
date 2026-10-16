// API pública de datos de RamoStudio. Las pantallas importan SOLO de aquí.
//
// Hoy la implementación es local (JSON de prueba + localStorage). Para conectar
// Supabase se crea store.supabase.js con las mismas funciones y se cambia esta
// línea; ninguna pantalla debe cambiar.
export * from './store.local.js';
