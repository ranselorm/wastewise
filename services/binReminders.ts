import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { BinCollection } from "./binCollection";

const CHANNEL_ID = "wastewise-bin-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

function reminderDate(collectionDate: string): Date | null {
  const match = collectionDate
    .trim()
    .match(/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (!match) return null;
  const month = months.indexOf(match[2].toLowerCase());
  if (month < 0) return null;
  const date = new Date(Number(match[3]), month, Number(match[1]) - 1, 19, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function ensurePermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Bin collection reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleBinReminders(
  collections: BinCollection[],
): Promise<number> {
  if (!(await ensurePermission())) {
    throw new Error("Allow notifications to receive bin reminders.");
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const grouped = new Map<string, string[]>();
  for (const collection of collections) {
    grouped.set(collection.date, [
      ...(grouped.get(collection.date) ?? []),
      collection.binType,
    ]);
  }

  let scheduled = 0;
  for (const [date, binTypes] of grouped) {
    const reminder = reminderDate(date);
    if (!reminder || reminder.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Collection tomorrow",
        body: `Put your ${[...new Set(binTypes)].join(", ")} out tonight.`,
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder },
    });
    scheduled += 1;
  }
  return scheduled;
}

export async function cancelBinReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
