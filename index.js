import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';

// Ganti dengan token API bot kamu
const token = '7844933989:AAFquHnlKfZM5c5xGYnOkWmvzbhP_7wwZyI';
const bot = new TelegramBot(token, { polling: true });

class Login {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.website_headers = {
      "accept": "application/json, text/plain, */*",
      "Content-Type": "application/json"
    };
  }

  async login() {
    const url = 'https://api.getgrass.io/login';

    const json_data = {
      username: this.email,
      password: this.password,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.website_headers,
        body: JSON.stringify(json_data)
      });

      const res_json = await response.json();
      if (res_json.result && res_json.result.data && res_json.result.data.accessToken) {
        const authToken = res_json.result.data.accessToken;
        console.debug(`Login response: ${authToken}`);
        return authToken;
      } else {
        throw new Error('Invalid login response');
      }

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

class DataFetcher {
  constructor() {
    this.website_headers = {
      "accept": "application/json, text/plain, */*",
      "Content-Type": "application/json"
    };
  }

  async getData(authHeader) {
    const url = 'https://api.getgrass.io/epochEarnings?input=%7B%22limit%22:1,%22isLatestOnly%22:true%7D';

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...this.website_headers,
          "authorization": authHeader
        }
      });

      const res_json = await response.json();
      if (res_json.error) {
        throw new Error(`Get Data error: ${res_json.error.message}`);
      }

      if (response.status !== 200) {
        throw new Error(`Get Data response: | ${JSON.stringify(res_json)}`);
      }

      return res_json;

    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

// Simpan data pengguna
const userProfiles = {};

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Use /login email:password to get started.');
});

// Handle /login command
bot.onText(/\/login (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const [email, password] = match[1].split(':');

  if (!email || !password) {
    bot.sendMessage(chatId, 'Format salah. Gunakan: /login email:password');
    return;
  }

  try {
    const loginInstance = new Login(email, password);
    const authToken = await loginInstance.login();

    if (!userProfiles[chatId]) {
      userProfiles[chatId] = [];
    }

    userProfiles[chatId].push({ email, authToken });
    console.log(`Authorization Token: ${authToken}`);
    bot.sendMessage(chatId, `
Login berhasil!
        
Authorization Token: ${authToken}

Gunakan perintah /data authToken untuk melihat point.`);
  } catch (error) {
    bot.sendMessage(chatId, `Error: ${error.message}`);
  }
});

// Simpan interval ID untuk setiap pengguna
const userIntervals = {};

// Handle /data command
bot.onText(/\/data (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const authHeader = match[1];

  if (!authHeader) {
    bot.sendMessage(chatId, 'Silakan masukkan data auth token. Gunakan: /data authToken');
    return;
  }

  const dataFetcher = new DataFetcher();

  if (userIntervals[chatId]) {
    clearInterval(userIntervals[chatId]);
  }

  userIntervals[chatId] = setInterval(async () => {
    try {
      const data = await dataFetcher.getData(authHeader);
      bot.sendMessage(chatId, `Data: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      bot.sendMessage(chatId, `Error: ${error.message}`);
    }
  }, 50000);

  bot.sendMessage(chatId, 'Mendapatkan data secara berulang. Gunakan /stop untuk berhenti.');
});

// Handle /stop command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;

  if (userIntervals[chatId]) {
    clearInterval(userIntervals[chatId]);
    delete userIntervals[chatId];
    bot.sendMessage(chatId, 'Berhenti mendapatkan data.');
  } else {
    bot.sendMessage(chatId, 'Tidak ada proses yang berjalan.');
  }
});

// Handle /profile command to view, add, and update accounts
bot.onText(/\/profile/, (msg) => {
  const chatId = msg.chat.id;

  if (!userProfiles[chatId] || userProfiles[chatId].length === 0) {
    bot.sendMessage(chatId, 'Anda belum menambahkan akun. Gunakan /login email:password untuk menambahkan.');
    return;
  }

  let message = 'Profil akun Anda:\n';
  userProfiles[chatId].forEach((profile, index) => {
    message += `${index + 1}. Email: ${profile.email}, Auth Token: ${profile.authToken}\n`;
  });

  bot.sendMessage(chatId, message);
});

// Handle /update command to update auth token for an account
bot.onText(/\/update (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const [index, authToken] = match[1].split(':');

  if (!index || !authToken) {
    bot.sendMessage(chatId, 'Format salah. Gunakan: /update index:authToken');
    return;
  }

  const profileIndex = parseInt(index, 10) - 1;
  if (!userProfiles[chatId] || !userProfiles[chatId][profileIndex]) {
    bot.sendMessage(chatId, 'Akun tidak ditemukan.');
    return;
  }

  userProfiles[chatId][profileIndex].authToken = authToken;
  bot.sendMessage(chatId, 'Auth token berhasil diperbarui.');
});
