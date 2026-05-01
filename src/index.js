const { askDeepSeek, clearConversation } = require('./services/DeepSeekService');
const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

const UserService = require('./services/UserService');
const KeyboardService = require('./services/KeyboardService');
const User = require('./models/User');

const bot = new Telegraf(process.env.BOT_TOKEN);
const adminIds = process.env.ADMIN_IDS.split(',').map(id => parseInt(id));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB bağlantısı başarılı'))
  .catch(err => console.error('❌ MongoDB bağlantı hatası:', err));

// Middleware
bot.use(async (ctx, next) => {
  ctx.state.isAdmin = adminIds.includes(ctx.from?.id);
  await next();
});

// ====================== YARDIMCI FONKSİYON ======================
async function getTargetUserId(ctx) {
  // 1. Reply ile
  if (ctx.message?.reply_to_message?.from?.id) {
    return ctx.message.reply_to_message.from.id;
  }

  // 2. @username ile
  const match = ctx.message?.text?.match(/@([a-zA-Z0-9_]{5,32})/);
  if (match) {
    const username = match[1].toLowerCase();
    const user = await User.findOne({ username: username });
    return user ? user.telegramId : null;
  }

  return null;
}

async function getTargetInfo(ctx, userId) {
  if (ctx.message?.reply_to_message?.from) {
    return ctx.message.reply_to_message.from;
  }
  const user = await UserService.getUserStats(userId);
  return user || { first_name: 'Bilinmeyen Kullanıcı', username: 'unknown' };
}

// ====================== KOMUTLAR ======================

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
👨‍💼 *ADMIN KOMUTLARI*
/ban @user [sebep]   veya reply ile
/unban @user         veya reply
/warn @user [sebep]
/unwarn @user
/mute @user [dakika] [sebep]
/unmute @user
/kick @user [sebep]

📊 *BİLGİ KOMUTLARI*
/stats @user   veya reply
/logs
/admin
/info
  `;
  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// Admin Panel
bot.command('admin', async ctx => {
  if (!ctx.state.isAdmin) {
    return ctx.reply('❌ Bu komutu kullanma izniniz yok!');
  }

  const targetId = await getTargetUserId(ctx);
  const targetInfo = targetId ? await getTargetInfo(ctx, targetId) : null;

  if (targetId && targetInfo) {
    ctx.session = ctx.session ?? {};
    ctx.session.targetUserId = targetId;
    ctx.session.targetUsername = targetInfo.username || 'Bilinmiyor';

    await ctx.reply(
      `👤 *Hedef Kullanıcı:* @${ctx.session.targetUsername}\n\n*İşlem seçin:*`,
      KeyboardService.getAdminPanel()
    );
  } else {
    await ctx.reply(
      '📋 *Admin Paneli*\n\nBir mesajı reply edin veya @kullanıcıadı belirtin:',
      KeyboardService.getAdminPanel()
    );
  }
});

// ====================== ADMIN KOMUTLARI ======================

// Ban Command
bot.command('ban', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('📌 Lütfen bir mesaja reply edin veya @kullanıcıadı belirtin!');

  const reason = ctx.message.text.replace('/ban', '').trim() || 'Belirtilmemiş';
  const targetInfo = await getTargetInfo(ctx, userId);

  try {
    await UserService.banUser(userId, reason, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `🚫 *Yasak uygulandı*\n👤 Kullanıcı: ${targetInfo.first_name}\n📝 Nedeni: ${reason}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Unban Command
bot.command('unban', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('📌 Lütfen bir mesaja reply edin veya @kullanıcıadı belirtin!');

  const targetInfo = await getTargetInfo(ctx, userId);

  try {
    await UserService.unbanUser(userId, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `✅ *Yasak kaldırıldı*\n👤 Kullanıcı: ${targetInfo.first_name}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Warn Command (En kritik düzeltme burada)
bot.command('warn', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('📌 Lütfen bir mesaja reply edin veya @kullanıcıadı belirtin!');

  const reason = ctx.message.text.replace('/warn', '').trim() || 'Belirtilmemiş';
  const targetInfo = await getTargetInfo(ctx, userId);

  try {
    const user = await UserService.warnUser(userId, reason, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });

    if (!user) {
      return ctx.reply('❌ Kullanıcı bulunamadı veya işlem başarısız!');
    }

    let message = `⚠️ *Uyarı verildi*\n👤 Kullanıcı: ${targetInfo.first_name}\n📝 Nedeni: ${reason}\n📊 Uyarı sayısı: ${user.warnings}/3`;

    if (user.warnings >= 3) {
      message += '\n\n🚫 3 uyarıya ulaştığı için otomatik yasaklanacaktır!';
      await UserService.banUser(userId, 'Otomatik ban - 3 uyarı', {
        id: ctx.botInfo.id,
        username: 'System'
      }).catch(e => console.error('Auto-ban hatası:', e));
    }

    await ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Unwarn Command
bot.command('unwarn', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('📌 Lütfen bir mesaja reply edin veya @kullanıcıadı belirtin!');

  const targetInfo = await getTargetInfo(ctx, userId);

  try {
    await UserService.unwarnUser(userId, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `✅ *Uyarılar temizlendi*\n👤 Kullanıcı: ${targetInfo.first_name}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Mute Command
bot.command('mute', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('📌 Lütfen bir mesaja reply edin veya @kullanıcıadı belirtin!');

  const args = ctx.message.text.split(' ');
  const minutes = parseInt(args[1]) || 30;
  const reason = args.slice(2).join(' ') || 'Belirtilmemiş';
  const targetInfo = await getTargetInfo(ctx, userId);

  try {
    await UserService.muteUser(userId, minutes, reason, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `🔇 *Susturma uygulandı*\n👤 Kullanıcı: ${targetInfo.first_name}\n⏱️ Süre: ${minutes} dakika\n📝 Nedeni: ${reason}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Unmute Command
bot.command('unmute', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('📌 Lütfen bir mesaja reply edin veya @kullanıcıadı belirtin!');

  const targetInfo = await getTargetInfo(ctx, userId);

  try {
    await UserService.unmuteUser(userId, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });
    await ctx.reply(
      `✅ *Susturma kaldırıldı*\n👤 Kullanıcı: ${targetInfo.first_name}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Kick Command
bot.command('kick', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  const userId = await getTargetUserId(ctx);
  if (!userId) return ctx.reply('📌 Lütfen bir mesaja reply edin veya @kullanıcıadı belirtin!');

  const reason = ctx.message.text.replace('/kick', '').trim() || 'Belirtilmemiş';
  const targetInfo = await getTargetInfo(ctx, userId);

  try {
    await ctx.banChatMember(ctx.chat.id, userId);
    await ctx.unbanChatMember(ctx.chat.id, userId);

    await UserService.logAction(userId, 'kick', reason, {
      id: ctx.from.id,
      username: ctx.from.username || 'Admin'
    });

    await ctx.reply(
      `👢 *Kullanıcı atıldı*\n👤 Kullanıcı: ${targetInfo.first_name}\n📝 Nedeni: ${reason}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Stats Command
bot.command('stats', async ctx => {
  let userId = ctx.from.id;
  const targetId = await getTargetUserId(ctx);
  if (targetId) userId = targetId;

  try {
    const user = await UserService.getUserStats(userId);
    if (!user) return ctx.reply('❌ Kullanıcı bulunamadı!');

    const stats = `
👤 *Kullanıcı İstatistikleri*
━━━━━━━━━━━━━━━━━━
🔖 ID: ${user.telegramId}
📝 Kullanıcı: @${user.username || 'yok'}
📅 Katılış: ${user.joinDate?.toLocaleDateString('tr-TR') || 'Bilinmiyor'}
⚠️ Uyarı: ${user.warnings}/3
🚫 Yasaklı: ${user.isBanned ? 'Evet' : 'Hayır'}
🔇 Susturulmuş: ${user.isMuted ? 'Evet' : 'Hayır'}
💬 Mesaj: ${user.messageCount || 0}
    `;
    await ctx.reply(stats, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Logs Command
bot.command('logs', async ctx => {
  if (!ctx.state.isAdmin) return ctx.reply('❌ Bu komutu kullanma izniniz yok!');

  try {
    const logs = await UserService.getRecentLogs(10);
    if (logs.length === 0) return ctx.reply('📋 Henüz işlem kaydı yok!');

    let logText = '📋 *Son 10 İşlem*\n━━━━━━━━━━━━━━━━━━\n';
    logs.forEach((log, index) => {
      logText += `\n${index + 1}. *${log.action.toUpperCase()}*\n`;
      logText += ` 👤 @${log.adminUsername || 'Admin'}\n`;
      logText += ` 📝 ${log.reason}\n`;
      logText += ` 🕐 ${log.timestamp.toLocaleString('tr-TR')}\n`;
    });
    await ctx.reply(logText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
    ctx.reply('❌ Hata oluştu!');
  }
});

// Info Command
bot.command('info', ctx => {
  const info = `
🤖 *Berxwedan Bot*
━━━━━━━━━━━━━━━━━━
📌 Versiyon: 1.1.0
👨‍💼 Amaç: Grup Moderasyonu
✨ *Özellikler:*
✅ Ban/Unban sistemi
✅ Warn sistemi
✅ Mute/Unmute
✅ Kick sistemi
✅ İşlem günlüğü
✅ @kullanıcıadı desteği
📞 *Destek:* @canbedran356
  `;
  ctx.reply(info, { parse_mode: 'Markdown' });
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
  await ctx.reply(welcomeMsg, { parse_mode: 'Markdown' });
});

// Left Member Handler
bot.on('left_chat_member', async ctx => {
  const member = ctx.message.left_chat_member;
  const goodbyeMsg = `😢 ${member.first_name} grubu terk etti.\nUmarım tekrar görüşürüz! 👋`;
  await ctx.reply(goodbyeMsg);
});

// Action Handlers for Inline Buttons (orijinal hali korundu)
bot.action('action_ban', async ctx => {
  if (!ctx.state.isAdmin) return ctx.answerCbQuery('❌ İzniniz yok!');
  await ctx.reply('📝 Ban nedeni yazın:');
  ctx.session = ctx.session ?? {};
  ctx.session.action = 'ban';
  ctx.answerCbQuery();
});

bot.action('action_warn', async ctx => {
  if (!ctx.state.isAdmin) return ctx.answerCbQuery('❌ İzniniz yok!');
  await ctx.reply('📝 Uyarı nedeni yazın:');
  ctx.session = ctx.session ?? {};
  ctx.session.action = 'warn';
  ctx.answerCbQuery();
});

bot.action(/action_mute_(.*)/, async ctx => {
  if (!ctx.state.isAdmin) return ctx.answerCbQuery('❌ İzniniz yok!');
  const minutes = ctx.match[1] === '30' ? 30 : 60;
  await ctx.reply('📝 Susturma nedeni yazın:');
  ctx.session = ctx.session ?? {};
  ctx.session.action = 'mute';
  ctx.session.muteMinutes = minutes;
  ctx.answerCbQuery();
});

bot.action('action_kick', async ctx => {
  if (!ctx.state.isAdmin) return ctx.answerCbQuery('❌ İzniniz yok!');
  await ctx.reply('📝 Atma nedeni yazın:');
  ctx.session = ctx.session ?? {};
  ctx.session.action = 'kick';
  ctx.answerCbQuery();
});

bot.action('action_logs', async ctx => {
  if (!ctx.state.isAdmin) return ctx.answerCbQuery('❌ İzniniz yok!');
  try {
    const logs = await UserService.getRecentLogs(5);
    let logText = logs.length ? '📋 *Son 5 İşlem*\n' : '📋 İşlem kaydı yok!';
    logs.forEach((log, index) => {
      logText += `${index + 1}. ${log.action} - ${log.reason}\n`;
    });
    await ctx.reply(logText);
  } catch (error) {
    ctx.reply('❌ Hata!');
  }
  ctx.answerCbQuery();
});

bot.action('action_close', async ctx => {
  await ctx.deleteMessage().catch(() => {});
  ctx.answerCbQuery();
});

// Error Handling
bot.catch((err, ctx) => {
  console.error('Bot Hatası:', err);
});

// Start Bot
bot.launch()
  .then(() => console.log('✅ Berxwedan Bot başlatıldı!'))
  .catch(err => console.error('Bot başlatılamadı:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
