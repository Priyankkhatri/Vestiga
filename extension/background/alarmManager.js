/**
 * alarmManager.js
 */

var alarmManager = {
  startAutoLockTimer() {
    chrome.alarms.create("autoLock", { delayInMinutes: 5 });
    console.log("[alarmManager] Auto-lock timer started (5 minutes).");
  }
};

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoLock") {
    console.log("[alarmManager] Auto-lock timer expired. Locking vault.");
    if (typeof self !== 'undefined' && self.authService) {
      self.authService.lock();
    }
  }
});

if (typeof self !== 'undefined') {
  self.alarmManager = alarmManager;
}
