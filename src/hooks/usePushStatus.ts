import { useCallback, useEffect, useState } from "react";
import { notificationPermissionStatus, type PawfolioNotificationStatus } from "../pawfolio";

export function usePushStatus() {
  const [pushPermission, setPushPermission] = useState<PawfolioNotificationStatus>(
    notificationPermissionStatus(globalThis.Notification),
  );
  const [hasPushSubscription, setHasPushSubscription] = useState(false);

  const refreshPushStatus = useCallback(async () => {
    setPushPermission(notificationPermissionStatus(globalThis.Notification));
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setHasPushSubscription(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setHasPushSubscription(Boolean(subscription));
    } catch {
      setHasPushSubscription(false);
    }
  }, []);

  useEffect(() => {
    void refreshPushStatus();
  }, [refreshPushStatus]);

  return {
    pushPermission,
    hasPushSubscription,
    refreshPushStatus,
  };
}
