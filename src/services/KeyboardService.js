const { Markup } = require('telegraf');

class KeyboardService {
  getAdminPanel() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🚫 Ban', 'action_ban')],
      [Markup.button.callback('⚠️ Warn', 'action_warn')],
      [Markup.button.callback('🔇 Mute 30 min', 'action_mute_30')],
      [Markup.button.callback('🔇 Mute 1 saat', 'action_mute_60')],
      [Markup.button.callback('👢 Kick', 'action_kick')],
      [Markup.button.callback('📋 Logs', 'action_logs')],
      [Markup.button.callback('👤 Info', 'action_info')],
      [Markup.button.callback('❌ Kapat', 'action_close')]
    ]);
  }

  getMainMenu() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('👨‍💼 Admin', 'menu_admin')],
      [Markup.button.callback('📊 İstatistikler', 'menu_stats')],
      [Markup.button.callback('📋 Kurallar', 'menu_rules')],
      [Markup.button.callback('ℹ️ Hakkında', 'menu_about')]
    ]);
  }

  getMuteOptions() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('15 dakika', 'mute_15')],
      [Markup.button.callback('30 dakika', 'mute_30')],
      [Markup.button.callback('1 saat', 'mute_60')],
      [Markup.button.callback('3 saat', 'mute_180')],
      [Markup.button.callback('1 gün', 'mute_1440')]
    ]);
  }

  getConfirmation() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('✅ Evet', 'confirm_yes')],
      [Markup.button.callback('❌ Hayır', 'confirm_no')]
    ]);
  }
}

module.exports = new KeyboardService();