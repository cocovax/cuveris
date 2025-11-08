import { useEffect } from 'react'
import { mqttGateway } from '../services/mqttGateway'
import { useTankStore } from '../store/tankStore'

export function useMqttBridge() {
  const applyTelemetry = useTankStore((state) => state.applyTelemetry)

  useEffect(() => {
    mqttGateway.start()
    const unsubscribe = mqttGateway.onTelemetry(applyTelemetry)
    return () => {
      unsubscribe()
    }
  }, [applyTelemetry])
}

