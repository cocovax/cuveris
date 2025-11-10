import { useEffect } from 'react'
import { mqttGateway } from '../services/mqttGateway'
import { useTankStore } from '../store/tankStore'
import { useAuthStore } from '../store/authStore'

export function useMqttBridge() {
  const applyTelemetry = useTankStore((state) => state.applyTelemetry)
  const authStatus = useAuthStore((state) => state.status)

  useEffect(() => {
    if (authStatus !== 'authenticated') {
      mqttGateway.stop()
      return undefined
    }
    mqttGateway.start()
    const unsubscribe = mqttGateway.onTelemetry(applyTelemetry)
    return () => {
      unsubscribe()
    }
  }, [applyTelemetry, authStatus])
}

