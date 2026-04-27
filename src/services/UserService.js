const User = require('../models/User');
const ActionLog = require('../models/ActionLog');

class UserService {
  
  async getOrCreateUser(telegramId, userData) {
    let user = await User.findOne({ telegramId });

    if (!user) {
      user = new User({
        telegramId,
        username: (userData.username || '').toLowerCase(),
        firstName: userData.first_name,
        lastName: userData.last_name || null
      });
      await user.save();
    } else if (userData.username && user.username !== userData.username.toLowerCase()) {
      // Username değişmişse güncelle
      user.username = userData.username.toLowerCase();
      await user.save();
    }
    return user;
  }

  // Yeni eklenen fonksiyon (@username ile işlem için)
  async getUserByUsername(username) {
    if (!username) return null;
    return await User.findOne({ 
      username: username.toLowerCase() 
    });
  }

  async banUser(userId, reason, admin) {
    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isBanned: true,
        banReason: reason,
        banDate: new Date()
      },
      { new: true, upsert: false }
    );
    if (user) {
      await this.logAction(userId, 'ban', reason, admin);
    }
    return user;
  }

  async unbanUser(userId, admin) {
    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isBanned: false,
        banReason: null,
        banDate: null
      },
      { new: true }
    );
    if (user) {
      await this.logAction(userId, 'unban', 'Ban kaldırıldı', admin);
    }
    return user;
  }

  async warnUser(userId, reason, admin) {
    // Kullanıcı yoksa oluştur
    let user = await User.findOne({ telegramId: userId });
    if (!user) {
      user = await this.getOrCreateUser(userId, { username: null, first_name: 'Unknown' });
    }

    user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        $inc: { warnings: 1 },
        $push: {
          warningHistory: {
            date: new Date(),
            reason,
            adminId: admin.id,
            adminUsername: admin.username
          }
        }
      },
      { new: true }
    );

    await this.logAction(userId, 'warn', reason, admin);
    return user;
  }

  async unwarnUser(userId, admin) {
    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        warnings: 0,
        warningHistory: []
      },
      { new: true }
    );
    if (user) {
      await this.logAction(userId, 'unwarn', 'Uyarılar temizlendi', admin);
    }
    return user;
  }

  async muteUser(userId, minutes, reason, admin) {
    const muteUntil = new Date(Date.now() + minutes * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isMuted: true,
        muteUntil,
        muteReason: reason
      },
      { new: true }
    );

    if (user) {
      await this.logAction(userId, 'mute', `${minutes} dakika - ${reason}`, admin);
    }
    return user;
  }

  async unmuteUser(userId, admin) {
    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isMuted: false,
        muteUntil: null,
        muteReason: null
      },
      { new: true }
    );
    if (user) {
      await this.logAction(userId, 'unmute', 'Susturma kaldırıldı', admin);
    }
    return user;
  }

  async logAction(userId, action, reason, admin) {
    try {
      const log = new ActionLog({
        userId,
        action,
        reason,
        adminId: admin?.id || null,
        adminUsername: admin?.username || 'System',
        timestamp: new Date()
      });
      await log.save();
    } catch (err) {
      console.error('Log kaydedilemedi:', err);
    }
  }

  async getRecentLogs(limit = 10) {
    return await ActionLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  async getUserStats(userId) {
    return await User.findOne({ telegramId: userId });
  }
}

module.exports = new UserService();
