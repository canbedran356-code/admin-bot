const User = require('../models/User');
const ActionLog = require('../models/ActionLog');

class UserService {

  async getOrCreateUser(telegramId, data = {}) {
    let user = await User.findOne({ telegramId });

    if (!user) {
      user = new User({
        telegramId,
        username: data.username,
        firstName: data.first_name,
        lastName: data.last_name,
        joinDate: new Date(),
      });
      await user.save();
    }

    return user;
  }

  async getUserStats(telegramId) {
    return await User.findOne({ telegramId });
  }

  async banUser(telegramId, reason, admin) {
    const user = await this.getOrCreateUser(telegramId);
    user.isBanned = true;
    await user.save();

    await this.logAction(telegramId, 'ban', reason, admin);

    return user;
  }

  async unbanUser(telegramId, admin) {
    const user = await this.getOrCreateUser(telegramId);
    user.isBanned = false;
    await user.save();

    await this.logAction(telegramId, 'unban', 'Ban kaldırıldı', admin);

    return user;
  }

  async warnUser(telegramId, reason, admin) {
    const user = await this.getOrCreateUser(telegramId);
    user.warnings = (user.warnings || 0) + 1;
    await user.save();

    await this.logAction(telegramId, 'warn', reason, admin);

    return user;
  }

  async unwarnUser(telegramId, admin) {
    const user = await this.getOrCreateUser(telegramId);
    user.warnings = 0;
    await user.save();

    await this.logAction(telegramId, 'unwarn', 'Uyarılar temizlendi', admin);

    return user;
  }

  async muteUser(telegramId, minutes, reason, admin) {
    const user = await this.getOrCreateUser(telegramId);
    user.isMuted = true;
    user.muteUntil = new Date(Date.now() + minutes * 60000);
    await user.save();

    await this.logAction(telegramId, 'mute', reason, admin);

    return user;
  }

  async unmuteUser(telegramId, admin) {
    const user = await this.getOrCreateUser(telegramId);
    user.isMuted = false;
    user.muteUntil = null;
    await user.save();

    await this.logAction(telegramId, 'unmute', 'Susturma kaldırıldı', admin);

    return user;
  }

  async logAction(telegramId, action, reason, admin) {
    const log = new ActionLog({
      telegramId,
      action,
      reason,
      adminId: admin.id,
      adminUsername: admin.username,
      timestamp: new Date(),
    });

    await log.save();
  }

  async getRecentLogs(limit = 10) {
    return await ActionLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

module.exports = new UserService();
