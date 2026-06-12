import { LocalNotifications } from '@capacitor/local-notifications';

export const setupLocalNotifications = async () => {
  try {
    if (typeof window === 'undefined') return;
    
    // Request permission for push notifications
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') return;

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
