require('dotenv').config();
const { pool } = require('./db');

async function seed() {
  try {
    console.log('Conectando a MySQL...');
    await pool.query('SELECT 1');
    console.log('Conexión exitosa');

    console.log('Insertando niveles...');
    const niveles = [
      { nombre: 'Novato', desc: 'Tu aventura comienza aquí', exp: 0 },
      { nombre: 'Aprendiz', desc: 'Estás aprendiendo los hábitos', exp: 500 },
      { nombre: 'Explorador', desc: 'Ya tienes experiencia', exp: 1500 },
      { nombre: 'Veterano', desc: 'Un jugador constante', exp: 3500 },
      { nombre: 'Élite', desc: 'Domina tus hábitos', exp: 7000 },
      { nombre: 'Leyenda', desc: 'La cima del sistema', exp: 15000 }
    ];
    for (const n of niveles) {
      await pool.query(
        'INSERT IGNORE INTO NIVEL (NOMBRE_NIVEL, DESCRIPCION, EXPERIENCIA_REQUERIDA) VALUES (?, ?, ?)',
        [n.nombre, n.desc, n.exp]
      );
    }

    console.log('Insertando administrador...');
    const bcrypt = require('bcrypt');
    const adminPass = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT IGNORE INTO ADMINISTRADOR (NOMBRE, APELLIDO, CORREO, CONTRASENA, ROL) VALUES (?, ?, ?, ?, ?)',
      ['Admin', 'LifeQuest', 'admin@lifequest.com', adminPass, 'SUPERADMIN']
    );

    console.log('Insertando usuario de prueba...');
    const userPass = await bcrypt.hash('12345678', 10);
    await pool.query(
      'INSERT IGNORE INTO USUARIO (NOMBRE, APELLIDO, CORREO, CONTRASENA, FK_ID_NIVEL) VALUES (?, ?, ?, ?, 1)',
      ['Test', 'User', 'test@lifequest.com', userPass]
    );
    await pool.query('INSERT IGNORE INTO CONFIGURACION (FK_ID_USUARIO) VALUES (?)', [(await pool.query('SELECT ID_USUARIO FROM USUARIO WHERE CORREO = ?', ['test@lifequest.com']))[0][0].ID_USUARIO]);

    console.log('Insertando catálogo de mascotas...');
    const mascotas = [
      { nombre: 'Panda', desc: 'Un panda fiel y tranquilo' },
      { nombre: 'Camaleón', desc: 'Se adapta a cualquier situación' },
      { nombre: 'Loro', desc: 'Tu compañero parlanchín' }
    ];
    for (const m of mascotas) {
      await pool.query(
        'INSERT IGNORE INTO CATALOGO_MASCOTA (NOMBRE, DESCRIPCION) VALUES (?, ?)',
        [m.nombre, m.desc]
      );
    }

    console.log('Insertando items de tienda...');
    const items = [
      { nombre: 'Sombrero Formal', tipo: 'SOMBRERO', precio: 50, desc: 'Un sombrero elegante', raridad: 'COMUN' },
      { nombre: 'Gafas Cool', tipo: 'GAFAS', precio: 75, desc: 'Gafas con estilo', raridad: 'COMUN' },
      { nombre: 'Mochila Aventurera', tipo: 'MOCHILA', precio: 100, desc: 'Para tus misiones', raridad: 'RARA' },
      { nombre: 'Corona Dorada', tipo: 'ACCESORIO', precio: 200, desc: 'Para los verdaderos reyes', raridad: 'EPICA' }
    ];
    for (const i of items) {
      await pool.query(
        'INSERT IGNORE INTO ITEM_TIENDA (NOMBRE, TIPO, PRECIO, DESCRIPCION, RARIDAD) VALUES (?, ?, ?, ?, ?)',
        [i.nombre, i.tipo, i.precio, i.desc, i.raridad]
      );
    }

    console.log('Insertando videojuegos...');
    const juegos = [
      { nombre: 'Fortnite', plataforma: 'MULTIPLATAFORMA' },
      { nombre: 'Free Fire', plataforma: 'ANDROID' },
      { nombre: 'League of Legends', plataforma: 'PC' },
      { nombre: 'Minecraft', plataforma: 'MULTIPLATAFORMA' }
    ];
    for (const j of juegos) {
      await pool.query(
        'INSERT IGNORE INTO VIDEOJUEGO (NOMBRE, PLATAFORMA) VALUES (?, ?)',
        [j.nombre, j.plataforma]
      );
    }

    console.log('Insertando logros...');
    const logros = [
      { nombre: 'Primeros Pasos', desc: 'Completa tu primera misión', tipo: 'MISIONES', valor: 1 },
      { nombre: 'Gamer Saludable', desc: 'Juega y completa una misión gamer', tipo: 'VIDEOJUEGOS', valor: 1 },
      { nombre: 'En Ascenso', desc: 'Alcanza nivel 5', tipo: 'NIVEL', valor: 5 },
      { nombre: 'Imparable', desc: 'Mantén racha de 7 días', tipo: 'RACHA', valor: 7 },
      { nombre: 'Coleccionista', desc: 'Acumula 500 monedas', tipo: 'MONEDAS', valor: 500 },
      { nombre: 'Hábitos Saludables', desc: 'Registra 10 hábitos', tipo: 'HABITOS', valor: 10 }
    ];
    for (const l of logros) {
      await pool.query(
        'INSERT IGNORE INTO LOGRO_CATALOGO (NOMBRE, DESCRIPCION, TIPO_CONDICION, VALOR_CONDICION) VALUES (?, ?, ?, ?)',
        [l.nombre, l.desc, l.tipo, l.valor]
      );
    }

    console.log('Insertando plantillas de misión (progresivas)...');
    const plantillas = [
      { nombre: 'Estudiar 15 minutos', desc: 'Sesión de estudio breve', tipo: 'ESTUDIO', dificultad: 'FACIL', exp: 20, monedas: 10, orden: 1 },
      { nombre: 'Estudiar 30 minutos', desc: 'Sesión de estudio intermedia', tipo: 'ESTUDIO', dificultad: 'FACIL', exp: 30, monedas: 15, orden: 2 },
      { nombre: 'Estudiar 45 minutos', desc: 'Sesión de estudio concentrada', tipo: 'ESTUDIO', dificultad: 'MEDIA', exp: 50, monedas: 25, orden: 3 },
      { nombre: 'Estudiar 1 hora', desc: 'Sesión de estudio extensa', tipo: 'ESTUDIO', dificultad: 'MEDIA', exp: 75, monedas: 35, orden: 4 },
      { nombre: 'Estudiar 1.5 horas', desc: 'Sesión de estudio avanzada', tipo: 'ESTUDIO', dificultad: 'DIFICIL', exp: 100, monedas: 50, orden: 5 },

      { nombre: 'Ejercicio ligero 10 min', desc: 'Ejercicio suave para comenzar', tipo: 'SALUD', dificultad: 'FACIL', exp: 20, monedas: 10, orden: 1 },
      { nombre: 'Ejercicio moderado 20 min', desc: 'Ejercicio de intensidad media', tipo: 'SALUD', dificultad: 'FACIL', exp: 30, monedas: 15, orden: 2 },
      { nombre: 'Ejercicio intenso 30 min', desc: 'Ejercicio de buena intensidad', tipo: 'SALUD', dificultad: 'MEDIA', exp: 50, monedas: 25, orden: 3 },
      { nombre: 'Ejercicio fuerte 45 min', desc: 'Ejercicio desafiante', tipo: 'SALUD', dificultad: 'MEDIA', exp: 75, monedas: 35, orden: 4 },
      { nombre: 'Ejercicio avanzado 1 hora', desc: 'Sesión de ejercicio completa', tipo: 'SALUD', dificultad: 'DIFICIL', exp: 100, monedas: 50, orden: 5 },

      { nombre: 'Dormir antes de medianoche', desc: 'Acostarte temprano', tipo: 'HABITO', dificultad: 'FACIL', exp: 20, monedas: 10, orden: 1 },
      { nombre: 'Dormir 7 horas seguidas', desc: 'Descanso prolongado', tipo: 'HABITO', dificultad: 'FACIL', exp: 30, monedas: 15, orden: 2 },
      { nombre: 'Dormir 8 horas completas', desc: 'Descanso óptimo', tipo: 'HABITO', dificultad: 'MEDIA', exp: 50, monedas: 25, orden: 3 },
      { nombre: 'Rutina completa de sueño', desc: 'Rutina nocturna saludable', tipo: 'HABITO', dificultad: 'MEDIA', exp: 75, monedas: 35, orden: 4 },
      { nombre: 'Semana completa de sueño', desc: '7 días de sueño saludable', tipo: 'HABITO', dificultad: 'DIFICIL', exp: 100, monedas: 50, orden: 5 },

      { nombre: 'Sesión Gamer Balanceada', desc: 'Jugar con límites saludables', tipo: 'VIDEOJUEGO', dificultad: 'MEDIA', exp: 30, monedas: 15, orden: 1 },
      { nombre: 'Gamer Responsable', desc: 'Jugar respetando tiempos', tipo: 'VIDEOJUEGO', dificultad: 'MEDIA', exp: 50, monedas: 25, orden: 2 },
      { nombre: 'Maratón Gamer Controlado', desc: 'Jugar mucho pero con pausas', tipo: 'VIDEOJUEGO', dificultad: 'DIFICIL', exp: 75, monedas: 35, orden: 3 },

      { nombre: 'Misión Personal', desc: 'Misión personalizada del usuario', tipo: 'PERSONAL', dificultad: 'MEDIA', exp: 50, monedas: 25, orden: 1 }
    ];
    for (const p of plantillas) {
      await pool.query(
        'INSERT IGNORE INTO PLANTILLA_MISION (NOMBRE, DESCRIPCION, TIPO, DIFICULTAD, EXP_BASE, MONEDAS, FK_ID_ADMINISTRADOR) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [p.nombre, p.desc, p.tipo, p.dificultad, p.exp, p.monedas]
      );
    }

    console.log('Insertando recompensas...');
    const recompensas = [
      { nombre: 'Cofre Bronce', desc: 'Contiene sorpresas básicas', tipo: 'COFRE', monedas: 100 },
      { nombre: 'Cofre Oro', desc: 'Contiene recompensas premium', tipo: 'COFRE', monedas: 500 },
      { nombre: 'Pack XP x2', desc: 'Duplica XP por 1 hora', tipo: 'EXPERIENCIA', monedas: 200 }
    ];
    for (const r of recompensas) {
      await pool.query(
        'INSERT IGNORE INTO RECOMPENSA (NOMBRE, DESCRIPCION, TIPO, MONEDAS_REQUERIDAS) VALUES (?, ?, ?, ?)',
        [r.nombre, r.desc, r.tipo, r.monedas]
      );
    }

    console.log('\nSeed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seed();
