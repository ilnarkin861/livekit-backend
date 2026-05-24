const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk'); // [1]

const app = express();
app.use(cors()); // Разрешаем React-клиенту делать запросы к этому API
app.use(express.json());

// Данные авторизации, которые мы указали в Docker: LIVEKIT_KEYS="devkey: secret"
const API_KEY = 'devkey';
const API_SECRET = 'secret';

app.get('/api/get-token', async (req, res) => {
  const { room, user } = req.query;

  // Проверяем, что переданы имя комнаты и имя пользователя
  if (!room || !user) {
    return res.status(400).json({ error: 'Параметры room и user обязательны' });
  }

  try {
    // 1. Создаем токен доступа и привязываем его к ключам [1]
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: user, // Уникальное имя/ID пользователя в комнате [1]
      ttl: '2h',      // Время жизни токена (например, 2 часа) [1]
    });

    // 2. Выдаем права (Permissions) для этого пользователя в комнате [1]
    at.addGrant({
      roomJoin: true,       // Разрешить вход в комнату [1]
      room: room,           // Имя конкретной комнаты [1]
      canPublish: true,     // Разрешить транслировать свою камеру/микрофон [1]
      canSubscribe: true,   // Разрешить принимать потоки других участников [1]
      canPublishData: true, // Разрешить отправлять сообщения в чат [1]
    });

    // 3. Генерируем финальную JWT-строку [1]
    const token = await at.toJwt();

    // Отправляем токен обратно в React-клиент [1]
    res.json({ token });
  } catch (error) {
    console.error('Ошибка генерации токена:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Сервер генерации токенов запущен на http://localhost:${PORT}`);
});
