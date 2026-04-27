const { Telegraf, Context } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

const UserService = require('./services/UserService');
const KeyboardService = require('./services/KeyboardService');
const User = require('./models/User');
const ActionLog = require('./models/ActionLog');

const bot = new Telegraf(process.env.BOT_TOKEN);
const adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI).catch(err => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Middleware
bot.use(async (ctx, next) => {
  ctx.state.isAdmin = adminIds.includes(ctx.from.id);
  await next();
});

// Start Command
bot.start(async ctx => {
  await UserService.getOrCreateUser(ctx.from.id, ctx.from);
  const message = `
🤖 *${process.env.BOT_USERNAME}*'a hoş geldiniz!

🛡️ Bu bot grup moderasyonu için geliştirilmiştir.

📋 Komutlar:
/help - Komutlar listesi
/admin - Admin paneli
/start - Bu mesaj
  `;
  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// Help Command
bot.help(ctx => {
  const helpText = `
👨‍💼 *ADMIN KOMUTLARı*
/ban - Mesajı reply edip /ban [reason] yazın
/unban - Reply edip /unban yazın
/warn - Reply edip /warn [reason] yazın
/unwarn - Reply edip /unwarn yazın
/mute - Reply edip /mute [dakika] [reason] yazın
/unmute - Reply edip /unmute yazın
/kick - Reply edip /kick [reason] yazın

📊 *BİLGİ KOMUTLARı*
/stats - Kullanıcı istatistikleri
/logs - Son işlemler
/admin - Admin paneli (butonlu)
/info - Bot hakkında bilgi
  `;
  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// Admin Panel
bot.command('admin', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply(
      '📋 *Admin Paneli*\n\nBir mesajı reply edip admin işlemi seçin:',
      KeyboardService.getAdminPanel()
    );
  }

  ctx.session = ctx.session || {};
  ctx.session.targetUserId = ctx.message.reply_to_message.from.id;
  ctx.session.targetUsername = ctx.message.reply_to_message.from.username || 'Bilinmiyor';

  await ctx.reply(
    `👤 *Hedef Kullanıcı:* @${ctx.session.targetUsername}\n\n*İşlem seçin:*`,
    KeyboardService.getAdminPanel()
  );
});

// Ban Command
bot.command('ban', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('📌 Lütfen bir kullanıcı mesajını reply edin!');
  }

  const userId = ctx.message.reply_to_message.from.id;
  const reason = ctx.message.text.replace('/ban', '').trim() || 'Belirtilmemiş';

  try {
    await UserService.banUser(userId, reason, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `🚫 *Yasak uygulandı*\n👤 Kullanıcı: ${ctx.message.reply_to_message.from.first_name}\n📝 Nedeni: ${reason}`
    );
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Unban Command
bot.command('unban', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('📌 Lütfen bir kullanıcı mesajını reply edin!');
  }

  const userId = ctx.message.reply_to_message.from.id;

  try {
    await UserService.unbanUser(userId, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `✅ *Yasak kaldırıldı*\n👤 Kullanıcı: ${ctx.message.reply_to_message.from.first_name}`
    );
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Warn Command
bot.command('warn', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('📌 Lütfen bir kullanıcı mesajını reply edin!');
  }

  const userId = ctx.message.reply_to_message.from.id;
  const reason = ctx.message.text.replace('/warn', '').trim() || 'Belirtilmemiş';

  try {
    const user = await UserService.warnUser(userId, reason, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });

    let message = `⚠️ *Uyarı verildi*\n👤 Kullanıcı: ${ctx.message.reply_to_message.from.first_name}\n📝 Nedeni: ${reason}\n📊 Uyarı sayısı: ${user.warnings}/3`;

    if (user.warnings >= 3) {
      message += '\n\n🚫 3 uyarıya ulaştığı için otomatik yasaklanacaktır!';
      // Auto ban
      await UserService.banUser(userId, 'Otomatik ban - 3 uyarı', {
        id: ctx.botInfo.id,
        username: 'System'
      });
    }

    await ctx.reply(message);
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Unwarn Command
bot.command('unwarn', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('📌 Lütfen bir kullanıcı mesajını reply edin!');
  }

  const userId = ctx.message.reply_to_message.from.id;

  try {
    await UserService.unwarnUser(userId, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `✅ *Uyarılar temizlendi*\n👤 Kullanıcı: ${ctx.message.reply_to_message.from.first_name}`
    );
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Mute Command
bot.command('mute', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('📌 Lütfen bir kullanıcı mesajını reply edin!');
  }

  const args = ctx.message.text.split(' ');
  const minutes = parseInt(args[1]) || 30;
  const reason = args.slice(2).join(' ') || 'Belirtilmemiş';
  const userId = ctx.message.reply_to_message.from.id;

  try {
    await UserService.muteUser(userId, minutes, reason, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `🔇 *Susturma uygulandı*\n👤 Kullanıcı: ${ctx.message.reply_to_message.from.first_name}\n⏱️ Süre: ${minutes} dakika\n📝 Nedeni: ${reason}`
    );
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Unmute Command
bot.command('unmute', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('📌 Lütfen bir kullanıcı mesajını reply edin!');
  }

  const userId = ctx.message.reply_to_message.from.id;

  try {
    await UserService.unmuteUser(userId, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `✅ *Susturma kaldırıldı*\n👤 Kullanıcı: ${ctx.message.reply_to_message.from.first_name}`
    );
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Kick Command
bot.command('kick', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  if (!ctx.message.reply_to_message) {
    return ctx.reply('📌 Lütfen bir kullanıcı mesajını reply edin!');
  }

  const userId = ctx.message.reply_to_message.from.id;
  const reason = ctx.message.text.replace('/kick', '').trim() || 'Belirtilmemiş';

  try {
    await ctx.banChatMember(ctx.chat.id, userId);
    await ctx.unbanChatMember(ctx.chat.id, userId);
    
    await UserService.logAction(
      userId,
      'kick',
      reason,
      {
        id: ctx.from.id,
        username: ctx.from.username || 'Admin'
      }
    );

    await ctx.reply(
      `👢 *Kullanıcı atıldı*\n👤 Kullanıcı: ${ctx.message.reply_to_message.from.first_name}\n📝 Nedeni: ${reason}`
    );
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Stats Command
bot.command('stats', async ctx => {
  let userId = ctx.from.id;

  if (ctx.message.reply_to_message) {
    userId = ctx.message.reply_to_message.from.id;
  }

  try {
    const user = await UserService.getUserStats(userId);
    if (!user) {
      return ctx.reply('❌ Kullanıcı bulunamadı!');
    }

    const stats = `
👤 *Kullanıcı İstatistikleri*
━━━━━━━━━━━━━━━━━━
🔖 ID: ${user.telegramId}
📝 Kullanıcı: @${user.username}
📅 Katılış: ${user.joinDate.toLocaleDateString('tr-TR')}

⚠️ Uyarı: ${user.warnings}/3
🚫 Yasaklı: ${user.isBanned ? 'Evet' : 'Hayır'}
🔇 Susturulmuş: ${user.isMuted ? 'Evet' : 'Hayır'}
💬 Mesaj: ${user.messageCount}
    `;
    await ctx.reply(stats);
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Logs Command
bot.command('logs', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  try {
    const logs = await UserService.getRecentLogs(10);
    if (logs.length === 0) {
      return ctx.reply('📋 Henüz işlem kaydı yok!');
    }

    let logText = '📋 *Son 10 İşlem*\n━━━━━━━━━━━━━━━━━━\n';
    logs.forEach((log, index) => {
      logText += `\n${index + 1}. *${log.action.toUpperCase()}*\n`;
      logText += `   👤 @${log.adminUsername}\n`;
      logText += `   📝 ${log.reason}\n`;
      logText += `   🕐 ${log.timestamp.toLocaleString('tr-TR')}\n`;
    });

    await ctx.reply(logText);
  } catch (error) {
    ctx.reply('❌ Hata oluştu!');
    console.error(error);
  }
});

// Info Command
bot.command('info', ctx => {
  const info = `
🤖 *Berxwedan Bot*
━━━━━━━━━━━━━━━━━━
📌 Versiyon: 1.0.0
👨‍💼 Amaç: Grup Moderasyonu

✨ *Özellikler:*
✅ Ban/Unban sistemi
✅ Warn sistemi
✅ Mute/Unmute
✅ Kick sistemi
✅ İşlem günlüğü
✅ Admin paneli

📞 *Destek:* @canbedran356
  `;
  ctx.reply(info);
});

// New Member Handler
bot.on('new_chat_members', async ctx => {
  const member = ctx.message.new_chat_members[0];
  await UserService.getOrCreateUser(member.id, member);

  const welcomeMsg = `
🎉 *Hoş Geldiniz!* 🎉
━━━━━━━━━━━━━━━━━━
👋 ${member.first_name}, gruba hoş geldiniz!

📋 *Grup Kuralları:*
1️⃣ Saygılı olun
2️⃣ İçerik paylaşırken kurallara uyun
3️⃣ Bot komutlarını spam yapmayın

🤝 İyi zamanlar dileriz!
  `;
  await ctx.reply(welcomeMsg);
});

// Left Member Handler
bot.on('left_chat_member', async ctx => {
  const member = ctx.message.left_chat_member;
  const goodbyeMsg = `😢 ${member.first_name} grubu terk etti.\nUmarım tekrar görüşürüz! 👋`;
  await ctx.reply(goodbyeMsg);
});

// Action Handlers for Inline Buttons
bot.action('action_ban', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.answerCbQuery('❌ İzniniz yok!');
  }
  await ctx.reply('📝 Ban nedeni yazın:');
  ctx.session = ctx.session || {};
  ctx.session.action = 'ban';
  ctx.answerCbQuery();
});

bot.action('action_warn', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.answerCbQuery('❌ İzniniz yok!');
  }
  await ctx.reply('📝 Uyarı nedeni yazın:');
  ctx.session = ctx.session || {};
  ctx.session.action = 'warn';
  ctx.answerCbQuery();
});

bot.action(/action_mute_(.*)/, async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.answerCbQuery('❌ İzniniz yok!');
  }
  const minutes = ctx.match[1] === '30' ? 30 : 60;
  await ctx.reply('📝 Susturma nedeni yazın:');
  ctx.session = ctx.session || {};
  ctx.session.action = 'mute';
  ctx.session.muteMinutes = minutes;
  ctx.answerCbQuery();
});

bot.action('action_kick', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.answerCbQuery('❌ İzniniz yok!');
  }
  await ctx.reply('📝 Atma nedeni yazın:');
  ctx.session = ctx.session || {};
  ctx.session.action = 'kick';
  ctx.answerCbQuery();
});

bot.action('action_logs', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.answerCbQuery('❌ İzniniz yok!');
  }
  try {
    const logs = await UserService.getRecentLogs(5);
    let logText = '📋 *Son 5 İşlem*\n';
    if (logs.length === 0) {
      logText = '📋 İşlem kaydı yok!';
    } else {
      logs.forEach((log, index) => {
        logText += `${index + 1}. ${log.action} - ${log.reason}\n`;
      });
    }
    await ctx.reply(logText);
  } catch (error) {
    ctx.reply('❌ Hata!');
  }
  ctx.answerCbQuery();
});

bot.action('action_close', async ctx => {
  await ctx.deleteMessage();
  ctx.answerCbQuery();
});

// Error Handling
bot.catch((err, ctx) => {
  console.error('Bot Hatası:', err);
});

// Start Bot
bot.launch().then(() => {
  console.log('✅ Berxwedan Bot başlatıldı!');
}).catch(err => {
  console.error('Bot başlatılamadı:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));