import { LocalNotifications } from '@capacitor/local-notifications';

export const setupLocalNotifications = async () => {
  try {
    if (typeof window === 'undefined') return;
    
    // Request permission for push notifications
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') return;

    // Criar um canal de notificação com importância MÁXIMA para forçar som e Heads-up
    try {
      await LocalNotifications.createChannel({
        id: 'missoes_urgentes',
        name: 'Lembretes de Missões',
        description: 'Avisa quando está na hora de uma missão com som alto',
        importance: 5,
        visibility: 1,
        vibration: true
      });
    } catch (e) {
      console.warn('Erro ao criar canal de notificação', e);
    }

    // Clear previously scheduled daily notifications
    await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });

    const now = new Date();
    
    // Morning (8:00 AM)
    const morning = new Date();
    morning.setHours(8, 0, 0, 0);
    if (now > morning) morning.setDate(morning.getDate() + 1);

    // Afternoon (15:00)
    const afternoon = new Date();
    afternoon.setHours(15, 0, 0, 0);
    if (now > afternoon) afternoon.setDate(afternoon.getDate() + 1);

    // Evening (20:00)
    const evening = new Date();
    evening.setHours(20, 0, 0, 0);
    if (now > evening) evening.setDate(evening.getDate() + 1);

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "A Guilda abriu! 🌅",
          body: "Pegue sua espada! Você tem novas missões diárias esperando no mural.",
          id: 1,
          schedule: { at: morning, repeats: true, every: 'day' as any },
          autoCancel: true
        },
        {
          title: "A Batalha continua! ⚔️",
          body: "Não deixe a preguiça vencer o seu herói. Como estão as missões da tarde?",
          id: 2,
          schedule: { at: afternoon, repeats: true, every: 'day' as any },
          autoCancel: true
        },
        {
          title: "A noite cai... 🏕️",
          body: "Seu HP está seguro? Lembre-se de concluir as tarefas para manter sua ofensiva!",
          id: 3,
          schedule: { at: evening, repeats: true, every: 'day' as any },
          autoCancel: true
        }
      ]
    });
    console.log("Local notifications scheduled!");
  } catch (error) {
    console.error("Error scheduling notifications:", error);
  }
};

// Generate a numeric ID from a string UUID for Capacitor LocalNotifications
const generateNumericId = (strId: string): number => {
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    const char = strId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const scheduleTaskNotification = async (task: any) => {
  try {
    if (typeof window === 'undefined') return;
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') return;

    const notifId = generateNumericId(task.id);

    // Cancel existing first if any
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });

    if (!task.due_date) return;
    if (task.completed) return;

    const extras = task.extras || {};
    const taskTime = extras.taskTime; // "HH:MM"
    if (!taskTime) return;

    const dateObj = new Date(task.due_date);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const scheduleDate = new Date(`${dateStr}T${taskTime}:00`);
    
    // offset in minutes
    const offsetMin = parseInt(extras.reminderOffset || '0');
    if (!isNaN(offsetMin) && offsetMin > 0) {
      scheduleDate.setMinutes(scheduleDate.getMinutes() - offsetMin);
    }

    if (scheduleDate.getTime() > Date.now()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Lembrete de Missão! ⚔️",
            body: `Chegou a hora de: ${task.title}`,
            id: notifId,
            schedule: { at: scheduleDate, allowWhileIdle: true },
            autoCancel: true,
            channelId: 'missoes_urgentes',
            sound: 'default'
          }
        ]
      });
      console.log(`Notification scheduled for task ${task.id} at ${scheduleDate.toString()}`);
    }
  } catch (error) {
    console.error("Error scheduling task notification:", error);
  }
};

export const cancelTaskNotification = async (taskId: string) => {
  try {
    if (typeof window === 'undefined') return;
    const notifId = generateNumericId(taskId);
    await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    console.log(`Notification canceled for task ${taskId}`);
  } catch (error) {
    console.error("Error canceling task notification:", error);
  }
};
