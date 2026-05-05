const User = require('../models/User');
const ActionLog = require('../models/ActionLog');

class UserService {

  async getOrCreateUser(telegramId, userData) {
    let user = await User.findOne({ telegramId });

    if (!user) {
      user = new User({
        telegramId,
        username: userData.username ? userData.username.toLowerCase() : null,
        firstName: userData.first_name || 'Unknown',
        lastName: userData.last_name || null
      });
      await user.save();
    } else if (userData.username && user.username !== userData.username.toLowerCase()) {
      user.username = userData.username.toLowerCase();
      await user.save();
    }
    return user;
  }

  // Kullanıcı yoksa otomatik oluşturur (ban/mute/warn için güvenli versiyon)
  async getOrCreateById(telegramId) {
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({
        telegramId,
        username: null,
        firstName: 'Unknown'
      });
      await user.save();
    }
    return user;
  }

  async getUserByUsername(username) {
    if (!username) return null;
    return await User.findOne({ username: username.toLowerCase() });
  }

  async banUser(userId, reason, admin) {
    // upsert:true → kullanıcı yoksa da oluşturur



    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isBanned: true,
        banReason: reason,
        banDate: new Date()
      },
      { new: true, upsert: true }
    );
    await this.logAction(userId, 'ban', reason, admin);
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
    if (!user) return null;
    await this.logAction(userId, 'unban', 'Ban kaldırıldı', admin);
    return user;
  }

  async warnUser(userId, reason, admin) {
    // Kullanıcı yoksa önce oluştur
    await this.getOrCreateById(userId);

    const user = await User.findOneAndUpdate(
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
    if (!user) return null;
    await this.logAction(userId, 'unwarn', 'Uyarılar temizlendi', admin);
    return user;
  }

  async muteUser(userId, minutes, reason, admin) {
    const muteUntil = new Date(Date.now() + minutes * 60 * 1000);

    // upsert:true → kullanıcı yoksa da oluşturur
    const user = await User.findOneAndUpdate(
      { telegramId: userId },
      {
        isMuted: true,
        muteUntil,
        muteReason: reason
      },
      { new: true, upsert: true }
    );

    await this.logAction(userId, 'mute', `${minutes} dakika - ${reason}`, admin);
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



    if (!user) return null;
    await this.logAction(userId, 'unmute', 'Susturma kaldırıldı', admin);
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

module.exports = new UserService();const User = require(’../models/User’);
const ActionLog = require(’../models/ActionLog’);

class UserService {

async getOrCreateUser(telegramId, userData) {
let user = await User.findOne({ telegramId });

```
if (!user) {
  user = new User({
    telegramId,
    username: userData.username ? userData.username.toLowerCase() : null,
    firstName: userData.first_name || 'Unknown',
    lastName: userData.last_name || null
  });
  await user.save();
} else if (userData.username && user.username !== userData.username.toLowerCase()) {
  user.username = userData.username.toLowerCase();
  await user.save();
}
return user;
```

}

// Kullanıcı yoksa otomatik oluşturur (ban/mute/warn için güvenli versiyon)
async getOrCreateById(telegramId) {
let user = await User.findOne({ telegramId });
if (!user) {
user = new User({
telegramId,
username: null,
firstName: ‘Unknown’
});
await user.save();
}
return user;
}

async getUserByUsername(username) {
if (!username) return null;
return await User.findOne({ username: username.toLowerCase() });
}

async banUser(userId, reason, admin) {
// upsert:true → kullanıcı yoksa da oluşturur
const user = await User.findOneAndUpdate(
{ telegramId: userId },
{
isBanned: true,
banReason: reason,
banDate: new Date()
},
{ new: true, upsert: true }
);
await this.logAction(userId, ‘ban’, reason, admin);
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
if (!user) return null;
await this.logAction(userId, ‘unban’, ‘Ban kaldırıldı’, admin);
return user;
}

async warnUser(userId, reason, admin) {
// Kullanıcı yoksa önce oluştur
await this.getOrCreateById(userId);

```
const user = await User.findOneAndUpdate(
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
```

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
if (!user) return null;
await this.logAction(userId, ‘unwarn’, ‘Uyarılar temizlendi’, admin);
return user;
}

async muteUser(userId, minutes, reason, admin) {
const muteUntil = new Date(Date.now() + minutes * 60 * 1000);

```
// upsert:true → kullanıcı yoksa da oluşturur
const user = await User.findOneAndUpdate(
  { telegramId: userId },
  {
    isMuted: true,
    muteUntil,
    muteReason: reason
  },
  { new: true, upsert: true }
);

await this.logAction(userId, 'mute', `${minutes} dakika - ${reason}`, admin);
return user;
```

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
if (!user) return null;
await this.logAction(userId, ‘unmute’, ‘Susturma kaldırıldı’, admin);
return user;
}

async logAction(userId, action, reason, admin) {
try {
const log = new ActionLog({
userId,
action,
reason,
adminId: admin?.id || null,
adminUsername: admin?.username || ‘System’,
timestamp: new Date()
});
await log.save();
} catch (err) {
console.error(‘Log kaydedilemedi:’, err);
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
